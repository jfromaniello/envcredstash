const Credstash = require('nodecredstash');
const AWS = require('aws-sdk');
const _ = require('lodash');
const async = require('async');

function credstash(config) {
  const credstash = new Credstash({
    table: config.table,
    awsOpts: { region: config.region },
    kmsOpts: {
      maxRetries: 10,
      retryDelayOptions: {
        customBackoff: () => _.random(500, 1500)
      }
    }
  });

  //This uses a Global Secondary Index called "PrefixIndex"
  //where the HashKey is called "prefix" and it has an sort key called "active".
  //This is an optimization that can be done either in the code inserting the secret
  //or through a lambda subscribed to the dynamodb stream.
  //This code needs more testing.
  credstash.getByPrefixFast = (params, callback) => {
    if (typeof params === 'function') {
      callback = params;
      params = {};
    }
    const documentClient = new AWS.DynamoDB.DocumentClient({ region: config.region });
    documentClient.query({
      TableName: config.table,
      IndexName: 'PrefixIndex',
      ExpressionAttributeNames: {
        '#name': 'name',
      },
      ProjectionExpression: '#name, version',
      ExclusiveStartKey: params.exclusiveStartKey,
      KeyConditionExpression: 'prefix = :prefix',
      ExpressionAttributeValues: {
        ':prefix': params.prefix.replace(/\/$/, '')
      }
    }, (err, result) => {
      if (err) { return callback(err); }
      if (!result.LastEvaluatedKey) {
        return callback(null, _.sortBy(result.Items.concat(params.previousItems || []), ['name']));
      }
      credstash.getLatestSecrets(_.extend({}, params, {
        exclusiveStartKey: result.LastEvaluatedKey,
        previousItems: result.Items
      }), callback);
    });
  };

  credstash.getByPrefixesFast = (params, callback) => {
    async.map(params.prefixes, (prefix, callback) => {
      credstash.getByPrefixFast({ prefix }, callback);
    }, (err, byPrefix) => {
      if (err) { return callback(err); }
      callback(null, _.flatten(byPrefix));
    });
  };

  credstash.getByPrefixesSlow = (params, callback) => {
    credstash.listSecrets((err, secretWithVersions) => {
      if (err) { return callback(err); }
      const allSecrets = _(secretWithVersions)
                            .map(s => s.name)
                            .uniq()
                            .filter(s => params.prefixes.some(p => s.indexOf(p) === 0))
                            .map(name => ({ name }))
                            .value();

      callback(null, allSecrets);
    });
  };

  credstash.getByPrefixes = (params, callback) => {
    credstash.getByPrefixesFast(params, (err, names) => {
      if (err) {
        return credstash.getByPrefixesSlow(params, callback);
      }
      callback(null, names);
    });
  };

  return credstash;
}

module.exports = credstash;

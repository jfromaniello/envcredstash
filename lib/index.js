const async = require('async');
const Credstash = require('nodecredstash');
const _ = require('lodash');

function pathToEnv(p) {
  return  p.replace(/[^\w]/g, '_')
           .toUpperCase();
}

module.exports.get = function(params, callback) {
  const credstash = new Credstash({
    table: params.table,
    awsOpts: { region: params.region }
  });

  const prefixes = Array.isArray(params.prefix) ? params.prefix : [''];

  credstash.listSecrets((err, secretWithVersions) => {
    if (err) {
      return callback(err);
    }

    const allSecrets = _(secretWithVersions)
                                .map(s => s.name)
                                .uniq()
                                .value();

    var envs = [];

    prefixes.forEach(prefix => {
      allSecrets
        .filter(name => name.indexOf(prefix) === 0)
        .forEach(name => {
          const env = pathToEnv(name.replace(prefix, ''));
          //Override the variables from other prefixes
          envs = envs.filter(e => e.env !== env)
                     .concat({ name, env });
        });
    });

    async.each(envs, (env, done) => {
      credstash.getSecret({ name: env.name }, (err, value) => {
        if (err) { return done(err); }
        env.value = value;
        done();
      });
    }, (err) => {
      if (err) {
        return callback(err);
      }

      const env = envs.reduce((result, env) => {
        result[env.env] = env.value;
        return result;
      }, {});

      callback(null, env);
    });
  });
};

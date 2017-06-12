'use strict';
const $require = require('mockuire')(module);
const assert = require('chai').assert;

class FakeCredstash {
  constructor(params) {
    if (params.awsOpts.region !== 'region-xyz') {
      throw new Error('unknown region');
    }
    if (params.table !== 'credstash-table') {
      throw new Error('wrong table name');
    }
    this._params = params;
    this._secrets = {
      'app1/secret': 'a',
      'app2/secret': 'b',
      'common/secret': 'c',
      'common/password': 'x',
      'password': 'x',
    };
  }

  listSecrets(callback) {
    callback(null, Object.keys(this._secrets).map(name => ({name})));
  }

  getSecret(params, callback) {
    callback(null, this._secrets[params.name]);
  }
}

const envcredstash = $require('../lib', { nodecredstash: FakeCredstash });

describe('envcredstash', () => {

  it('should return the env correctly formated', (done) => {
    envcredstash.get({
      region: 'region-xyz',
      table: 'credstash-table',
      prefix: [ 'app1/' ]
    }, (err, env) => {
      if (err) { return done(err); }
      assert.equal(Object.keys(env).length, 1);
      assert.equal(env.SECRET, 'a');
      done();
    });
  });

  it('should work without prefix', (done) => {
    envcredstash.get({
      region: 'region-xyz',
      table: 'credstash-table'
    }, (err, env) => {
      if (err) { return done(err); }
      assert.equal(Object.keys(env).length, 5);
      assert.equal(env.APP1_SECRET, 'a');
      assert.equal(env.APP2_SECRET, 'b');
      assert.equal(env.COMMON_SECRET, 'c');
      assert.equal(env.COMMON_PASSWORD, 'x');
      assert.equal(env.PASSWORD, 'x');
      done();
    });
  });

  it('should work with multiple prefixes', (done) => {
    envcredstash.get({
      region: 'region-xyz',
      table:  'credstash-table',
      prefix: [ 'common/', 'app1/' ]
    }, (err, env) => {
      if (err) { return done(err); }
      assert.equal(Object.keys(env).length, 2);
      assert.equal(env.SECRET, 'a');
      assert.equal(env.PASSWORD, 'x');
      done();
    });
  });

});

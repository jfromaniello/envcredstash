const async = require('async');
const Credstash = require('nodecredstash');
const _ = require('lodash');
const spawnSync = require('child_process').spawnSync;

function pathToEnv(p) {
  return  p.replace(/[^\w]/g, '_')
           .toUpperCase();
}

module.exports.getSync = function(params) {
  const args = [__dirname + '/bin/envcredstash', '--json'];

  if (Array.isArray(params.prefixes)) {
    args.push('--prefix');
    args.push(params.prefixes.join(','));
  } else if (Array.isArray(params.prefix)) {
    args.push('--prefix');
    args.push(params.prefix.join(','));
  } else if (typeof params.prefix === 'string') {
    args.push('--prefix');
    args.push(params.prefix);
  }

  if (params.table) {
    args.push('--table');
    args.push(params.table);
  }

  if (params.region) {
    args.push('--region');
    args.push(params.region);
  }

  const proc = spawnSync(process.execPath, args, {
    stdio: 'pipe',
    encoding: 'utf8'
  });

  if (proc.error) { throw proc.error; }

  if (proc.status !== 0) {
    throw new Error(proc.stderr.toString());
  }

  const stdout = proc.stdout.toString();
  return JSON.parse(stdout);
};

module.exports.get = function(params, callback) {
  const credstash = new Credstash({
    table: params.table,
    awsOpts: { region: params.region }
  });

  var prefixes;

  if (Array.isArray(params.prefixes)) {
    prefixes = params.prefixes;
  } else if (Array.isArray(params.prefix)) {
    prefixes = params.prefix;
  } else if (typeof params.prefix === 'string') {
    prefixes = [params.prefix];
  } else {
    prefixes = [''];
  }

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

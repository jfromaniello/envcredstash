const async = require('async');
const Credstash = require('./lib/credstash');
const spawnSync = require('child_process').spawnSync;

function pathToEnv(p) {
  return  p.replace(/[^\w]/g, '_')
           .toUpperCase();
}

module.exports.getSync = function(params) {
  const args = [__dirname + '/bin/envcredstash', '--json'];

  if (Array.isArray(params.prefixes)) {
    params.prefixes.forEach(p => {
      args.push('--prefix');
      args.push(p);
    });
  } else if (Array.isArray(params.prefix)) {
    params.prefix.forEach(p => {
      args.push('--prefix');
      args.push(p);
    });
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
    args.push(params.region || process.env.AWS_REGION);
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

function getAsync(params, callback) {
  const credstash = Credstash(params);

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

  credstash.getByPrefixes({ prefixes }, (err, secrets) => {
    if (err) {
      return callback(err);
    }

    var envs = [];

    prefixes.forEach(prefix => {
      secrets
        .filter(s => s.name.indexOf(prefix) === 0)
        .forEach(s => {
          const env = pathToEnv(s.name.replace(prefix, ''));
          //Override the variables from other prefixes
          envs = envs.filter(e => e.env !== env)
                     .concat({ name: s.name, version: s.version, env });
        });
    });

    async.each(envs, (env, done) => {
      credstash.getSecret({ name: env.name, version: env.version }, (err, value) => {
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

module.exports.get = function(params, callback) {
  if (typeof callback === 'function') {
    return getAsync(params, callback);
  }

  return new Promise((resolve, reject) => {
    getAsync(params, (err, result) => {
      if (err) { return reject(err); }
      resolve(result);
    });
  });
};

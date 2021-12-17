Load [credstash](https://github.com/fugue/credstash) secrets into environment variables.

This project is inspired by [envconsul](https://github.com/hashicorp/envconsul).

## Installation

```shell
sudo npm i -g envcredstash
```

## Usage

Start by storing some secrets with credstash as follows:

```shell
credstash put application/DB_PASSWORD my-db-password
credstash put application/MAIL_PASSWORD my-mail-password
```

Then you can run your application as follows:

```shell
envcredstash --prefix application/ -- myapplication
```

Example:

```shell
envcredstash --prefix application/ -- python -c "import os; print os.environ['MAIL_PASSWORD']"

my-mail-password
```

Running `env`:

```shell
envcredstash --prefix application/ -- env
DB_PASSWORD=my-db-password
MAIL_PASSWORD=my-mail-password
```

You can also print the variables with the `export` clause, this is useful to `source`:

```shell
source <(envcredstash --prefix application/ --export)

python -c "import os; print os.environ['MAIL_PASSWORD']"
my-mail-password
```

## Full list of arguments

```shell
envcredstash --help
Options:
  --version  Show version number                                       [boolean]
  --table    The credstash table.                  [default: "credential-store"]
  --prefix   The credstash prefix for keys.              [array] [default: [""]]
  --region   The credstash region.
  --export   Export variables syntax.                                  [boolean]
  --list     Export variables syntax.                                  [boolean]
  --json     Export variables syntax.                                  [boolean]
  --help     Show help                                                 [boolean]
```

## As a library

```js
const envcredstash = require('envcredstash');

envcredstash.get({
  prefixes: ['application/'],
  // table:
  // region:
}, (err, envs) => {
  console.dir(envs);
  //{
  //  DB_PASSWORD: "my-db-password"
  //  MAIL_PASSWORD: "my-mail-password"
  //}
});
```

## License

MIT 2017 - José F. Romaniello


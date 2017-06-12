Load [credstash](https://github.com/fugue/credstash) secrets into environment variables.

This project is inspired by [envconsul](https://github.com/hashicorp/envconsul).

## Installation

```
sudo npm i -g envcredstash
```

## Usage

Start by storing some secrets with credstash as follows:

```
credstash put application/DB_PASSWORD my-db-password
credstash put application/MAIL_PASSWORD my-mail-password
```

Then you can run your application as follows:

```
envcredstash --credstash-table 'credential-store' \
             --region us-east-2 \
             --prefix application/ \
             -- myapplication
```

Example:

```
envcredstash --credstash-table 'credential-store' \
             --region us-east-2 \
             --prefix application/ \
             -- python -c "print os.environ['MAIL_PASSWORD']"

my-mail-password
```

Running `env`:

```
envcredstash --credstash-table 'credential-store' \
             --region us-east-2 \
             --prefix application/ \
             -- python -c "print os.environ['MAIL_PASSWORD']"
DB_PASSWORD=my-db-password
MAIL_PASSWORD=my-mail-password
```

You can also print the variables with the `export` clause, this is useful to `source`:

```
source <(envcredstash --credstash-table 'credential-store' \
             --region us-east-2 \
             --prefix application/ \
             --export)

python -c "print os.environ['MAIL_PASSWORD']"
my-mail-password
```

## License

MIT 2017 - José F. Romaniello

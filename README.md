# Simple, Environment Friendly Config With Section Substitution and Inheritance

Example `config.json`:

    {
        "default": {
            "logger": {
                "level": "ENV:X_LEVEL:info"
            },
            "things": [
                { "foo": "ENV:X_FOO:bar" }
            ],
            "sp": {
                "type": "memory",
                "connection": {
                    "host": "localhost"
                }
            }
        },
        "staging": {
            "logger": "REF:default.logger",
            "things": [
                { "foop": "barp" },
                "REF:default.things[0]"
            ],
            "INHERIT:sp:default.sp": {
                "connection": {
                    "host": "10.10.10.10",
                    "port": 40
                }
            }
        }
    }
        
Example `app.js`:

    var config = require( 'env-friendly-config' )( './config.json' );
    console.log( JSOB.stringify( config, null, 2 ) );

Example run:

    X_LEVEL=debug X_FOO=PEEB node app.js

Example output:

    {
        "default": {
            "logger": {
                "level": "debug"
            },
            "things": [
                {
                    "foo": "PEEB"
                }
            ],
            "sp": {
                "type": "memory",
                "connection": {
                    "host": "localhost"
                }
            }
        },
        "staging": {
            "logger": {
                "level": "debug"
            },
            "things": [
                {
                    "foop": "barp"
                },
                {
                    "foo": "PEEB"
                }
            ],
            "sp": {
                "type": "memory",
                "connection": {
                    "host": "10.10.10.10",
                    "port": 40
                }
            }
        }
    }
    
enuf said.

**Although ...**

At the same level in the directory tree as your "config.json", you may have a number of ".env.*" files that will be
parsed first into `process.env` so they are visible in "ENV:..." statements.  This is to support keeping .env files
out of revision control and keeping secrets in these .env files (which can then be used in docker-compose files, etc).
First ".env.common" is looked for and if found, sourced.  Then ".env.<NODE_ENV>" is looked for and sourced if found.
The format of these files are compatible with the .env_file format dictated by docker-compose.  Blank lines and lines
that begin with '#' are tolerated.  Example:

    # My AWS account
    aws.accessKeyId=123456789
    aws.secretAccessKey=xxxyyyzzz
    
    # My database creds
    database.auth.user=andrew
    database.auth.pass=secret
    
You can then refer to "ENV:aws.accessKeyId" in your config.json.

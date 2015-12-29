# Simple, Environment Friendly Config With Section Substitution

Example `config.json`:

    {
        "default": {
            "logger": {
                "level": "ENV:X_LEVEL:info"
            },
            "things": [
                { "foo": "ENV:X_FOO:bar" }
            ]
        },
        "staging": {
            "logger": "REF:default.logger",
            "things": [
                { "foop": "barp" },
                "REF:default.things[0]"
            ]
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
        ]
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
        ]
      }
    }

enuf said.

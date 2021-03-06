var _ = require( 'lodash' );
var fs = require( 'fs' );
var path = require( 'path' );

module.exports = function( filename ) {
  // Handle .env.* files
  var Blank = new RegExp(/^\s*$/);
  var Comment = new RegExp(/^#/);
  var Line = new RegExp(/^([^=]+)=(.*)/);
  function parseEnvFile(fname) {
    var lines = fs.readFileSync(fname).toString().split("\n");
    lines.forEach((line) => {
      line = line.trim();
      if ( Blank.test(line) ) return;
      if ( Comment.test(line) ) return;
      var info = line.match(Line);
      if ( info && info[1] && info[2] ) {
        process.env[info[1]] = info[2];
      }
    });
  }

  if ( filename instanceof Object ) {
    var originalJson = filename;
  }
  else {
    try {
      var originalJson = require( filename );
      var CommonEnvFile = path.join( path.dirname( filename ), '.env.common' );
      if ( fs.existsSync( CommonEnvFile ) ) parseEnvFile( CommonEnvFile );
      var EnvFile;
      if ( ! process.env.NODE_ENV ) EnvFile = path.join( path.dirname( filename ), '.env.local' );
      else EnvFile = path.join( path.dirname( filename ), '.env.' + process.env.NODE_ENV );
      if ( fs.existsSync( EnvFile ) ) parseEnvFile( EnvFile );
    } catch( err ) {
      return err;
    }
  }

  function resolveDockerHost() {
    var dh = 'localhost';
    if ( process.env.DOCKER_HOST ) {
      dh = process.env.DOCKER_HOST;
      dh = dh.replace( /^[^:.]+:\/\//, '').replace(/:.+/, '');
    }
    return dh;
  }

  function resolveEnv( val ) {
    if ( ! val ) return val;
    if ( val.toString().match(/DOCKER_HOST/) ) val = val.replace('DOCKER_HOST',resolveDockerHost() );
    if ( ! val.toString().match( /^ENV:/ ) ) return val;
    var parts = val.split(':');
    parts.shift();
    var envvar = parts.shift();
    var defvar = parts.join(':');
    var v = ( process.env[ envvar ] || defvar );
    if ( v.match( /^\d+$/ ) ) v = Number( v );
    else if ( v == 'true' ) v = true;
    else if ( v == 'false' ) v = false;
    else if ( v == 'null' ) v = null;
    return v;
  }
  function resolveRef( val, p ) {
    if ( ! val.toString().match( /^REF:/ ) ) return val;
    var path = val.split(':')[1];
    if ( _.has( json, path ) ) return _.get( json, path );
    var clone = p.slice(0);
    while( clone.length ) {
      if ( _.has( json, clone.join('.') + '.' + path ) ) {
	return _.get( json, clone.join('.') + '.' + path );
      }
      clone.pop();
    }
    return null;
  }
  function walkArray( a, p, fcn ) {
    a.forEach( function( v, index ) {
      if ( v instanceof Array ) {
	walkArray( v, p, fcn );
      }
      else if ( v instanceof Object ) {
	walk( v, p, fcn );
      }
      else {
	a[ index ] = fcn( v, p );
      }
    });
  }
  function walk( o, p, fcn ) {
    _.forIn( o, function( v, k ) {
      if ( v instanceof Array ) {
	walkArray( v, p.concat( k ), fcn );
      }
      else if ( v instanceof Object ) {
	walk( v, p.concat( k ), fcn );
      }
      else {
	o[ k ] = fcn( v, p );
      }
    });
  }
  function inherit( o ) {
    _.forIn( o, function( v, k ) {
      if ( v instanceof Array ) {
	// do not mess with arrays
      }
      else if ( v instanceof Object ) {
	if ( k.match(/^INHERIT:/) ) {
	  var keyname = k.split(':')[1];
	  var path = k.split(':')[2];
	  var val = _.cloneDeep( _.get( json, path ) );
	  var newval = _.merge( val, v );
	  o[ keyname ] = newval;
	  delete o[ k ];
	}
	else {
	  inherit( v );
	}
      }
    });
  }
  var json = _.cloneDeep( originalJson );
  walk( json, [], resolveEnv );
  walk( json, [], resolveRef );
  inherit( json );
  return json;
};

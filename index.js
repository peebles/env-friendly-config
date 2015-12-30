var _ = require( 'lodash' );
module.exports = function( filename ) {
    try {
	var json = require( filename );
    } catch( err ) {
	return err;
    }
    function resolveEnv( val ) {
	if ( ! val ) return val;
	if ( ! val.toString().match( /^ENV:/ ) ) return val;
	var parts = val.split(':');
	parts.shift();
	var envvar = parts.shift();
	var defvar = parts.join('');
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
    walk( json, [], resolveEnv );
    walk( json, [], resolveRef );
    inherit( json );
    return json;
};

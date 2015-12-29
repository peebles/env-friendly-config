var _ = require( 'lodash' );
module.exports = function( filename ) {
    try {
	var json = require( filename );
    } catch( err ) {
	return err;
    }
    function resolveEnv( val ) {
	if ( ! val ) return val;
	if ( ! val.match( /^ENV:/ ) ) return val;
	var envvar = val.split(':')[1];
	var defvar = val.split(':')[2];
	var v = ( process.env[ envvar ] || defvar );
	if ( v.match( /^\d+$/ ) ) v = Number( v );
	else if ( v == 'true' ) v = true;
	else if ( v == 'false' ) v = false;
	else if ( v == 'null' ) v = null;
	return v;
    }
    function resolveRef( val ) {
	if ( ! val.match( /^REF:/ ) ) return val;
	var path = val.split(':')[1];
	return _.get( json, path );
    }
    function walkArray( a, fcn ) {
	a.forEach( function( v, index ) {
	    if ( v instanceof Array ) {
		walkArray( v, fcn );
	    }
	    else if ( v instanceof Object ) {
		walk( v, fcn );
	    }
	    else {
		a[ index ] = fcn( v );
	    }
	});
    }
    function walk( o, fcn ) {
	_.forIn( o, function( v, k ) {
	    if ( v instanceof Array ) {
		walkArray( v, fcn );
	    }
	    else if ( v instanceof Object ) {
		walk( v, fcn );
	    }
	    else {
		o[ k ] = fcn( v );
	    }
	});
    }
    walk( json, resolveEnv );
    walk( json, resolveRef );
    return json;
};

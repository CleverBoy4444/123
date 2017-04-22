var fs = require ( 'fs' ),
	resolveQueries = require ( './queries/resolve-queries.js' );

module.exports = function dbConfig ( db, name, callback, error, log ) {
   
	log ( 'loading table definitions...' );
   
	function next ( err, result ) {
		if ( err ) {
			error ( err );
		} else {
			callback ( null, db );
		}
	}
	
	fs.readFile ( './db-config/tables.sql', 'utf8', function ( err, data ) {
		if ( err ) {
			error ( err );
			return;
		}
		
		log ( 'table definitions loaded, building database ' + name + '...' );
		
		var resolveTransaction = resolveQueries ( db ),
			queries = data
			.split ( '${name}' )
			.join ( name )
			.split ( /\n\n/g )
			.map ( function ( e ) {
				return [ log.bind ( null, 'resolving query: ' + e.split ( '(' ) [ 0 ] ), e, error ];
			} );
		// next ( 'cannot create database, transactions are not properly configured ( see "forum-server/config.js:31" )' );
		resolveTransaction ( queries, error, next );
	} );
};
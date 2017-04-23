var fs = require ( 'fs' ),
	resolveQueries = require ( './queries/resolve-queries.js' );

module.exports = function config ( db, name, callback, error, log ) {
	
	log ( 'loading table definitions...' );
	
	fs.readFile ( './db-config/tables.sql', 'utf8', function ( err, data ) {
		if ( err ) {
			error ( err );
			return;
		}
		
		log ( 'table definitions loaded, building database ' + name + '...' );
		
		var resolveTransaction = resolveQueries.init ( db ),
			queries = data
			.split ( '${name}' )
			.join ( '`' + name + '`' )
			.split ( /\n\n/g )
			.map ( function ( e ) {
				return [ log.bind ( null, 'resolving query: ' + e.split ( ' ' ).slice ( 0, 3 ).join ( ' ' ) ), e ];
			} );
		// next ( 'cannot create database, transactions are not properly configured ( see "forum-server/config.js:31" )' );
		console.log ( 'CREATING DATABASE...' );
		resolveTransaction ( [ queries.shift () ], function ( err ) {
			if ( err ) {
				console.log ( err );
			} else {
				console.log ( 'database created...' );
				console.log ( 'BUILDING TABLES...' );
				resolveTransaction ( queries, function ( err ) {
					console.log ( err );
				}, callback );
			}
		} );
	} );
};
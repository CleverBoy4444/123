var mysql = require ( 'mysql' );

function formatQuery ( sql, params, res, err ) {
	if ( typeof params === 'function' ) {
		if ( typeof res === 'function' ) {
			return [ sql, params, res ];
		} else {
			return [ sql, params ];
		}
	} else {
		if ( typeof err === 'function' ) {
			return [ mysql.format ( sql, params ), res, err ];
		} else {
			return [ mysql.format ( sql, params ), res ];
		}
	}
}

/**
 * example:
 *	var queries = [
 *		[
 *			'select ?? from user where role=?',
 *			[ 'id', 'admin' ],
 *			function ( rows ) {...},
 *			function ( err ) {...}
 *		],[
 *			'select ?? from user where login=?'
 *			[ 'name', true ]
 *			function ( rows ) {...},
 *			function ( err ) {...}
 *		]
 *	],
 *	next = function () {
 *		// all done!
 *	};
 * 
 * resolveQueries ( connection, queries, next );
 */

exports = function resolveQueries ( db, queries, next ) {
	var params = queries.shift ();
	if ( params ) {
		params = formatQuery.apply ( null, params );
		
		db.query ( params [ 0 ], function ( err, rows, field ) {
			// report errors if they occur
			if ( err ) {
				if ( params [ 1 ] ) {
					params [ 1 ] ( err );
				}
			} else {
				// make sure we have a results function
				// ( may not be needed with next() )
				if ( params [ 2 ] ) {
					params [ 2 ] ( rows );
				}
			}
			
			if ( queries.length > 0 ) {
				resolveQueries ( db, queries, next );
			} else {
				next ();
			}
		} );
	}
};
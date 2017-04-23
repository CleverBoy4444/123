var mysql = require ( 'mysql' ),
	db;

function formatQuery ( before, sql, params, err, then ) {
	
	var args = Array.prototype.slice.call ( arguments ),
		n = typeof args [ 1 ] === 'object' ? 1 : typeof args [ 2 ] === 'object' ? 2 : 0;
	
	if ( n ) {
		args [ n - 1 ] = mysql.format ( args [ n - 1 ], args.splice ( n, 1 ) [ 0 ] );
		return args;
	}
	
	return args;
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

function unstackQueries ( conn, stack, failed, next ) {
	
	next = next || failed;
	
	var args = formatQuery.apply ( null, stack.shift () ),
		before, sql, error, callback;
	
	before = typeof args [ 0 ] === 'function' ? args.shift () : null;
	
	if ( typeof args [ 0 ] === 'string' ) {
		sql = args.shift ();
	} else {
		failed ( new TypeError ( 'cannot perform query on type "' + ( typeof args [ 0 ] ) + '"' ) );
		return;
	}
	
	error = typeof args [ 1 ] === 'function' ? args.shift () : failed;
	
	callback = typeof args [ 0 ] === 'function' ? args.shift () : null;
	
	if ( sql ) {
		
		// before running the individual query [optional], mainly for debugging
		if ( typeof before === 'function' ) {
			before ( sql );
		}
		
		conn.query ( sql, function ( err, results, field ) {
			// report errors if they occur
			if ( err ) {
				conn.rollback ( function () {
					if ( error === callback ) {
						failed ( err );
					} else {
						error ( err );
					}
					console.error ( err );
				} );
				
			} else {
				
				if ( callback ) {
					callback.call ( stack, results, field );
				}
				
				if ( stack.length > 0 ) {
					unstackQueries ( conn, stack, failed, next );
				} else {
					// commit does not release the connection because
					// other transactions may follow
					conn.commit ( function ( err ) {
						if ( err ) {
							failed ( err );
							console.log ( err );
						} else {
							conn.release ();
							next ();
						}
					} );
				}
			}
		} );
	}
}


// transaction class {

// var sqlx = function SQLTransaction () {
// 	this.stack = [];
// 	this.queries = {};
// };

// ( function ( proto ) {
	
// 	proto.addQuery = function addQuery ( id, sql, params, error, then, before ) {
		
// 		var args = Array.prototype.slice.call ( arguments );
		
// 		if ( typeof sql === 'string' ) {
// 			this.queries [ args.shift () ] = { query: sql, params: params };
// 		}
		
// 		this.stack.push ( args );
		
// 		return this;
// 	};
	
// 	proto.set = function ( id, data ) {
// 		if ( id in this.queries ) {
// 			var value = this.queries [ id ],
// 				params = value.params;
// 			for ( var key in params ) {
// 				if ( key in data ) {
// 					params [ key ] = data [ key ];
// 				}
// 			}
// 		}
// 	};
	
// 	proto.execute = function execute ( connection, error, next ) {
// 		connection.beginTransaction ( function ( err ) {
// 			if ( err ) {
// 				if ( typeof error === 'function' ) {
// 					error ( err );
// 				} else if ( typeof then === 'function' ) {
// 					next ( err );
// 				}
// 			} else {
// 				unstackQueries ( connection, this.stack, error, next );
// 			}
// 		} );
// 	};
	
// } ) ( sqlx.prototype );

// sqlx.transactions = {};

// sqlx.describe = function describe ( id ) {
// 	return sqlx.transactions [ id ] = new sqlx ();
// };

// }


exports.init = function init ( database ) {
	
	db = database;
	
	return function resolveQueries ( stack, error, then ) {
		
		db.getConnection ( function ( err, conn ) {
			if ( err ) {
				error ( err );
				console.log ( err );
			} else {
				conn.beginTransaction ( function ( err ) {
					if ( err ) {
						error ( err );
					} else {
						console.log ( 'unstacking' );
						unstackQueries ( conn, stack, error, then );
						//conn.release ();	// release back to connection pool
					}
				} );
			}
		} );
	};
};
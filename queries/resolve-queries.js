var mysql = require ( 'mysql' );

function formatQuery ( sql, params, err, then, before ) {
	
	var args = Array.prototype.slice.call ( arguments );
	
	if ( typeof args [ 1 ] === 'object' ) {
		sql = args.shift ();
		args [ 0 ] = mysql.format ( sql, args [ 0 ] );
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

function unstackQueries ( db, stack, failed, next ) {
	
	next = next || failed;
	
	var args = formatQuery.apply ( null, stack.shift () ),
		sql = args [ 0 ],
		error,
		callback,
		before;
	
	if ( args.length === 4 ) {
		before = args [ 3 ];
		callback = args [ 2 ];
		error = args [ 1 ];
	} else {
		if ( args.length === 3 ) {
			before = args [ 2 ];
		}
		callback = error = args [ 1 ];
	}
	
	if ( sql ) {
		
		if ( typeof before === 'string' ) {
			console.log ( before );
		} else if ( typeof before === 'function' ) {
			before ();
		}
		
		db.query ( sql, function ( err, results, field ) {
			// report errors if they occur
			if ( err ) {
				db.rollback ( function () {
					error ( err );
				} );
			} else {
				
				if ( error === callback ) {
					callback ( null, results, field );
				} else {
					callback ( results, field );
				}
				
				if ( stack.length > 0 ) {
					unstackQueries ( db, stack, failed, next );
				} else {
					db.commit ( function ( err ) {
						if ( err ) {
							failed ( err );
						} else {
							next ();
						}
					} );
				}
			}
		} );
	}
}

var sqlx = function SQLTransaction () {
	this.stack = [];
	this.queries = {};
};

( function ( proto ) {
	
	proto.addQuery = function addQuery ( id, sql, params, error, then, before ) {
		
		var args = Array.prototype.slice.call ( arguments );
		
		if ( typeof sql === 'string' ) {
			this.queries [ args.shift () ] = { query: sql, params: params };
		}
		
		this.stack.push ( args );
		
		return this;
	};
	
	proto.set = function ( id, data ) {
		if ( id in this.queries ) {
			var value = this.queries [ id ],
				params = value.params;
			for ( var key in params ) {
				if ( key in data ) {
					params [ key ] = data [ key ];
				}
			}
		}
	};
	
	proto.execute = function execute ( connection, error, next ) {
		connection.beginTransaction ( function ( err ) {
			if ( err ) {
				if ( typeof error === 'function' ) {
					error ( err );
				} else if ( typeof then === 'function' ) {
					next ( err );
				}
			} else {
				unstackQueries ( connection, this.stack, error, next );
			}
		} );
	};
	
} ) ( sqlx.prototype );

sqlx.transactions = {};

sqlx.describe = function describe ( id ) {
	return sqlx.transactions [ id ] = new sqlx ();
};

//sqlx.

module.exports = function resolveQueries ( db, stack, error, then ) {
	
	db.beginTransaction ( function ( err ) {
		if ( err ) {
			if ( typeof error === 'function' ) {
				error ( err );
			} else if ( typeof then === 'function' ) {
				then ( err );
			}
		} else {
			unstackQueries ( db, stack, error, then );
		}
	} );
};
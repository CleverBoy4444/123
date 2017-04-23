var mysql = require ( 'mysql' ),
	con = require ('./console/console.js' ),
	colors = con.colors,
	prompt = con.prompt;

function wrapError ( err ) {
	return new Error ( con.err + colors.fail ( ' ' + err.message ) );
}

module.exports = function init ( options, callback ) {
	var db_name = options.database,
		db_options = {
			host: options.host,
			user: options.user,
			password: options.password
		},
		db_pool_entry = {
			connectionLimit : 10,
			host: process.env.IP || 'localhost',
			user: process.env.C9_USER || 'root',
			password: options.password
		},
		connection = mysql.createConnection ( db_options );
	
	con.message ( 'initalizing database connection...' );
	connection.connect ( function ( err ) {
		if ( err ) {
			callback ( wrapError ( err ) );
			return;
		}
		
		var id = connection.threadId;
		con.message ( 'MySQL client connection established, id - ' + id );
		con.message ( 'Checking MySQL version...' );
		connection.query ( 'select @@version', function ( err, results, fields ) {
			if ( err ) {
				callback ( wrapError ( err ) );
				return;
			}
			
			var version = results [ 0 ] && results [ 0 ] [ '@@version' ] || '',
				sub = version.split ( '.' );
			
			if ( sub [ 0 ] && sub [ 0 ] < '5' || sub [ 1 ] && sub [ 1 ] < '5' ) {
				callback ( wrapError ( { message: 'MySQL version, ' + version + ', must be >= 5.5' } ) );
				return;
			} else {
				con.message ( 'version ok - ' + version );
			}
			
			con.message ( 'checking database exists "' + db_name + '"...' );
			
			connection.query ( 'select schema_name from information_schema.schemata where schema_name = "' + db_name + '"', function ( err, results, fields ) {
				if ( err ) {
					callback ( wrapError ( err ) );
					return;
				}
				
				function getPool () {
					
					con.message ( 'found database "' + db_name + '", closing connnection ' + id + '...' );
					
					connection.end ( function ( err ) {
						if ( err ) {
							callback ( wrapError ( err ) );
							return;
						}
						
						con.message ( 'closed connection ' + id );
						con.message ( 'establishing connection pool with database "' + db_name + '"...' );
						var pool = mysql.createPool ( options );
						pool.getConnection ( function ( err, connection ) {
							if ( err ) {
								callback ( wrapError ( err ) );
								return;
							}
							
							connection.query ( 'set names "utf8"', function ( err, results, fields ) {
								if ( err ) {
									callback ( wrapError ( err ) );
									return;
								}
								
								con.message ( 'connection pool was successful, starting app...' );
								callback ( null, pool );
							} );
						} );
					} );
				}
				
				function log ( message ) {
					con.message ( message );
				}
				
				function error ( err, data ) {
					console.log ( data );
					//con.message ( data );
					callback ( wrapError ( err ) );
				}
				
				if ( results.length === 0 ) {
					
					con.warn ( 'database "' + db_name + '" not found...' );
					
					prompt.start ();
					prompt.get ( [ {
						name: 'db',
						description: colors.caution ( 'create database "' + db_name + '"?' ),
						"default": 'n'
					} ], function ( err, result ) {
						
						var pool = mysql.createPool ( db_pool_entry );
								
						function next ( err ) {
							if ( err ) {
								error ( err );
							} else {
								con.message ( 'closing db config pool...' );
								pool.end ( function ( err ) {
									if ( err ) {
										error ( err );
									} else {
										con.message ( 'establishing live pooling connection for ' + options.database + '...' );
										getPool ();
									}
								} );
							}
						}
						
						if ( err ) {
							callback ( wrapError ( err ) );
							return;
						}
						
						if ( result.db.toLowerCase () === 'y' ) {
							try {
								require ( './config.js' ) ( pool, db_name, next, error, log );
							} catch ( e ) {
								callback ( e );
							}
						} else {
							callback ( wrapError ( { message: 'database creation cancelled by user "' + db_name + '", goodbye.' } ) );
						}
					} );
				} else {
					getPool ();
				}
			} );
		} );
	} );
};
var mysql = require ( 'mysql' ),
    con = require ('./console/console.js' ),
    colors = con.colors,
    prompt = con.prompt;

function wrapError ( err ) {
    return new Error ( con.err + colors.fail ( ' ' + err.message ) );
}

module.exports = function configure ( options, callback ) {
    var db = options.database,
        connection = mysql.createConnection ( {
            host: options.host,
            user: options.user,
            password: options.password
        } );
    
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
            
            if ( sub [ 0 ] && sub [ 0 ] < '5' || sub [ 1 ] && sub [ 1 ] < '7' ) {
                callback ( wrapError ( { message: 'MySQL version, ' + version + ', must be >= 5.7' } ) );
                return;
            } else {
                con.message ( 'version ok - ' + version );
            }
            
            con.message ( 'checking database exists "' + db + '"...' );
            
            connection.query ( 'select schema_name from information_schema.schemata where schema_name = "' + db + '"', function ( err, results, fields ) {
                if ( err ) {
                    callback ( wrapError ( err ) );
                    return;
                }
                
                function getPool () {
                    
                    con.message ( 'found database "' + db + '", closing connnection ' + id + '...' );
                    
                    connection.end ( function ( err ) {
                        if ( err ) {
                            callback ( wrapError ( err ) );
                            return;
                        }
                        
                        con.message ( 'closed connection ' + id );
                        con.message ( 'establishing connection pool with database "' + db + '"...' );
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
                
                function error ( data, err ) {
                    con.message ( data );
                    callback ( wrapError ( err ) );
                }
                
                if ( results.length === 0 ) {
                    con.warn ( 'database "' + db + '" not found...' );
                    
                    prompt.start ();
                    prompt.get ( [ {
                        name: 'db',
                        description: colors.caution ( 'create database "' + db + '"?' ),
                        "default": 'n'
                    } ], function ( err, result ) {
                        
                        if ( err ) {
                            callback ( wrapError ( err ) );
                            return;
                        }
                        
                        if ( result.db.toLowerCase () === 'y' ) {
                            try {
                                require ( './config.js' ) ( connection, db, getPool, error, log );
                            } catch ( e ) {
                                callback ( e );
                            }
                        } else {
                            callback ( wrapError ( { message: 'cannot create database "' + db + '", contact system administrator' } ) );
                        }
                    } );
                } else {
                    getPool ();
                }
            } );
        } );
    } );
};
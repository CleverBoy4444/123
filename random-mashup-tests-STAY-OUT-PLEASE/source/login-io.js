/**
 * Note to self: root io could potentially be used to delegate messaging and 
 * perhaps reduce code, but a safer approach ( in terms of understanding the code )
 * is to route everything through io session wrappers.  So go over namespaces
 * again and for now don't pass around root io.
 */


var bcrypt = require ( 'bcrypt' );

exports.onopen = function ( db, socket, ns ) {
    socket.on ( 'login', function ( username, password ) {
        // see if user exists
        db.query ( 'select id, name, password from table user where name=' + username,
            function ( err, results, field) {
                if ( err ) {
                    socket.emit ( 'error:query', 'error accessing database', err );
                    return;
                }
                
                if ( results.length > 1 ) {
                    socket.emit ( 'error:query', '(debug) invalid result: multiple rows' );
                }
                
                var result = results [ 0 ];
                
                // if they do redirect to the forum
                if ( result ) {
                    
                    // verify encrypted password
                    bcrypt.compare ( password, result.password, function ( err, verified ) {
                        
                        if ( err ) {
                            socket.emit ( 'error:login', '(debug) hash error: verification failed', err );
                        }
                        
                        if ( !verified ) {
                            socket.emit ( 'error:login', 'user not found with the provided name and password' );
                        } else {
                            var signinCode = Math.random () * 4294967295 >>> 0;
                            db.query ( 'update user set signin_code='+signinCode+' where id='+result.id );
                            
                            // send the user their relevant information along with
                            // the signin code they will need to access the site
                            socket.emit ( 'redirect', '/:?id='+result.id+'&name='+result.name+'&signin='+signinCode );
                        }
                    } );
                } else {
                    socket.emit ( 'error:login', 'user not found with the provided name and password' );
                }
            }
        );
    } );
};
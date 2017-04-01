var session = require ( './io-server-session-manager.js' ),
    hash = require ( './bcrypt-hash.js' );

function routeBindErr ( err ) {
    console.log ( err );
}

module.exports = function ( server, db, io ) {
    
    console.log ( 'loading signup-io...' );
    
        // create an io namespace
    var namespace = io.of ( '/signup' ),
        
        // create a routing session wrapper
        // use wrapper.on ( '<open/message/close>', callbackFn );
        route = session ( server, db, namespace );
    
    route.on ( 'message',
        function ( socket, db ) {
            
            // on 'message' ( header is generic and can be anything you want )
            socket.on ( 'signup', function ( username, password ) {
                
                console.log ( 'signing up user...' );
                
                // check user name
                db.query ( 'select name from user where user.name = "' + username + '"',
                    function ( err, results, field) {
                        if ( err ) {
                            console.log ( 'user exists failed:', err );
                            socket.emit ( '_error_', err, 'database: query failed' );
                            return;
                        }
                        
                        if ( results.length > 0 ) {
                            socket.emit ( '_error_', null, 'create account: user name "'+username+'" already exists - please choose a different name' );
                        } else {
                            console.log ( 'creating user...' );
                            hash ( password, function ( err, hash ) {
                                if ( err ) {
                                    socket.emit ( '_error_', null, 'bcrypt: password hash failed, contact system administrator' );
                                } else {
                                    
                                    db.query ( 'insert into user set ?', { name: username, password: hash },
                                    function ( err, result ) {
                                        if ( err ) {
                                            socket.emit ( '_error_', null, 'database: query failed - "create user" - contact system administrator' );
                                            console.log ( err );
                                        } else {
                                            console.log ( 'user created:', username );
                                            
                                            var session = socket.request.session;
                                            
                                            session.user = {
                                                name: username,
                                                login: true
                                            };
                                            
                                            session.save ( function ( err ) {
                                                if ( err ) {
                                                    socket.emit ( '_error_', null, 'session: could not save user session data, cannot redirect to forum, contact system administrator' );
                                                    console.log ( err );
                                                } else {
                                                    // send the user their relevant information along with
                                                    // the signin code they will need to access the site
                                                    var wait = 3000;
                                                    socket.emit ( 'redirect', {
                                                        location: '/forum',
                                                        wait: wait,
                                                        login: true,
                                                        message: 'Success!  Welcome ' + username + ', I\'ll log you in for the first time.  You\'ll be redirected to the forum automatically in ${wait} seconds.'
                                                    } );
                                                }
                                            } );
                                        }
                                    } );
                                }
                            } );
                        }
                    }
                );
            } );
        },
        routeBindErr
    );
};
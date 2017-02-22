var session = require ( './wrap-io-session.js' ),
    bcrypt = require ( 'bcrypt' );

function routeBindErr ( err ) {
    console.log ( err );
}

exports = function ( server, db, io ) {
    
        // create an io namespace
    var namespace = io.of ( '/login' ),
        
        // create a routing session wrapper
        // use wrapper.on ( '<open/message/close>', callbackFn );
        route = session ( server, db, namespace );
    
    route.on ( 'message',
        function ( db, socket ) {
            
            // message header is generic and can be anything you want
            socket.on ( 'login', function ( username, password ) {
                // see if user exists
                db.query ( 'select id, name, password from table user where name=' + username,
                    function ( err, results, field) {
                        if ( err ) {
                            socket.emit ( 'error', 'query: cannot access database', err );
                            return;
                        }
                        
                        if ( results.length > 1 ) {
                            socket.emit ( 'error', 'query: (debug) invalid result - multiple rows' );
                        }
                        
                        var result = results [ 0 ];
                        
                        // if they do redirect to the forum
                        if ( result ) {
                            
                            // verify encrypted password
                            bcrypt.compare ( password, result.password, function ( err, verified ) {
                                
                                if ( err ) {
                                    socket.emit ( 'error', 'bcrypt: compare error - verification failed', err );
                                }
                                
                                if ( !verified ) {
                                    socket.emit ( 'error', 'login: user not found with the provided name and password' );
                                } else {
                                    var signinCode = Math.random () * 4294967295 >>> 0;
                                    db.query ( 'update user set signin_code=? where id=?', [signinCode,result.id],
                                        function ( err, results, field ) {
                                            if ( err ) {
                                                console.log ( err );
                                                socket.emit ( 'error', 'query: unable to resolve query', err );
                                            } else {
                                                // send the user their relevant information along with
                                                // the signin code they will need to access the site
                                                socket.emit ( 'redirect', {
                                                    location: '/',
                                                    post: {
                                                        id: result.id,
                                                        name: result.name,
                                                        signin: signinCode
                                                    },
                                                    wait: 0,
                                                    message: 'Success!'
                                                } );
                                            }
                                        }
                                    );
                                }
                            } );
                        } else {
                            socket.emit ( 'error', 'login: user not found with the provided name and password' );
                        }
                    }
                );
            } );
        },
        routeBindErr
    );
};
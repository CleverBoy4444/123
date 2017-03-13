var session = require ( './io-server-session-manager.js' ),
    bcrypt = require ( 'bcrypt' ),
    hash = require ( './bcrypt-hash.js' );

function routeBindErr ( err ) {
    console.log ( err );
}

module.exports = function ( server, db, io ) {
    
        // create an io namespace
    var namespace = io.of ( '/login' ),
        
        // create a routing session wrapper
        // use wrapper.on ( '<open/message/close>', callbackFn );
        route = session ( server, db, namespace );
    
    route.on ( 'message',
        function ( socket, db ) {
            
            // message header is generic and can be anything you want
            socket.on ( 'login', function ( username, password ) {
                console.log ( 'running login query' );
                
                db.query ( 'select id, name, password from user where ?', { name: username }, function ( err, results, fields ) {
                    if ( err ) {
                        socket.emit ( '_error_', null, 'database: query failed, contact system administrator' );
                            console.log ( err );
                    } else {
                        var result = results [ 0 ];
                        
                        if ( !result ) {
                            socket.emit ( '_error_', null, 'login: the provided user name and password does not match any any of our records' );
                        } else {
                            console.log ( 'user login:', username );
                                    
                            var session = socket.request.session;
                                    
                            session.user = {
                                id: result.id,
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
                                        message: 'Success!  Welcome ' + username + ', you\'ll be redirected to the forum automatically in ${wait} seconds.'
                                    } );
                                }
                            } );
                        }
                    }
                } );
            } );
        },
        routeBindErr
    );
};
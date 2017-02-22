var session = require ( './server/wrap-io-session.js' );

function routeBindErr ( err ) {
    console.log ( err );
}

exports = function ( server, db, io ) {
    
        // create an io namespace
    var namespace = io.of ( '/signup' ),
        
        // create a routing session wrapper
        // use wrapper.on ( '<open/message/close>', callbackFn );
        route = session ( server, db, namespace );
    
    route.on ( 'message',
        function ( db, socket ) {
            
            // on 'message' ( header is generic and can be anything you want )
            socket.on ( 'signup', function ( username, password ) {
                
                // check user name
                db.query ( 'select id, name from table user where name=' + username,
                    function ( err, results, field) {
                        if ( err ) {
                            socket.emit ( 'error', 'database: query failed', err );
                            return;
                        }
                        
                        if ( results.length > 0 ) {
                            socket.emit ( 'error', 'create: user name "'+username+'" already exists - please choose a different name' );
                        } else {
                            db.query ( 'insert into user set ?', { name: username, password: password },
                                function ( srr, result ) {
                                    if ( err ) {
                                        
                                    } else {
                                        // send the user their relevant information along with
                                        // the signin code they will need to access the site
                                        socket.emit ( 'redirect', {
                                            location: '/login',
                                            wait: 3000,
                                            message: 'Success!  Welcome "' + username + '", sending you along to the login page now...'
                                        } );
                                    }
                                }
                            );
                        }
                    }
                );
            } );
        },
        routeBindErr
    );
};
var session = require ( './io-server-session-manager.js' ),
    userRooms = require ( './user-rooms.js' ),
    userQuery = require ( './queries/user-query.js' );

function routeBindErr ( err ) {
    console.log ( err );
}

exports = function ( server, db, io ) {
    
        // create an io namespace
    var namespace = io.of ( '/forum' ),
        
        // create a routing session wrapper
        // use wrapper.on ( '<open/message/close>', callbackFn );
        route = session ( server, db, namespace );
    
    route.on ( 'open',
        function ( db, socket ) {
            
            // header is generic and can be anything you want )
            socket.on ( 'join', function ( room ) {
                userRooms.join ( socket, room );
            } );
            
            socket.on ( 'leave', function ( room ) {
                userRooms.leave ( socket, room );
            } );
            
            socket.on ( 'request', function ( data ) {
                var username = socket.request.session.user.name;
                if ( data.request === 'users' ) {
                    socket.emit ( 'users', userRooms.in ( data ) );
                } else if ( data.request === 'rooms' ) {
                    socket.emit ( 'rooms', userRooms.of ( username ) );
                } else if ( data.request === 'update' ) {
                    userQuery ( db, socket, data.room );
                }
            } );
        },
        routeBindErr
    );
    
    route.on ( 'close',
        function ( db, socket ) {
            userRooms.close ( socket );
        },
        routeBindErr
    );
};
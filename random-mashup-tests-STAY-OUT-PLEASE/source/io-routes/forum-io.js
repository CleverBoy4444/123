var session = require ( './wrap-io-session.js' ),
    userRooms = require ( './user-rooms.js' );

function routeBindErr ( err ) {
    console.log ( err );
}

exports = function ( server, db, io ) {
    
        // create an io namespace
    var namespace = io.of ( '/forum' ),
        
        // create a routing session wrapper
        // use wrapper.on ( '<open/message/close>', callbackFn );
        route = session ( server, db, namespace );
    
    route.on ( 'message',
        function ( db, socket ) {
            
            // header is generic and can be anything you want )
            socket.on ( 'join', function ( username, room ) {
                userRooms.join ( db, username, room, socket );
            } );
            
            socket.on ( 'leave', function ( username, room ) {
                userRooms.leave ( db, username, room, socket, route );
            } );
        },
        routeBindErr
    );
    
    route.on ( 'close',
        function ( db, socket ) {
            userRooms.close ( db, socket );
        },
        routeBindErr
    );
};
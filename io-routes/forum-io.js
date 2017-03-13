var session = require ( './io-server-session-manager.js' ),
    userRooms = require ( './user-rooms.js' ),
    userQuery = require ( '../queries/user-query.js' ),
    requestData = require ( '../queries/request-data.js' );

function routeBindErr ( err ) {
    console.log ( err );
}

module.exports = function ( server, db, io ) {
    
    var request = {
        users: function ( socket, room ) { socket.emit ( 'response', 'users', { room: room, users: userRooms.in ( room ) } ); },
        rooms: function ( socket, user ) { socket.emit ( 'response', 'rooms', { rooms: userRooms.of ( user ) } ); },
        owners: function ( socket, data ) { userQuery ( db, socket, data ); },
        page: function ( socket, data ) { userQuery ( db, socket, data ); },
        update: function ( socket, data ) { userQuery ( db, socket, data ); },
    };
    
        // create an io namespace
    var namespace = io.of ( '/forum' ),
        
        // create a routing session wrapper
        // use wrapper.on ( '<open/message/close>', callbackFn );
        route = session ( server, db, namespace );
    
    route.on ( 'open',
        function ( socket, db ) {
            
            // header is generic and can be anything you want )
            socket.on ( 'join', function ( room ) {
                userRooms.join ( socket, room );
            } );
            
            socket.on ( 'leave', function ( room ) {
                userRooms.leave ( socket, room );
            } );
            
            socket.on ( 'request', function ( forward, data ) {
                if ( ! ( forward in request ) ) {
                    socket.emit ( '_error_', null, 'response type "' + forward + '" was not found, contact system administrator' )
                } else {
                    request [ forward ] ( socket, data );
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

var resolveQueries = require ( '../queries/resolve-queries.js' );
var q = require ( '../queries/short-query.js' );
var users = {},
    rooms = {};

function getRoomId ( room ) {
    if ( typeof room === "string" ) {
        return room;
    }
    
    var namespace;
    
    if ( 'name' in room ) {
        namespace = [room.name];
    } else {
        namespace = [ room.categoryId ];
        if ( 'topicId' in room ) {
            namespace.push ( room.topicId );
        }
    }
    
    return namespace.join ( ':' );
}

function mapUserRooms ( roomId, username ) {
    if ( ! ( roomId in rooms ) ) {
        rooms [ roomId ] = {
            users: {}
        };
    }
    rooms [ roomId ].users [ username ] = true;
    
    if ( ! ( username in users ) ) {
        users [ username ] = {
            rooms: {}
        };
    }
    users [ username ].rooms [ roomId ] = true;
}

// joining allows two way mapping
// every room can contain multiple users
// and every user can be in multiple rooms
function join ( socket, room, err ) {
    
    var id = getRoomId ( room ),
        username = socket.request.session.user.name;
    
    mapUserRooms ( id, username );
    
    socket.join ( id, function () {
        socket.to ( id ).emit ( 'joined', room, username );
        socket.emit ( 'join', room );
    } );
}

function leave ( socket, room, id ) {
    
    id = id || getRoomId ( room );
    var username = socket.request.session.user.name;
    
    delete users [ username ].rooms [ id ];
    delete rooms [ id ].users [ username ];
    
    socket.leave ( id, function () {
        socket.to ( id ).emit ( 'left', username );
    } );
}

function close ( socket ) {
    for ( var room in socket.rooms ) {
        leave ( socket, null, room );
    }
}

module.exports = {
    join: join,
    leave: leave,
    close: close,
    getRoomId: getRoomId
};

Object.defineProperties ( module.exports, {
    rooms: {
        get: function () {
            return Object.keys ( rooms );
        }
    },
    users: {
        get: function () {
            return Object.keys ( rooms );
        }
    },
    "in": {
        value: function ( room ) {
            return Object.keys ( rooms [ room ] );
        }
    },
    "of": {
        value: function ( user ) {
            return Object.keys ( users [ user ] );
        }
    }
} );
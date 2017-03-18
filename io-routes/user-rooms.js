
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
        namespace = [ room.name ];
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
function join ( room, username ) {
    
    var id = getRoomId ( room );
    
    mapUserRooms ( id, username );
    
    return id;
}

function leave ( id, username ) {
    
    delete users [ username ].rooms [ id ];
    delete rooms [ id ].users [ username ];
}

function close ( username ) {
    for ( var id in users [ username ].rooms ) {
        delete rooms [ id ].users [ username ]; 
    }
    
    delete users [ username ];
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
            return Object.keys ( rooms [ room ].users );
        }
    },
    "of": {
        value: function ( user ) {
            return Object.keys ( users [ user ].rooms );
        }
    }
} );
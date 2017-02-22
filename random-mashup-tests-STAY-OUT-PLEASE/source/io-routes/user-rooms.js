
var mysql = require ( 'mysql' );
var users = {};
var rooms = {};

function getRoomId ( room ) {
    var roomId;
    
    if ( 'name' in room ) {
        roomId = room.name;
    } else {
        var namespace = [ room.categoryId ];
        if ( 'topicId' in room ) {
            namespace.push ( room.topicId );
        }
        roomId = namespace.join ( ':' );
    }
    
    return roomId;
}

// joining allows two way mapping
// every room can contain multiple users
// and every user can be in multiple rooms
function join ( db, username, room, socket ) {
    
    var roomId = getRoomId ( room );
    
    if ( roomId in rooms ) {
        rooms [ roomId ].users [ username ] = true;
    } else {
        rooms [ roomId ] = {
            users: {}
        };
        
        rooms [ roomId ].users [ username ] = true;
    }
    
    if ( username in users ) {
        users [ username ].rooms [ roomId ] = true;
    } else {
        users [ username ] = {
            rooms: {}
        }
        
        users [ username ].rooms [ roomId ] = true;
    }
    
    socket.join ( roomId, function () {
        var session = socket.request.session,
            user = session.user;
        
        socket.to ( roomId ).emit ( 'joined', username );
        
        var search = roomId.split ( ':' );
        var categoryId, topicId, name, sql, count;
        if ( search.length > 1 ) {
            categoryId = parseInt( search [ 0 ], 10 );
            topicId = parseInt ( search [ 1 ], 10 );
        } else {
            if ( isNaN ( parseInt ( search [ 0 ], 10 ) ) ) {
                name = search [ 0 ];
            }
        }
        
        if ( name ) {
            count = 'count (*) from category';
            sql = mysql.format (
                'select * from category order by created ? limit ?, 10',
                [ user.order === 'descending' ? 'desc' : 'asc', user.position ]
            );
        } else {
            if ( topicId !== undefined ) {
                count = 'count (*) from post where topic='+topicId;
                sql = mysql.format (
                    'select * from post where topic=? order by created ? limit ?, 10',
                    [ topicId, user.order === 'descending' ? 'desc' : 'asc', user.position ]
                );
            } else if ( categoryId !== undefined ) {
                count = 'count (*) from topic where category='+categoryId;
                sql = mysql.format (
                    'select * from topic where category=? order by created ? limit ?, 10',
                    [ categoryId, user.order === 'descending' ? 'desc' : 'asc', user.position ]
                );
            }
        }
        
        db.query ( count, function ( err, results, field ) {
            if ( err ) {
                console.log ( err );
                socket.emit ( 'error', 'database: query failed', err );
            } else {
                var total = results [ 0 ];
                db.query ( sql,
                    function ( err, results, field ) {
                        if ( err ) {
                            console.log ( err );
                            socket.emit ( 'error', 'database: query failed', err );
                        } else {
                            for ( var i = 0, l = results.length; i < l; i = i + 1 ) {
                                socket.emit ( 'article', results [ i ] );
                            }
                        }
                        
                        user.position += 10;
                        if ( user.position > total ) {
                            user.position = total;
                        }
                        socket.emit ( 'position', user.position );
                        socket.emit ( 'remaining', total - user.position );
                        session.save ();
                    }
                );
            }
        } );
    } );
    
    db = username = room = socket = null;
}

function leave ( db, username, room, socket, route ) {
    
    var roomId = getRoomId ( room );
    
    delete users [ username ].rooms [ roomId ];
    delete rooms [ roomId ].users [ username ];
    
    socket.leave ( roomId, function () {
        socket.to ( roomId ).emit ( 'left', username );
    } );
    
    db = username = room = socket = route = null;
}

function close ( username, room, ns, socket ) {
    leave ( username, room, ns, socket );
}

exports = {
    join: join,
    leave: leave,
    close: close
};
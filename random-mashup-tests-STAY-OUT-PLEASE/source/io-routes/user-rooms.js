
var resolveQueries = require ( './queries/resolve-queries.js' );
var q = require ( './queries/short-query.js' );
var users = {};
var rooms = {};

function getRoomId ( room ) {
    var namespace;
    
    if ( 'name' in room ) {
        namespace = [room.name];
    } else {
        namespace = [ room.categoryId ];
        if ( 'topicId' in room ) {
            namespace.push ( room.topicId );
        }
    }
    
    return namespace;
}

function dbError ( socket, message ) {
    return function ( err ) {
        console.log ( err );
        socket.emit ( 'error', message, err );
    };
}

function mapUserRooms ( roomId, username ) {
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
            rooms: {},
            current: roomId
        };
        
        users [ username ].rooms [ roomId ] = true;
    }
}

// joining allows two way mapping
// every room can contain multiple users
// and every user can be in multiple rooms
function join ( db, username, room, socket ) {
    
    var path = getRoomId ( room ),
        id = path.join ( ':' ),
        perReq = 10;
    
    if ( username in users ) {
        socket.leave ( users [ username ].current, function () {} )
    }
    mapUserRooms ( id, username );
    
    socket.join ( id, function () {
        var session = socket.request.session,
            user = session.user;
        
        socket.to ( id ).emit ( 'joined', username );
        
        var cId, tId, name;
        if ( path.length > 1 ) {
            cId = parseInt( path [ 0 ], 10 );
            tId = parseInt ( path [ 1 ], 10 );
        } else {
            var temp;
            if ( isNaN ( temp = parseInt ( path [ 0 ], 10 ) ) ) {
                name = path [ 0 ];
            } else {
                cId = temp;
            }
        }
        
        var onerr = dbError ( socket, 'database: query failed' ),
            w = '*', c = 'category', t = 'topic', p = 'post', s = 'created',
            count, posts, queries;
        
        count = (new q()).c(w);         // 'count(*)'
        posts = (new q()).s(w);         // 'select *'
        
        if ( name ) {
            count = count.f(c).end();   // 'from category'
            posts.f(c);                 // '''
        } else {
            if ( tId !== undefined ) {
                var to = q.eq ( t, tId );           // to = 'topic=#{topicId}'
                count = count.f(p).w(to).end();     // 'from post where #{to}'
                posts.f(p).w(to);                   // '''
            } else if ( cId !== undefined ) {
                var ca = q.eq ( c, cId );           // ca = 'category=#{categoryId}'
                count = count.f(t).w(ca).end();     // 'from topic where #{ca}'
                posts.f(t).w(ca);                   // '''
            }
        }
        
        // + order by 'created' ( user.order === "descending" ? "desc" : "asc"
        // + limit to perReq posts starting from user current viewing position
        // ( within the set of all posts for this forum/category/topic )
        posts = posts[ user.order.substring ( 0, 1 ) ](s).l(user.position,perReq).end();
        
        // queue queries
        var total;
        queries.push (
            [ count, onerr, function ( rows ) {
                // number of database entries for this query ( categories/topics/posts )
                total = rows [ 0 ];
            } ],
            [ posts, onerr, function ( rows ) {
                rows.forEach ( function (e) { socket.emit ( 'article', e ); } );
            } ]
        );
        
        // execute all queries, then...
        resolveQueries ( db, queries, function () {
            user.position = Math.min ( user.position + perReq, total );
            var remaining = total - user.position;
            socket.emit ( 'remaining', remaining );
            user.position += Math.min ( perReq, remaining );
        } );
    } );
}

function leave ( db, username, room, socket, route ) {
    
    var roomId = getRoomId ( room );
    
    delete users [ username ].rooms [ roomId ];
    delete rooms [ roomId ].users [ username ];
    
    socket.leave ( roomId, function () {
        socket.to ( roomId ).emit ( 'left', username );
    } );
}

function close ( username, room, ns, socket ) {
    leave ( username, room, ns, socket );
}

exports = {
    join: join,
    leave: leave,
    close: close
};
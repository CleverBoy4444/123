var resolveQueries = require ( './resolve-queries.js' ),
	q = require ( './short-query.js' ),
	getRoomId = require ( '../io-routes/user-rooms' ).getRoomId,
	perReq = 10;

function dbError ( socket, message ) {
    return function ( err ) {
        console.log ( err );
        socket.emit ( 'error', message, err );
    };
}

module.exports = function ( db, socket, room ) {
	var cId = room.categoryId, tId = room.topicId, name = room.name,
		id = getRoomId ( room ),
		user = socket.request.session.user;
        
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
            total = rows [ 0 ].count;
        } ],
        [ posts, onerr, function ( rows ) {
            rows.forEach ( function ( e ) { socket.emit ( 'article', id, e ); } );
        } ]
    );
    
    // execute all queries, then...
    resolveQueries ( db, queries, function () {
        user.position = Math.min ( user.position + perReq, total );
        var remaining = total - user.position;
        socket.emit ( 'remaining', id, remaining );
        user.position += Math.min ( perReq, remaining );
    } );
};
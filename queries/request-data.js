var resolveQueries = require ( './resolve-queries.js' );

/**
 *  data = {
 *      table:  '<table>',
 *      ref:    '<foreign-column>',
 *      id:     '<foreign-key>',
 *      index:  '<user-position>',
 *      asc:    '<"asc"/"desc">'
 *  }
 */

var requestLimit = 10;  // fetch 10 items with each page request

function dbError ( socket ) {
    return function ( err ) {
        console.log ( err );
        socket.emit ( '_error_', err, 'database query failed' );
    };
}

function wrapQuery ( socket, query, callback ) {
    return [ query, dbError ( socket ), callback ];
}

// sql injection attack safety
function escape ( db, data ) {
    for ( var key in data ) {
        data [ key ] = db.escape ( data [ key ] );
    }
}

function processRequest ( db, socket, queries, then ) {
    var args = Array.prototype.slice.call ( arguments );
    then = args.pop ();
    db = args.shift ();
    socket = args.shift ();
    resolveQueries (
        db,
        args.map (
            function ( q ) {
                return wrapQuery ( socket, q [ 0 ], q [ 1 ] );
            }
        ),
        then
    );
}

function pageQuery ( db, socket, data ) {
    
    escape ( db, data );
    
    var table = data.from, ref = data.references, id, index = data.index, asc = !data.newest,
        limit, where = '', order, results, total, timestamp;
    
    if ( ref ) {
        var key = Object.keys ( ref ) [ 0 ];
        id = ref [ key ];
        ref = key;
    }
    if ( asc ) {
        limit = 10;
        order = 'asc';
    } else {
        var start = Math.max ( 0, index - 10 );
        limit = Math.min ( 10, index - start );
        index = start;
        order = 'desc';
    }
    
    limit = [ index, limit ].toString ();
    
    if ( ref ) {
        where = [ 'where', ref, '=', id ].join ( ' ' );
    }
    
    processRequest (
        db,
        socket,
        [
            'select current_timestamp',
            function ( rows ) { timestamp = rows [ 0 ].current_timestamp; }
        ],[
            [ 'select count(*) from', table, where ].join ( ' ' ).replace ( /\s+/g, ' ' ),
            function ( rows ) { total = rows [ 0 ].count; }
        ],[
            [ 'select * from', table, where, 'order by', order, 'limit', limit ].join ( ' ' ).replace ( /\s+/g, ' ' ),
            function ( rows ) { results = rows; }
        ],
        function ( err ) {
            if ( err ) {
                socket.emit ( '_error_', err, 'database: transaction failed');
            } else {
                var index = Math.min ( data.index + requestLimit, total );
                var remaining = total - index;
                socket.emit ( 'response', 'page', { uid: data.uid, count: results.length, remaining: remaining, timestamp: timestamp } );
                results.forEach ( function ( article, index ) {
                        socket.emit ( 'article', { uid: data.uid, index: index, article: article } );
                } );
            }
        }
    );
}

/**
 *  data = {
 *      table:      '<table>',
 *      ref:        '<foreign-column>',
 *      id:         '<foreign-key>',
 *      timestamp:  '<last-user-request>',
 *      index:      '<user-position>',
 *      asc:        '<"asc"/"desc">'
 *  }
 */
function updateQuery ( db, socket, data ) {
    
    escape ( db, data );
    
    var table = data.from, ref = data.references, id = data.id, fromtimestamp = data.timestamp, asc = data.asc,
        where, order, query, timestamp;
    
    order = asc ? 'asc' : 'desc';
    
    where = [ 'where', ref, '=', id, 'and ( edited >', fromtimestamp, 'or created >', fromtimestamp, ')' ].join ( ' ' );
    
    processRequest (
        db,
        socket,
        [
            'select current_timestamp',
            function ( rows ) { timestamp = rows [ 0 ].current_timestamp; }
        ],[
            [ 'select * from', table, where, 'order by', order ].join ( ' ' ).replace ( /\s+/g, ' ' ),
            function ( rows ) { timestamp = rows [ 0 ] [ 0 ].current_timestamp; query = rows [ 1 ]; }
        ],
        function () {
            socket.emit ( 'response', { uid: data.uid, count: query.length, remaining: 0, timestamp: timestamp } );
            query.forEach ( function ( article, index ) {
                    socket.emit ( 'article', { uid: data.uid, index: index, article: article } );
            } );
        }
    );
}

exports.getPage = pageQuery;
exports.getUpdate = updateQuery;
/**
 * Session Manager provides callbacks for "open",
 * "message" and "close" events, to be used for
 * every socket that connects to an io namespace.
 * 
 * Note that "open" and "message" events essentially
 * hook up session messaging within the same scope,
 * "message" event handler occurs immediately after
 * "open" event handler.  The "close" event handler
 * can only be reached when the socket is
 * disconnecting.
 * 
 * The Session Manager shuts down the server auto-
 * matically one minute after all io sessions have
 * disconnected.
 */

var enumConnection = 0,
    connectionCount = 0,
    lastConnection;

exports = function ( server, db, ns ) {
    
    var session = {
        open: [],
        message: [],
        close: [],
        on: function ( type, callback, err ) {
            if ( type in this ) {
                this [ type ].push ( callback );
            } else {
                if ( err ) {
                    err (
                        new Error ( 'binding type: ' + type + ' not supported' )
                    );
                }
            }
        }
    };
    
    ns.on('connect', function ( socket ) {
        
        var username = socket.request.session.user.name;
        
        // track user connections
        var socketId = enumConnection++;
        
        console.log ( 'connected user: ' + username + ', socketId: ' + socketId );
        
        connectionCount++;
        
        lastConnection = Date.now ();
        
        // attach open callbacks
        session.open.forEach ( function ( callback ) { callback ( socket, db ); } );
        
        // attach message callbacks
        session.message.forEach ( function ( callback ) { callback ( socket, db ); } );
        
        socket.on('disconnect', function() {
            
            connectionCount--;
            
            console.log ( 'disconnected user: ' + socketId );
            
            // attach close callbacks
            session.close.forEach ( function ( callback ) { callback ( socket, db ); } );
            
            if ( connectionCount === 0 ) {
                // async termination allows exit->die
                setTimeout ( function () {
                    
                    if ( Date.now() - lastConnection > 60000 && connectionCount === 0 ) {
                        // end the database connection
                        db.end ();
                        
                        // close the http server
                        server.close ( function () {
                            console.log ( 'Shutting down server...' );
                            
                            // terminate the server shell
                            // try to allow the current process to return
                            setTimeout ( function () { process.exit ( 0 ); }, 1 );
                        } );
                    }
                // should be enough time for redirects if anyone is there by themselves
                }, 60002);
            }
        });
    });
    
    return session;
};
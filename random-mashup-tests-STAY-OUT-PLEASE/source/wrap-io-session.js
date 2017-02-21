var enumConnection = 0,
    connectionCount = 0;

module.exports = function ( server, db, ns, onopen, onmessage, onclose ) {
    
    ns.on('connection', function ( socket ) {
        
        if ( onopen ) {
            for ( var i = 0, l = onopen.length; i < l; i = i + 1 ) {
                onopen ( db, socket, ns );
            }
        }
        
        // track user connections
        var socketId = enumConnection++;
        
        console.log ( 'connected user: ' + socketId );
        
        connectionCount++;
        
        if ( onmessage ) {
            for ( var i = 0, l = onmessage.length; i < l; i = i + 1 ) {
                onmessage [ i ] ( db, socket, ns );
            }
        }
        
        socket.on('disconnect', function() {
            if ( onclose ) {
                for ( var i = 0, l = onclose.length; i < l; i = i + 1 ) {
                    onclose ( ns, socket, socketId, db );
                }
            }
            
            connectionCount--;
            
            console.log ( 'disconnected user: ' + socketId );
            
            if ( connectionCount === 0 ) {
                // async termination allows exit->die
                setTimeout ( function () {
                    
                    // end the database connection
                    db.end ();
                    
                    // close the http server
                    server.close ( function () {
                        console.log ( 'Shutting down server...' );
                        
                        // terminate the server shell
                        // try to allow the current process to return
                        setTimeout ( function () { process.exit ( 0 ); }, 1 );
                    } );
                }, 1);
            }
        });
    });
};
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

var connectionCount = 0,
	lastConnection,
	newConnections = 0;

module.exports = function ( server, db, ns ) {
	
	console.log ( 'loading io sessions...' );
	
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
	
	// http://stackoverflow.com/questions/14626636/how-do-i-shutdown-a-node-js-https-server-immediately
	var httpSockets = {}, enumHttpSockets = 0;
	server.on ( 'connection', function ( socket ) {
		
		var socketId = enumHttpSockets++;
		httpSockets [ socketId ] = socket;
		
		socket.on ( 'close', function () {
			delete httpSockets [ socketId ];
		} );
	} );
	
	ns.on('connection', function ( socket ) {
		
		var user = socket.request.session.user;
		
		if ( user ) {
			console.log ( 'connected user: ' + user.name + ', socketId: ' + socket.id );
		}
		
		connectionCount++;
		newConnections++;
		
		lastConnection = Date.now ();
		
		// attach open callbacks
		session.open.forEach ( function ( callback ) { callback ( socket, db ); } );
		
		// attach message callbacks
		session.message.forEach ( function ( callback ) { callback ( socket, db ); } );
		
		socket.on('disconnect', function() {
			
			connectionCount--;
			
			// attach close callbacks
			session.close.forEach ( function ( callback ) { callback ( socket, db ); } );
			
			if ( connectionCount === 0 ) {
				
				newConnections = 0;
				
				console.log ( 'all users disconnected, timeout to server shut down - 1 minute' );
				
				// async termination allows exit->die
				setTimeout ( function () {
					
					if ( Date.now() - lastConnection > 60000 && newConnections === 0 ) {
						// end the database connection
						db.end ();
						
						// close the http server
						server.close ( function () {
							console.log ( 'Shutting down server...' );
							
							// terminate the server shell
							// try to allow the current process to return
							setTimeout ( function () {
								for ( var id in httpSockets ) {
									httpSockets [ id ].destroy ();
								}
								console.log ( 'Goodbye' );
								process.exit ( 0 );
							}, 1 );
						} );
					}
				// should be enough time for redirects if anyone is there by themselves
				}, 60002);
			}
		});
	});
	
	return session;
};
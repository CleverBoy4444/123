var fmt = require ( 'util' ).format,
	session = require ( './io-server-session-manager.js' ),
	userRooms = require ( './user-rooms.js' ),
	transactions = require ( '../queries/transactions.js' ),
	transactions_initialized = false,
	transaction,
	submissions = {};

function routeBindErr ( err ) {
	console.log ( err );
}

module.exports = function ( server, db, io ) {
	
	console.log ( 'loading forum-io...' );
	
	if ( !transactions_initialized ) {
		transaction = transactions.init ( db );
		transactions_initialized = true;
	}
	
	var request = {
		users: function ( room, callback ) { callback ( null, userRooms.in ( room ) ); },
		rooms: function ( user, callback ) { callback ( null, userRooms.of ( user ) ); },
		owners: function ( data, callback ) { callback ( 'not yet implemented' ) },
		page: function ( data, callback ) { transaction.getPage ( data, callback ); },
		update: function ( data, callback ) { transaction.getUpdate ( data, callback ); },
		submit: function ( data, callback ) { transaction.submitArticle ( data, callback ); },
		edit: function ( data, callback ) { transaction.editArticle ( data, callback ); },
		remove: function ( data, callback ) { transaction.removeArticle ( data, callback ); },
		submission: function ( id, callback ) {
			if ( id in submissions ) {
				callback ( null, submissions [ id ] );
			} else {
				callback ( fmt ( 'submission "%s" not found', id ));//`submission "${id}" not found`
			}
		}
	};
	
		// create an io namespace
	var namespace = io.of ( '/forum' ),
		
		// create a routing session wrapper
		// use wrapper.on ( '<open/message/close>', callbackFn );
		route = session ( server, db, namespace );
	
	// note: headless session can occur if app/socket? does not close properly,
	// hence the session extant logic
	// page refresh should do the trick on the user end
	route.on ( 'open', function ( socket ) {
		
		socket.on ( 'join', function ( room, callback ) {
			var username = ( 'session' in socket.request ) && ( 'user' in socket.request.session ) && socket.request.session.user.name,
				id;
				
			if ( !username ) {
				socket.emit ( '_error_', null, 'session unavailable on ( "join"... room ), try reloading the page' );
			} else {
				id = userRooms.join ( room, username );
				
				socket.join ( id, function () {
					socket.to ( id ).emit ( 'joined', id, username );
					callback ( id );
				} );
			}
		} );
		
		socket.on ( 'leave', function ( id, callback ) {
			var username = ( 'session' in socket.request ) && ( 'user' in socket.request.session ) && socket.request.session.user.name;
			
			if ( !username ) {
				socket.emit ( '_error_', null, 'session unavailable on ( "leave"... room ), try reloading the page' );
			} else {
				userRooms.leave ( id, username );
				
				socket.leave ( id, function () {
					socket.to ( id ).emit ( 'left', username );
					callback ( id );
				} );
			}
		} );
		
		socket.on ( 'chat', function ( id, message, callback ) {
			var username = ( 'session' in socket.request ) && ( 'user' in socket.request.session ) && socket.request.session.user.name;
			
			if ( !username ) {
				socket.emit ( '_error_', null, 'session unavailable on ( "chat"... room ), try reloading the page' );
			} else {
				socket.to ( id ).emit ( 'chatin', id, username, message );
				callback ( id );
			}
		} );
		
		socket.on ( 'request', function ( forward, data, callback ) {
			
			if ( !( ( 'session' in socket.request ) && ( 'user' in socket.request.session ) ) ) {
				socket.emit ( '_error_', null, fmt ( 'session unavailable on ( "request"... %s ), try reloading the page', forward) );//`session unavailable on ( "request"... ${forward}), try reloading the page`
			} else {
				
				if ( ! ( forward in request ) ) {
					socket.emit ( '_error_', null, 'response type "' + forward + '" was not found, contact system administrator' );
				} else {
					
					if ( forward === 'submission' ) {
						request [ forward ] ( data, callback );
						return;
					}
					
					var ref = data.references,
						id = [], room, response;
					
					if ( forward === 'submit' ) {
						response = function ( err, article ) {
							if ( err ) {
								callback ( err );
							} else {
								
								article.username = data.username;
								
								var id = article.id,
									rank = article.rank,
									created = article.created,
									edited = article.edited,
									res = {
										id: id,
										owner: article.owner,
										username: article.username,
										rank: rank,
										room: data.room,
										created: created,
										edited: edited
									};//{ id, owner: article.owner, username: article.username, rank, room: data.room, created, edited };
								
								ref && ( res.references = ref );
								
								submissions [ id ] = article;
								
								// prevent memory overuse
								// submission should be heard and fetched in seconds,
								// but in case anyone misses the call the submission is
								// kept for one minute then discarded
								setTimeout ( ( function ( id ) { return function () { delete submissions [ id ]; }; } ) ( id ), 60000 );
								
								// reply with the timestamp and location of the new article
								callback ( null, res );
								
								// notify others of submission
								socket.broadcast.to ( res.room ).emit ( 'submission', res );
							}
						};
						
						if ( ref && 'chat' in ref && ( 'topic' in ref || 'category' in ref ) ) {
							callback ( 'reference error: posts cannot reference a chat and also a topic or category, contact system administrator' );
						} else {
							if ( ref ) {
								'category' in ref && id.push ( 'category_' + ref.category );
								'topic' in ref && id.push ( 'topic_' + ref.topic );
								'chat' in ref && id.push ( 'chat_' + ref.chat );
							}
							
							room = id.join ( '-' ) || 'category';
							
							if ( !room ) {
								callback ( 'headless error: submission must have a reference, contact system administrator' );
							} else {
								var user = socket.request.session.user;
								data.room = room;
								data.userid = user.id;
								data.username = user.name;
								
								console.log ( 'no room?', user );
							}
						}
						
					} else if ( forward === 'page' || forward === 'update' ) {
						response = function ( err, articles ) {
							if ( err ) {
								// socket.emit ( '_error_' ) ?
								callback ( err );
							} else {
								callback ( null, articles );
							}
						};
					} else {
						response = callback;
					}
					
					request [ forward ] ( data, response );
				}
			}
		} ); },
		routeBindErr
	);
	
	route.on ( 'close', function ( socket ) {
		var username = ( 'session' in socket.request ) && ( 'user' in socket.request.session ) && socket.request.session.user.name,
			rooms;
		
		if ( username ) {
			rooms = userRooms.of ( username );
			userRooms.close ( username );
			
			for ( var i in rooms ) {
				socket.to ( rooms [ i ] ).emit ( 'left', username );
			}
		} },
		routeBindErr
	);
};
var mysql = require ( 'mysql' ),
	fmt = require ( 'util' ).format,
	resolveQueries = require ( './resolve-queries.js' ),
	db, resolve_transaction,
	request_limit = 10; // number of articles to fetch on a call by default

// sql injection attack safety
function escape_sqlId ( data ) {
	for ( var key in data ) {
		data [ key ] = mysql.escapeId ( data [ key ] );
	}
}

function escape_sql ( data ) {
	for ( var key in data ) {
		data [ key ] = mysql.escape ( data [ key ] );
	}
}

function sql_escId ( val ) {
	return mysql.escapeId ( val );
}

function sql_esc ( val ) {
	return mysql.escape ( val );
}

function processRequest ( queries, then) {
	queries = Array.prototype.slice.call ( arguments );
	then = queries.pop();
	resolve_transaction ( queries, then );
}

function pageQuery ( data, callback ) {
	
	var table = data.from,
		ref = data.references,
		index = 'index' in data ? data.index : 0,
		limit = 'limit' in data ? data.limit : request_limit,
		category = ref ? ref.category : null,
		topic = ref ? ref.topic : null,
		chat = ref ? ref.chat : null,
		esc = {
			category: category,
			topic: topic,
			chat: chat
		}, key,
		where = '',
		articles, total, timestamp, constraints = [];
	
	escape_sql ( esc );
	table = sql_escId ( table );
	index = sql_esc ( index );
	limit = sql_esc ( limit );
	
	if ( ref ) {
		for ( key in ref ) {
			if ( key in esc ) {
				constraints.push ( fmt ( '', key, esc [ key ] === 'NULL' ? 'is' : '=', esc [ key ] ) );
			}
		}
		
		where = 'where ' + constraints.join ( ' and ' ) + ' ';
	}
	
	console.log ( 'processing page request...' );
	processRequest (
		[
			function ( sql ) { console.log ( 'page:', sql ); },
			fmt ( 'select %s.*, user.name as username from %s inner join user on %s.owner = user.id %sorder by %s.id limit %s, %s', table, table, table, where, table, index, limit ),
			//`select ${table}.*, user.name as username from ${table} inner join user on ${table}.owner = user.id ${where}limit ${index}, ${limit}`,
			function ( results ) { articles = results; },
		], [
			function ( sql ) { console.log ( 'count:', sql ); },
			fmt ( 'select count(*) as count from %s%s', table, where ),
			//`select count(*) as count from ${table}${where}`,
			function ( results ) { total = results [ 0 ].count; },
		], [
			function ( sql ) { console.log ( 'timestamp:', sql ); },
			'select current_timestamp ( 6 ) as timestamp',
			function ( results ) { timestamp = results [ 0 ].timestamp; },
		],
		function ( err ) { callback ( err, { articles, total, timestamp } ); }
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
function updateQuery ( data, callback ) {

	var table = data.from,
		ref = data.references,
		fromtimestamp = data.timestamp,
		index = 'index' in data ? data.index : 0,
		limit = 'limit' in data ? data.limit : request_limit,
		category = ref ? ref.category : null,
		topic = ref ? ref.topic : null,
		chat = ref ? ref.chat : null,
		esc = {
			category: category,
			topic: topic,
			chat: chat
		}, key,
		where, articles, total, timestamp, constraints = [];
	
	escape_sql ( esc );
	table = sql_escId ( table );
	index = sql_esc ( index );
	limit = sql_esc ( limit );
	fromtimestamp = sql_esc ( fromtimestamp );
	
	if ( ref ) {
		for ( key in ref ) {
			if ( key in esc ) {
				constraints.push ( fmt ( '%s = %s', key, esc [ key ] ) ); //`${ key } = ${ esc [ key ] }`
			}
		}
	}

	constraints.push ( fmt ( '( edited > %s or created > %s ) ', fromtimestamp, fromtimestamp ) );//`( edited > ${fromtimestamp} or created > ${fromtimestamp} ) `

	where = 'where ' + constraints.join(' and ');
	
	console.log ( 'processing update request...' );
	processRequest (
		[
			function ( sql ) { console.log ( 'update:', sql ); },
			fmt ( 'select * from %s %s limit %s, %s', table, where, index, limit ),
			//`select * from ${table} ${where} limit ${index}, ${limit}`,
			function ( results ) { articles = results; }
		], [
			function ( sql ) { console.log ( 'count:', sql ); },
			fmt ( 'select count(*) as count from %s %s', table, where ),
			//`select count(*) as count from ${table} ${where}`,
			function ( results ) { total = results [ 0 ].count; }
		], [
			function ( sql ) { console.log ( 'timestamp:', sql ); },
			'select current_timestamp ( 6 ) as timestamp',
			function ( results ) { timestamp = results [ 0 ].timestamp; }
		],
		function ( err ) { callback ( err, { articles, total, timestamp } ); }
	);
}

function submitQuery ( data, callback ) {
	
	var table = data.to,
		ref = data.references,
		owner = data.userid,
		title = data.title,
		body = data.body,
		category = ref ? ref.category : null,
		topic = ref ? ref.topic : null,
		chat = ref ? ref.chat : null,
		esc = {
			category: category,
			topic: topic,
			chat: chat
		}, key,
		dataset = {
			owner: owner,
			body: body
		},
		constraints = [],
		article,
		rank = { type: table };
	
	escape_sql ( esc );
	table = sql_escId ( table );
	
	if ( ref ) {
		for ( key in ref ) {
			if ( key in esc ) {
				dataset [ key ] = esc [ key ];
				constraints.push ( fmt ( '%s = %s', key, esc [ key ] ) );//`${ key } = ${ esc [ key ] }`
			}
		}
	}
	
	if ( table !== '`post`' ) {
		dataset.title = title;
	}
	
	processRequest( [
		function () { console.log ( 'insert' ); },
		fmt ( 'insert into %s set ?', table ), dataset,
		//`insert into ${table} set ?`, dataset,
		
		// called in the context of the transaction stack
		// so pushing onto this is inserting queries into the transaction
		function ( results ) {
			var id = results.insertId,
				select = fmt ( 'select count(*) as rank from %s', table );//`select count(*) as rank from ${table}`;
			
			if ( ref ) {
				if ( 'chat' in ref ) {
					this.push ( [
						function () { console.log ( 'chat ranking' ); },
						fmt ( 'select count(*) as rank from chat where id < %s', esc.chat ),
						//`select count(*) as rank from chat where id < ${esc.chat}`,
						function ( results ) { rank.chat = results [ 0 ].rank; }
					], [
						function () { console.log ( 'post ranking' ); },
						fmt ( '%s where chat = %s and id < %s', select, esc.chat, id ),
						//`${select} where chat = ${esc.chat} and id < ${id}`,
						function ( results ) { rank.post = results [ 0 ].rank; }
					] );
				} else {
					
					if ( table === '`chat`' ) {
						this.push ( [
							function () { console.log ( 'chat ranking' ); },
							fmt ( 'select count(*) as rank from chat where id < %s', id ),
							//`select count(*) as rank from chat where id < ${id}`,
							function ( results ) { rank.chat = results [ 0 ].rank; }
						] );
					} else {
						
						this.push ( [
							function ( sql ) { console.log ( 'category ranking sql:', sql ); },
							fmt ( 'select count(*) as rank from category where id < %s', esc.category ),
							//`select count(*) as rank from category where id < ${esc.category}`,
							function ( results ) { rank.category = results [ 0 ].rank; }
						] );
						
						if ( table === '`post`' ) {
							if ( 'topic' in ref ) {
								console.log ( fmt ( '( topic post ): category-%s, topic-%s, id-%s', esc.category, esc.topic, id ) );//`( topic post ): category-${esc.category}, topic-${esc.topic}, id-${id}` );
								this.push ( [
									function ( sql ) { console.log ( 'topic ranking sql:', sql ); },
									fmt ( 'select count(*) as rank from topic where category = %s and id < %s', esc.category, esc.topic ),
									//`select count(*) as rank from topic where category = ${esc.category} and id < ${esc.topic}`,
									function ( results ) { rank.topic = results [ 0 ].rank; }
								], [
									function ( sql ) { console.log ( 'post ranking sql:', sql ); },
									fmt ( '%s where category = %s and topic = %s and id < %s', select, esc.category, esc.topic, id ),
									//`${select} where category = ${esc.category} and topic = ${esc.topic} and id < ${id}`,
									function ( results ) { rank.post = results [ 0 ].rank; }
								] );
							} else {
								this.push ( [
									function ( sql ) { console.log ( 'post ranking sql:', sql ); },
									fmt ( '%s where category = %s and topic is null and id < %s', select, esc.category, id ),
									//`${select} where category = ${esc.category} and topic is null and id < ${id}`,
									function ( results ) { rank.post = results [ 0 ].rank; }
								] );
							}
						} else if ( table === '`topic`' ) {
							this.push ( [
								function () { console.log ( 'topic ranking' ); },
								fmt ( 'select count(*) as rank from topic where category = %s and id < %s', esc.category, id ),
								//`select count(*) as rank from topic where category = ${esc.category} and id < ${id}`,
								function ( results ) { rank.topic = results [ 0 ].rank; }
							] );
						} else {
							callback ( fmt ( 'cannot process submission to "%s"', table) );//`cannot process submission to "${table}"`
						}
					}
				}
			}
			
			this.push ( [
				function () { console.log ( 'retrieve' ); },
				fmt ( 'select * from %s where id = %s', table, id ),
				//`select * from ${table} where id = ${id}`,
				function ( results ) {
					article = results [ 0 ];
					article.rank = rank;
				}
			] );
		} ],
		
		// this must be in place when processRequest is called
		// it will be popped off the transaction stack before
		// the first result handle is executed
		function ( err ) { callback ( err, article ); }
	);
}

function editQuery ( data, callback ) {
	callback ( 'not yet implemented' );
}

function deleteQuery ( data, callback ) {
	callback ( 'not yet implemented' );
}

exports.init = function ( connection, callback ) {
	// validate queries before wasting time in db
	db = connection;
	
	var tables = {};
	
	db.query ( 'show tables', function ( err, results, field ) {
		if ( err ) {
			console.error ( 'show tables failed!\n', err );
		} else {
			var name = field [ 0 ].name;
			for ( var i = 0, l = results.length; i < l; i = i + 1) {
				tables [ results [ i ][ name ] ] = true;
			}
			
			console.log ( 'logged tables for database "' + db.config.connectionConfig.database + '"' );
			console.log ( Object.keys ( tables ) );
		}
	} );
	
	resolve_transaction = resolveQueries.init ( db );
	
	return {
		getPage: pageQuery,
		getUpdate: updateQuery,
		submitArticle: submitQuery,
		editArticle: editQuery,
		removeArticle: deleteQuery
	};
};

var mysql = require('mysql'),
	resolveQueries = require('./resolve-queries.js'),
	db, resolve_transaction,
	request_limit = 10; // number of articles to fetch on a call by default

// sql injection attack safety
function escape_sqlId ( data ) {
	for ( let key in data ) {
		data [ key ] = mysql.escapeId ( data [ key ] );
	}
}

function escape_sql ( data ) {
	for ( let key in data ) {
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
	
	let { from: table, references: ref, index = 0, limit = request_limit } = data,
		{ category, topic, chat } = ( ref || {} ),
		esc = { category, topic, chat }, key,
		where = '',
		articles, total, timestamp, constraints = [];
	
	escape_sql ( esc );
	table = sql_escId ( table );
	index = sql_esc ( index );
	limit = sql_esc ( limit );
	
	if ( ref ) {
		for ( key in ref ) {
			if ( key in esc ) {
				constraints.push ( `${ key } = ${ esc [ key ] }` );
			}
		}
		
		where = 'where ' + constraints.join ( ' and ' ) + ' ';
	}
	
	console.log ( 'processing page request...' );
	processRequest (
		[
			( sql ) => { console.log ( 'page:', sql ); },
			`select ${table}.*, user.name as username from ${table} inner join user on ${table}.owner = user.id ${where}limit ${index}, ${limit}`,
			function ( results ) { articles = results; },
		], [
			( sql ) => { console.log ( 'count:', sql ); },
			`select count(*) as count from ${table}${where}`,
			function ( results ) { total = results [ 0 ].count; },
		], [
			( sql ) => { console.log ( 'timestamp:', sql ); },
			'select current_timestamp as timestamp',
			function ( results ) { timestamp = results [ 0 ].timestamp; },
		],
		err => { callback ( err, { articles, total, timestamp } ); }
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

	let {
		from: table,
		references: ref,
		timestamp: fromtimestamp,
		index = 0,
		limit = request_limit
	} = data,
		{ category, topic, chat } = ( ref || {} ),
		esc = { category, topic, chat }, key,
		where, articles, total, timestamp, constraints = [];
	
	escape_sql ( esc );
	table = sql_escId ( table );
	index = sql_esc ( index );
	limit = sql_esc ( limit );
	fromtimestamp = sql_esc ( fromtimestamp );
	
	if ( ref ) {
		for ( key in ref ) {
			if ( key in esc ) {
				constraints.push ( `${ key } = ${ esc [ key ] }` );
			}
		}
	}

	constraints.push ( `( edited > ${fromtimestamp} or created > ${fromtimestamp} ) ` );

	where = 'where ' + constraints.join(' and ');
	
	console.log ( 'processing update request...' );
	processRequest (
		[
			( sql ) => { console.log ( 'update:', sql ); },
			`select * from ${table} ${where} limit ${index}, ${limit}`,
			function ( results ) { articles = results; }
		], [
			( sql ) => { console.log ( 'count:', sql ); },
			`select count(*) as count from ${table} ${where}`,
			function ( results ) { total = results [ 0 ].count; }
		], [
			( sql ) => { console.log ( 'timestamp:', sql ); },
			'select current_timestamp as timestamp',
			function ( results ) { timestamp = results [ 0 ].timestamp; }
		],
		err => { callback ( err, { articles, total, timestamp } ); }
	);
}

function submitQuery ( data, callback ) {
	
	let {
		to: table,
		references: ref = {},
		userid: owner,
		title,
		body
	} = data,
		{ category, topic, chat } = ( ref || {} ),
		esc = { category, topic, chat }, key,
		dataset = { owner, body },
		constraints = [],
		article, rank = { type: table };
	
	escape_sql ( esc );
	table = sql_escId ( table );
	
	if ( ref ) {
		for ( key in ref ) {
			if ( key in esc ) {
				dataset [ key ] = esc [ key ];
				constraints.push ( `${ key } = ${ esc [ key ] }` );
			}
		}
	}
	
	if ( table !== '`post`' ) {
		dataset.title = title;
	}
	
	processRequest( [
		() => { console.log ( 'insert' ); },
		`insert into ${table} set ?`, dataset,
		
		// called in the context of the transaction stack
		// so pushing onto this is inserting queries into the transaction
		function ( results ) {
			let id = results.insertId;
			
			if ( 'chat' in ref ) {
				// it's a post, no need to check for category or topic
				this.push ( [
					() => { console.log ( 'chat ranking' ); },
					`select count(*) as rank from ${table} where chat = ${esc.chat} and id < ${id}`,
					function ( results ) { rank.post = results [ 0 ].rank; }
				] );
			} else {
				// may be a post or a topic
				let select = `select count(*) as rank from ${table}`;
				if ( 'category' in ref ) {
					
					let where = `where category = ${esc.category}`;
					
					rank.category = esc.category;
					
					if ( 'topic' in ref ) {
						// only posts have both a category and a topic
						this.push ( [
							() => { console.log ( 'topic ranking' ); },
							`${select} ${where} and topic < ${esc.topic}`,
							function ( results ) { rank.topic = results [ 0 ].rank; }
						], [
							() => { console.log ( 'post ranking' ); },
							`${select} ${where} and topic = ${esc.topic} and id < ${id}`,
							function ( results ) { rank.post = results [ 0 ].rank; }
						] );
						
					} else {
						// must be a topic
						this.push ( [
							() => { console.log ( 'post ranking' ); },
							`${select} ${where} and id < ${id}`,
							function ( results ) { rank.topic = results [ 0 ].rank; }
						] );
					}
				} else {
					// may be a chat or a category
					if ( 'chat' === rank.type ) {
						rank.chat = id;
					} else {
						// must be a category
						rank.category = id;
					}
				}
				
				this.push ( [
					() => { console.log ( 'retrieve' ); },
					`select * from ${table} where id = ${id}`,
					function ( results ) {
						article = results [ 0 ];
						article.rank = rank;
					}
				] );
			} } ],
		
		// this must be in place when processRequest is called
		// it will be popped off the transaction stack before
		// the first result handle is executed
		err => { callback ( err, article ); }
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
			for ( let i = 0, l = results.length; i < l; i = i + 1) {
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

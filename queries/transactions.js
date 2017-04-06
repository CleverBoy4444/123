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
				constraints.push ( `${ key } ${ esc [ key ] === 'NULL' ? 'is' : '='} ${ esc [ key ] }` );
			}
		}
		
		where = 'where ' + constraints.join ( ' and ' ) + ' ';
	}
	
	console.log ( 'processing page request...' );
	processRequest (
		[
			function ( sql ) { console.log ( 'page:', sql ); },
			`select ${table}.*, user.name as username from ${table} inner join user on ${table}.owner = user.id ${where}limit ${index}, ${limit}`,
			function ( results ) { articles = results; },
		], [
			function ( sql ) { console.log ( 'count:', sql ); },
			`select count(*) as count from ${table}${where}`,
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
			function ( sql ) { console.log ( 'update:', sql ); },
			`select * from ${table} ${where} limit ${index}, ${limit}`,
			function ( results ) { articles = results; }
		], [
			function ( sql ) { console.log ( 'count:', sql ); },
			`select count(*) as count from ${table} ${where}`,
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
	
	let {
		to: table,
		references: ref,
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
		function () { console.log ( 'insert' ); },
		`insert into ${table} set ?`, dataset,
		
		// called in the context of the transaction stack
		// so pushing onto this is inserting queries into the transaction
		function ( results ) {
			let id = results.insertId,
				select = `select count(*) as rank from ${table}`;
			
			if ( ref ) {
				if ( 'chat' in ref ) {
					this.push ( [
						function () { console.log ( 'chat ranking' ); },
						`select count(*) as rank from chat where id < ${esc.chat}`,
						function ( results ) { rank.chat = results [ 0 ].rank; }
					], [
						function () { console.log ( 'post ranking' ); },
						`${select} where chat = ${esc.chat} and id < ${id}`,
						function ( results ) { rank.post = results [ 0 ].rank; }
					] );
				} else {
					
					// categories are not relative so their ranking is always given as id - 1
					rank.category = esc.category - 1;
					
					if ( table === '`post`' ) {
						if ( 'topic' in ref ) {
							console.log ( `( topic post ): category-${esc.category}, topic-${esc.topic}, id-${id}` );
							this.push ( [
								function ( sql ) { console.log ( 'topic ranking sql:', sql ); },
								`select count(*) as rank from topic where category = ${esc.category} and id < ${esc.topic}`,
								function ( results ) { rank.topic = results [ 0 ].rank; }
							], [
								function ( sql ) { console.log ( 'post ranking sql:', sql ); },
								`${select} where category = ${esc.category} and topic = ${esc.topic} and id < ${id}`,
								function ( results ) { rank.post = results [ 0 ].rank; }
							] );
						} else {
							this.push ( [
								function ( sql ) { console.log ( 'post ranking sql:', sql ); },
								`${select} where category = ${esc.category} and topic is null and id < ${id}`,
								function ( results ) { rank.post = results [ 0 ].rank; }
							] );
						}
					} else if ( table === '`topic`' ) {
						this.push ( [
							function () { console.log ( 'topic ranking' ); },
							`select count(*) as rank from topic where category = ${esc.category} and id < ${id}`,
							function ( results ) { rank.topic = results [ 0 ].rank; }
						] );
					} else if ( table === '`chat`') {
						this.push ( [
							function () { console.log ( 'chat ranking' ); },
							`select count(*) as rank from chat where id < ${id}`,
							function ( results ) { rank.chat = results [ 0 ].rank; }
						] );
					} else {
						callback ( `cannot process submission to "${table}"` );
					}
				}
			}
			
			this.push ( [
				function () { console.log ( 'retrieve' ); },
				`select * from ${table} where id = ${id}`,
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

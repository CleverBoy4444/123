var express = require ( 'express' ),
	session = require ( 'express-session' ),
	MySqlStore = require ( 'express-mysql-session' ),
	path = require ( 'path' ),
	fmt = require ( 'util' ).format,
	app = express (),
	router = express.Router (),
	server = require ( 'http' ).Server ( app ),
	io = require ( 'socket.io' ) ( server ),
	db,
	db_connection = {
		connectionLimit : 10,
		host: process.env.IP || 'localhost',
		user: process.env.C9_USER || 'root',
		password: '',
		database: 'eon_forums' // change if not on Cloud9
	},
	sessionStore_options = {
		checkExpirationInterval: 900000,    // check session expiration every 15 min
		expiration: 86400000,               // session expires after 24 hours
		createDatabaseTable: true,          // create session table automatically
	},
	sessionStore,
	con = require ( './console/console.js' ),
	initDatabase = require ( './init.js' );

console.log ( process.version );

// init db here, if anything fails we have no server
initDatabase ( db_connection, function callback ( err, result ) {
	if ( err ) {
		con.error ( err.message );
		con.message ( 'shutting down server...' );
		server.close ();
		process.exit ( 1 );
		return;
	}
	db = result;
	
	con.message ( 'creating session store, engine mysql ( session table created for ' + db_connection.database + ')' );
	sessionStore = new MySqlStore ( sessionStore_options, db );
	var serverSession = session ( {
		secret: 'eon_forum_session',    // server side session secret
		store: sessionStore,
		resave: false,
		saveUninitialized: true
	} );
	
	io.use ( function ( socket, next ) {
		serverSession ( socket.request, socket.request.res, next );
	} );
	
	app.use ( serverSession );
	
	// configure application routes
	con.message ( 'loading application routes /forums, /login, ( /signup )' );
	require ( './app-routing.js' ) ( app, db, router );
	
	// configure io routes
	con.message ( 'loading io routes' );
	require ( './io-routing.js' ) ( server, db, io );
	
	app.use ( router );
	
	// set the view folder ( /source/views ) and templating engine ( jade )
	con.message ( 'app view engine - pug' );
	app.set ( 'views', path.join ( __dirname, 'views' ) );
	app.set ( 'view engine', 'pug' );
	
	// define the public folder
	con.message ( 'public folder points to /js, /css' );
	app.use ( express.static ( path.join ( __dirname, 'public' ), { redirect : false } ) );
	
	con.message ( 'starting server!' );
	var port = process.env.PORT || 8080,
		addr = process.env.IP || "0.0.0.0";
	try {
		server.listen( port, addr, function () {
			con.message ( 'server ready!' );
			con.message ( fmt ( 'application server running at %s:%s', addr.address, addr.port ) );
		} );
	} catch ( e ) {
		con.warn ( fmt ( 'Server may already be running at %s:%s', addr, port ) );
		con.message ( 'Try visiting https://eon-team-signin-ericbalingit.c9users.io' );
		con.error ( e );
	}
} );
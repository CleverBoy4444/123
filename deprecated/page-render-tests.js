var express = require ( 'express' ),
	path = require ( 'path' ),
	app = express (),
	router = express.Router (),
    server = require ( 'http' ).Server ( app ),
    io = require ( 'socket.io' ) ( server );

// set the templating engine ( jade ) and view folder ( source/views )
app.set ( 'views', path.join(__dirname, 'source/views') );
app.set ( 'view engine', 'pug' );

var signup = io.of ( '/signup' ),
	login = io.of ( '/login' ),
	forum = io.of ( '/forum' );

signup.on ( 'connection', function ( socket ) {
	socket.on ( 'signup', function ( username, password ) {
		// socket.emit ( '_error_', null, 'This is a test...' );
		socket.emit ( 'redirect', {
            location: '/login',
            wait: 3000,
            message: 'Success!  Welcome ' + username + ' ( round trip from the server ).'
		} );
	} );
} );

login.on ( 'connection', function ( socket ) {
	socket.on ( 'login', function ( username, password ) {
		socket.emit ( 'redirect', {
            location: '/forum',
            wait: 3000,
            message: 'Success!  Welcome ' + username + ' ( round trip from the server ).'
		} );
	} );
} );

forum.on ( 'connection', function ( socket ) {
	socket.on ( 'post', function ( message, data ) {
		
	} );
} );

// define the public folder
app.use ( express.static ( path.join ( __dirname, 'public' ) ) );

router.get ( '/login', function ( req, res ) {
	res.render ( 'login-view', {
		signup: true
	}, function ( err, html ) {
		if ( err ) {
			console.log ( err );
			res.status ( 500 ).send ( 'error: page render failed, contact system administrator [ login-view.pug ]' );
		} else {
			res.send ( html );
		}
		
		// auto-close
		//server.close ();
	} );
} );

router.get ( '/signup', function ( req, res ) {
	res.render ( 'signup-view', function ( err, html ) {
		if ( err ) {
			console.log ( err );
			res.status ( 500 ).send ( 'error: page render failed, contact system administrator [ login-view.pug ]' );
		} else {
			res.send ( html );
		}
		
		// auto-close
		//server.close ();
	} );
} );

// prevent routing errors on signup/login
router.get ( '/alt', function ( req, res ) {
	res.send ( 'Ready...' );
} );

router.post ( '/alt', function ( req, res ) {
	res.status ( 200 ).send ( 'Recieved post request...' );
} );

function defaultView ( req, res ) {
	res.render ( 'forum-view', {
		name: 'Test User',
		owners: [
			{ id: 0, name: 'Test User' },
			{ id: 1, name: 'User2' },
			{ id: 2, name: 'User3' }
		],
		chatbar: [
			{ uid: 0, owner: 'Test User' },
			{ uid: 1, owner: 'User2' }
		]
	}, function ( err, html ) {
		if ( err ) {
			console.log ( err );
			res.status ( 500 ).send ( 'error: page render failed, contact system administrator [ forum-view.pug ]' );
		} else {
			res.send ( html );
		}
		
		// auto-close
		//server.close ();
	} );
}

router.get ( '/', defaultView );

router.get ( '/forum', defaultView );

app.use ( router );

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {
    var addr = server.address();
    console.log("Application server running at", addr.address + ":" + addr.port);
});
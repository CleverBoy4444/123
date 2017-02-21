var express = require ( 'express' ),
    path = require ( 'path' ),
    app = express (),
    server = require ( 'http' ).Server ( app ),
    router = express.Router (),
    users = require ( 'socket.io.users' ),
    userSession = users.Session ( app ),
    io = require ( 'socket.io' ) ( server ),
    mysql = require ( 'mysql' ),
    db = mysql.createConnection( {
        host: process.env.IP || 'localhost',
        user: process.env.C9_USER || 'root',
        password: '',
        database: 'eon_forums' // change if not on Cloud9
    } ),
    // the login route
    routeLogin,
    // signup route
    routeSignup,
    // the default route
    routeDefault;

// define the path to public request folder
// set the templating engine ( embedded js ) and view folder
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// define the public folder
app.use(express.static(path.join(__dirname, 'public')));

// the login page
routeLogin = require ( './login.js' ) ( app, db, router, io );

// the forum page
routeDefault = require ( './forum.js' ) ( app, db, router, io );

// wrap user sessions ( close server when everyone leaves )
var session_wrapper = require ( './wrap-io-session.js' ).bind ( server, db );

require ( './io-routes.js' ) ( io, session_wrapper );

app.use ( '/', router );

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {
    var addr = server.address();
    console.log("Application server running at", addr.address + ":" + addr.port);
});

exports.app = app;
exports.io = io;
exports.db = db;
var express = require('express');
var app = express();

var http = require('http');
var server = http.Server(app);

var mysql = require('mysql');

var io = require('socket.io')(server);

app.use(express.static('client'));

var dbHost = process.env.IP || 'localhost',
    dbUser = process.env.C9_USER || 'root';

var connection = mysql.createConnection({
    host: dbHost,
    user: dbUser,
    password: '',
    database: 'eon_forums' // change if not on Cloud9
});

var sql = 'select `id`,`owner` from `category`';
connection.query(sql, function(err, rows) {
    if (err) {
        console.error('categories sql error: ' + err.stack);
    } else {
        //console.log ( JSON.stringify(rows) );
    }
});

io.on('connection', function(socket) {
    console.log ( socket );
    socket.on('message', function(msg) {
        io.emit('message', msg);
    });
    socket.on('disconnect', function() {
        io.emit('message', "User disconnected");
    });
});

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {
    var addr = server.address();
    console.log("Chat server running at", addr.address + ":" + addr.port);
});

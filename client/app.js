/* global io, $ */

var socket = io();

// the form is where all this stuff happens
// open index.html
// I copied all my code into demo.html
// see if you can put a form same as in index.html
// into my code
// then add
// <script src="app.js"></script>
// then visit the https://eon-team-signin-ericbalingit.c9users.io/demo.html
// to see how that looks
// see if we can chat in the demo page
// won't work without tweaks though
$('form').submit(function() {
    var text = $('#you').val() + ' says: ' + $('#m').val();
    socket.emit('message', text);
    $('#m').val('');
    return false;
});

//

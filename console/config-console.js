var prompt = require ( 'prompt' ),
    colors = require ( 'colors/safe' );

colors.setTheme ( {
    message: [ 'white', 'bgBlack' ],
    caution: [ 'yellow' ],
    warn: [ 'black', 'bgYellow' ],
    error: [ 'white', 'bgRed' ],
    fail: [ 'red', 'bgWhite' ],
    query: [ 'cyan' ]
} );

var src = 'forum-server:',
    msg = colors.message ( src ),
    wrn = colors.warn ( src ),
    err = colors.error ( src );

prompt.message = wrn;
prompt.delimiter = ' ';

exports.prompt = prompt;
exports.colors = colors;

exports.msg = msg;
exports.message = function message ( text ) {
    console.log ( msg + ' ' + text );
};

exports.wrn = wrn;
exports.warn = function warn ( text ) {
    console.log ( wrn + colors.caution ( ' ' + text ) );
};

exports.err = colors.error ( src );
exports.error = function error ( text ) {
    console.log ( err + colors.fail ( ' ' + text ) );
};
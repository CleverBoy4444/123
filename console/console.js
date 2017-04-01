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

module.exports = {
	
	prompt, colors, msg, wrn, err,
	
	message: text => console.log ( msg + ' ' + text ),
	warn: text => console.log ( wrn + colors.caution ( ' ' + text ) ),
	error: text => console.log ( err + colors.fail ( ' ' + text ) )
};
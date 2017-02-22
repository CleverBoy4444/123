module.exports = function ( server, db, io ) {
    require ( './io-routes/login-io.js' ) ( server, db, io );
    require ( './io-routes/forum-io.js' ) ( server, db, io );
    
    var signup;
    try {
    	// this will fail if the file is moved
    	require ( './app-routes/signup-route' );
    	
    	// which skips this step
    	signup = require ( './io-routes/signup-io.js' );
    } catch ( e ) {
    	console.log ( 'signup unavailable...' );
    }
    
    if ( signup ) {
    	signup ( server, db, io );
    }
};
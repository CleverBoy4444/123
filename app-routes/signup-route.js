module.exports = function ( db, router, jadeParams ) {
    
    var basename = 'signup-view',
        type = '.pug',
        pagename = basename + type;
    
    // dummy response to get chrome to save password
    router.get ( '/alt', function ( req, res ) {
    	res.send ( 'Ready...' );
    } );
    
    router.post ( '/alt', function ( req, res ) {
    	res.status ( 200 ).send ( 'Recieved post request...' );
    	console.log ( 'signup attempt...' );
    } );
    
    router.get ( '/signup', function ( req, res ) {
        res.render ( basename,
            function ( err, html ) {
                if ( err ) {
                    console.log ( err );
                    res.status ( 500 ).send ( 'error: page render failed, contact system administrator [ '+pagename+' ]' );
                } else {
                    res.send ( html );
                }
            }
        );
    } );
    
    console.log ( 'loaded signup route...' );
};
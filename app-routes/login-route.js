module.exports = function ( db, router ) {
    
    var basename = 'login-view',
        type = '.pug',
        pagename = basename + type;
    
    var pageParams = { signup: false };
            
    try {
        // singup may not be available
        require ( './signup-route.js' ) ( db, router );
        pageParams.signup = true;
    } catch ( e ) {
        console.log ( 'signup unavailable:', e );
        return;
    }
    
    router.get ( '/login', function ( req, res ) {
        
        console.log ( 'login' );
        
        var session = req.session;
        
        if ( 'user' in session ) {
            res.redirect ( '/forum' );
        } else {
            
            res.render ( basename,
                pageParams,
                function ( err, html ) {
                    if ( err ) {
                        console.log ( err );
                        res.status ( 500 ).send ( 'error: page render failed, contact system administrator [ '+pagename+' ]' );
                    } else {
                        res.send ( html );
                    }
                }
            );
        }
    } );
    
    console.log ( 'loaded login route...' );
};
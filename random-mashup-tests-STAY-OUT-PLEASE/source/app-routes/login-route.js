module.exports = function ( db, router ) {
    
    router.get ( '/login', function ( req, res ) {
        
        var user = req.session.user;
        if ( user ) {
            res.redirect ( '/?id='+user.id+'&name='+user.name+'&signin='+user.signin );
        } else {
            var jadeParams = { signup: false };
            
            try {
                // singup may not be available
                require ( './signup-route.js' ) ( db, router );
                jadeParams.signup = true;
            } catch ( e ) {
                console.log ( 'signup unavailable...' );
            }
            
            res.render ( 'login-view',
                jadeParams,
                function ( err, html ) {
                    console.log ( err );
                    res.send ( html );
                }
            );
        }
    } );
    
    console.log ( 'loaded login route...' );
};
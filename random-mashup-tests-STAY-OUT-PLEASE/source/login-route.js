module.exports = function ( db, router, io ) {
    
    router.get ( '/login', function ( req, res ) {
        var session = req.session;
        if ( session.user ) {
            session.user.viewing = "Categories";
            session.user.order = "descending";
            
            // redirect to the default location ( the forum )
            res.redirect ( '/' );
        } else {
            try {
                // singup may not be available
                require ( './signup.js' );
                session.signup = true;
            } catch ( e ) {}
            res.render ( 'login',
                session,
                function ( err, html ) {
                    console.log ( err );
                    res.send ( html );
                }
            );
        }
    } );
    
    console.log ( 'loaded login module...' );
};
module.exports = function ( db, router ) {
    
    function alias ( req, res, next ) {
        
        console.log ( 'forum' );
        
        var session = req.session;
        
        if ( 'user' in session ) {
            // session user should only exist when login succeeds and the query
            // matches the database entry for the user signin
            res.render ( 'forum-view',
                session.user,
                function ( err, html ) {
                    console.log ( err );
                    res.send ( html );
                }
            );
        } else {
            res.redirect ( '/login' );
        }
    }
    
    router.get ( '/', alias );
    
    router.get ( '/forum', alias );
    
    console.log ( 'loaded forum route...' );
};
module.exports = function ( db, router ) {
    
    router.get ( '/signup', function ( req, res ) {
        res.render ( 'signup-view',
            function ( err, html ) {
                if ( err ) {
                    console.log ( err );
                    res.status ( 500 ).send ( "jade: page render failed" );
                } else {
                    res.send ( html );
                }
            }
        );
    } );
    
    console.log ( 'loaded signup route...' );
};
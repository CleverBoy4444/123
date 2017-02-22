module.exports = function ( db, router ) {
    
    router.get ( '/', function ( req, res ) {
        var query = req.query;
        var session = req.session;
        
        if ( session.user ) {
            // session user should only exist when login succeeds and the query
            // matches the database entry for the user signin
            res.render ( 'forum-view',
                session.user,
                function ( err, html ) {
                    console.log ( err );
                    res.send ( html );
                }
            );
        } else if ( 'name' in query ) {
            var user = Object.assign ( {}, query );
            db.query ( 'select id, name, signin_code from table user where name=?', [ query.name ],
                function ( err, results, field ) {
                    if ( err ) {
                        console.log ( err );
                        res.status ( 500 ).send ( "post method: registered user query failed" );
                    } else {
                        user.viewing = "Categories";
                        user.order = "descending";
                        user.position = 0;
                        
                        session.user = user;
                        
                        res.render ( 'forum-view',
                            user,
                            function ( err, html ) {
                                console.log ( err );
                                res.send ( html );
                            }
                        );
                    }
                }
            );
        } else {
            res.redirect ( '/login' );
        }
    } );
    
    console.log ( 'loaded forum route...' );
};
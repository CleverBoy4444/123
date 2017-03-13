var bcrypt = require ( 'bcrypt' );

module.exports = function hash ( password, error, then ) {
    
    then = then || error;
    
    bcrypt.hash ( password, 10, function ( err, hash ) {
        if ( err ) {
            error ( err );
        } else {
            if ( then === error ) {
                then ( null, hash );
            } else {
                then ( hash );
            }
        }
    } );
};
var mysql = require ( 'mysql' ),
    db = mysql.createConnection( {
        host: process.env.IP || 'localhost',
        user: process.env.C9_USER || 'root',
        password: '',
    } );

db.query ( 'show databases', function ( err, results, fields ) {
    if ( err ) {
        console.log ( err );
    } else {
        console.log ( results );
    }
    
    console.log ( process.env.IP || 'localhost', process.env.C9_USER || 'root' );
} );
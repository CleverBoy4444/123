var fs = require ( 'fs' ),
    resolveQueries = require ( './queries/resolve-queries.js' );

module.exports = function dbConfig ( db, name, callback, error, log ) {
   
   log ( 'loading table definitions...' );
   
   fs.readFile ( './db-config/tables.sql', 'utf8', function ( err, data ) {
        if ( err ) {
            error ( err );
            return;
        }
        
        /*
        function next () {
            // after building tables?
            // callback() should be the last next() if no errors occur
        }
        */
        
        log ( 'table definitions loaded, building database ' + name + '...' );
        
        var queries = data
            .split ( '${name}' )
            .join ( name )
            .split ( /\n\n/g )
            .map ( function ( e ) {
                return [ e, error, log ];
            } );
        
        resolveQueries ( db, queries, callback );
    } );
};
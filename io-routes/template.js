var session = require ( './io-server-session-manager.js' );

function routeBindErr ( err ) {
    console.log ( err );
}

exports = function ( server, db, io ) {
    
        // create an io namespace
    var namespace = io.of ( '/login' ),
        
        // create a routing session wrapper
        // use wrapper.on ( '<open/message/close>', callbackFn );
        route = session ( server, db, namespace );
    
    route.on ( 'open',
        function ( db, socket ) {
            
            // on 'open' ( header is generic and can be anything you want )
            socket.on ( 'open', function ( room, params ) {
            } );
        },
        routeBindErr
    );
    
    route.on ( 'message',
        function ( db, socket ) {
            
            // on 'message' ( header is generic and can be anything you want )
            socket.on ( 'message', function ( room, params ) {
            } );
        },
        routeBindErr
    );
    
    route.on ( 'close',
        function ( db, socket ) {
            
            // on 'close' ( header is generic and can be anything you want )
            socket.on ( 'close', function ( room, params ) {
            } );
        },
        routeBindErr
    );
};
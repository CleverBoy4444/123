module.exports = function ( app, db, router ) {
    
    require ( './app-routes/forum-route.js' ) ( db, router );
    require ( './app-routes/login-route.js' ) ( db, router );
    
    // signup should only be exposed through the login-route via a
    // try catch since signup may be unavailable
};
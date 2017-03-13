/* global io, $ */
( function () {
    
    var socket = io ( '/signup' );
    
    var $signupForm = $ ( '#user-signup' ),
        $userName = $ ( '#user-name' ),
        $userPass = $ ( '#user-pass' ),
        $userConf = $ ( '#user-conf' ),
        $createUser = $ ( '#create-user' ),
        $nameErr = $ ( '#name-error' ),
        $passErr = $ ( '#pass-error' ),
        $confErr = $ ( '#conf-error' ),
        $success = $ ( '#success' ),
        $error = $ ( '#error' );
    
    socket.on ( 'redirect', function ( data ) {
        
        var wait,
            start,
            timeup;
        
        function timer () {
            var now = Date.now ();
            $success.text ( data.message.replace ( '${wait}', Math.round ( ( timeup - now ) / 1000 ) ) );
            if ( now < timeup ) {
                setTimeout ( function () {
                    timer ();
                }, 1000 );
            } else {
                window.location = data.location;
            }
        }
        
        $success.removeClass ( 'hidden' );
        $error.removeClass ( 'column-item' );
        $error.addClass ( 'hidden' );
        if ( data.login ) {
            
            wait = data.wait || 0;
            start = Date.now ();
            timeup = start + wait;
            
            timer ();
        }
    } );
    
    var submitted = false;
    
    socket.on ( '_error_', function ( err, message ) {
        if ( err ) {
            console.log ( err );
        }
        
        $success.addClass ( 'hidden' );
        $error.text ( message );
        $error.addClass ( 'column-item' );
        $error.removeClass ( 'hidden' );
        submitted = false;
    } );
    
    var rePass = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/;
    
    $signupForm.on ( 'submit', function submitForm ( e ) {
        
        if ( submitted ) {
            return false;
        } else {
        
            if ( $userName.val ().length < 1 ) {
                $nameErr.text ( 'Error: user name is required' );
                $nameErr.addClass ( 'column-item' );
                $nameErr.removeClass ( 'hidden' );
                return false;
            } else {
                $nameErr.removeClass ( 'column-item' );
                $nameErr.addClass ( 'hidden' );
            }
            
            if ( !rePass.test ( $userPass.val () ) ) {
                $passErr.text ( 'Error: password must contain 1 digit, 1 upper case, 1 lower case and be 8 characters long' );
                $passErr.addClass ( 'column-item' );
                $passErr.removeClass ( 'hidden' );
                return false;
            } else {
                $passErr.removeClass ( 'column-item' );
                $passErr.addClass ( 'hidden' );
            }
            
            if ( $userPass.val () !== $userConf.val () ) {
                $confErr.text ( 'Error: confirmed password must match password' );
                $confErr.addClass ( 'column-item' );
                $confErr.removeClass ( 'hidden' );
                return false;
            } else {
                $confErr.removeClass ( 'column-item' );
                $confErr.addClass ( 'hidden' );
            }
            
            console.log ( 'client signup...' );
            socket.emit ( 'signup', $userName.val (), $userPass.val () );
            submitted = true;
            
        }
        
    } );
    
} ) ();
/* global io, $ */
( function () {
	
	var $userName = $ ( '#user-name' ),
		$userPass = $ ( '#user-pass' ),
		$login = $ ( '#login-user' ),
		$success = $ ( '#success' ),
		$error = $ ( '#error' ),
		socket = io ( '/login' );
	
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
		
		$login.off ( 'click' );
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
	
	socket.on ( '_error_', function ( err, message ) {
		if ( err ) {
			console.log ( err );
		}
		
		$success.addClass ( 'hidden' );
		$error.text ( message );
		$error.addClass ( 'column-item' );
		$error.removeClass ( 'hidden' );
	} );
	
	$login.on ( 'click', function ( e ) {
		if ( $userName.val ().length === 0 || $userPass.val ().length === 0 ) {
			$success.addClass ( 'hidden' );
			$error.text ( 'Error: user name and password are required' );
			$error.addClass ( 'column-item' );
			$error.removeClass ( 'hidden' );
		} else {
			socket.emit ( 'login', $userName.val (), $userPass.val () );
		}
	} );
	
	$userPass.on ( 'keydown', function ( e ) {
		if ( e.which === 13 ) {
			$login.trigger ( 'click' );
		}
	} )
} ) ();
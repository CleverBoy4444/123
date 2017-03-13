/* Simple POLYFILL so templates don't puke in IE < 13 */
/* Thanks to: http://jsfiddle.net/brianblakely/h3EmY/ */
( function templatePolyfill ( d ) {
	if ( 'content' in d.createElement( 'template' ) ) {
		return false;
	}
	
	var templates = d.getElementsByTagName ( 'template' ),
		count = templates.length,
		tempEl,
		children,
		child,
		content;

	for ( var i = 0; i < count; i = i + 1 ) {
		tempEl = templates [ i ];
		children = tempEl.childNodes;
		child = children.length;
		content = d.createDocumentFragment();

		while ( child-- ) {
			content.appendChild ( children [ child ] );
		}

		tempEl.content = content;
	}
} ) ( document );
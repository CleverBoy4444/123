/* global io, $, Remarkable, hljs */
( function () {
    
    var socket = io ( '/forum' ),
        mdFull = new Remarkable ( 'full', {
            html: true,
            linkify: true,
            typographer: true,
            highlight: function (str, lang) {
                if ( lang && hljs.getLanguage ( lang ) ) {
                    try {
                        return hljs.highlight(lang, str).value;
                    } catch ( err ) {
                        console.log ( err );
                        return err.toString ();
                    }
                }
                
                try {
                    return hljs.highlightAuto(str).value;
                } catch (err) {
                    console.log ( err );
                    return err.toString ();
                }
            }
        } ),
        // menu
        $menu = $ ( '#menu' ),
        $menuButton = $( '#toggle-menu' ),
        $menuContent = $ ( '#menu-content' ),
        $showMessages = $ ( '#show-messages' ),
        $menuItems = $ ( '.menu-item' ),
        
        // page navigation
        $select = $ ( '#select' ),
        $category = $ ( '#category' ),
        $topic = $ ( '#topic' ),
        
        // search
        $owner = $ ( '#owner' ),
        $order = $ ( '#order' ),
        $online = $ ( '#online' ),
        
        // visual queues
        $contentRemaining = $ ( '#content-column .remaining-content' ),
        $contentLoading = $ ( '#content-column .loading' ),
        $moreContent = $ ( '#more-content' ),
        
        // user views
        $allViews = ( '#content-column' ),
        $categoryStubs = $ ( '#category-stubs' ),
        $categoryView = $ ( '#category-view' ),
        $topicStubs = $ ( '#topic-stubs' ),
        $topicView = $ ( '#topic-view' ),
        
        // current content view
        $currentView = $categoryStubs,
        
        // user controls
        $titleSection = $ ( '#title-section' ),
        $titleInput = $ ( '#user-title' ),
        $bodyInput = $ ( '#user-body' ),
        $userPost = $ ( '#user-post' ),
        $userPreview = $ ( '#user-preview' ),
        $previewContent = $ ( '#preview-content' ),
        $submitButton = $ ( '#submit' ),
        $previewButton = $ ( '#preview' ),
        $userMessageBox = $ ( '#user-message-box' ),
        $userMessage = $ ( '#user-message' ),
        $userChatBar = $ ( '#user-chat-bar' ),
        $userName = $ ( '#user-name' ),
        $userChat = $ ( '#user-chat' ),
        myName = $userName.text (),
        myRooms = {},
        sentRequests = [],
        recievedArticles = [],
        requestUID = 0,
        
        // page templates
        tempAbout = document.getElementById ( 'view-about' ),
        tempArticle = document.getElementById ( 'view-article' ),
        tempReply = document.getElementById ( 'view-reply' ),
        tempChatMin = document.getElementById ( 'view-chat-min' );
    
    function socketErr ( message, err ) {
        if ( err ) {
            console.log ( err );
        } else {
            message = err;
        }
        $userMessageBox.html ( '<span class="error-message">' + ( message || 'Something went wrong, but I don\'t know what.  Sorry about that. See console and contact system administrator.' ) + '</span>' );
    }
    
    function createPageRequest ( section, parent, parentId, fromIndex, newest ) {
        var request = {
            uid: requestUID++,
            from: section,
            references: parent,
            id: parentId,
            index: fromIndex,
            newest: newest
        };
        
        sentRequests.push ( request );
        return request;
    }
    
    function requestPage ( section, parent, parentId, fromIndex, newest ) {
        socket.emit ( 'request', 'page', createPageRequest ( section, parent, parentId, fromIndex, newest ) );
    }
    
    function createUpdateRequest ( section, parent, parentId, since, fromIndex, newest ) {
        var request = {
            uid: requestUID++,
            from: section,
            references: parent,
            id: parentId,
            timestamp: since,
            index: fromIndex,
            newest: newest
        };
        
        sentRequests.push ( request );
        return request;
    }
    
    function createChatTab ( room, title, id ) {
        var $tab = $ ( tempChatMin.content.cloneNode ( true ) );
        console.log ( $tab [ 0 ] );
        $tab.data ( { room: room, title: title, id: id, html: '' } );
        $tab.find ( '.room' ).text ( room );
        myRooms [ room ] = $tab;
        $userChatBar.append ( $tab );
    }
    
    function postToRoom ( room, user, message ) {
        var data = myRooms [ room ].data ();
        data.html = data.html + '<p>' + user + ': ' + message + '</p>';
    }
    
    // a column of html content based on templates, provided for requests
    function DataView ( $parent, id, newest, template ) {
        this.$parent = $parent;
        this.id = id;
        this.top = [];
        this.bottom = [];
        this.length = 0;
        this.position = 0;
        this.template = typeof template === 'string' ? document.getElementById ( template ) : template;
    }
    
    DataView.prototype.addContent = function ( data, newest ) {
        
    };
    
    socket.on ( '_error_', function ( err, message ) {
        socketErr ( err, message );
    } );
    
    // the default view of the page
    socket.on ( 'join', function ( room ) {
        $userMessage.html ( '<span class="message">You are in room "' + room + '", happy chatting!' );
        if ( ! ( room in myRooms ) ) {
            createChatTab ( room );
        }
    } );
    
    socket.on ( 'leave', function ( room ) {
        delete myRooms [ room ];
        $userMessageBox.html ( '<span class="message">You are no longer in room "' + room + '".' );
    } );
    
    socket.on ( 'joined', function ( name, room ) {
        var userRoom = myRooms [ room ],
            html = userRoom.data ( 'html' );
        
        userRoom.data ( 'html' )
        $userMessageBox.html ( '<span class="message">User "' + name + '" joined the room.</span>' );
    } );
    
    socket.on ( 'left', function ( name ) {
        $userMessageBox.html ( '<span class="message">User "' + name + '" left the room.</span>' );
    } );
    
    socket.on ( 'response', function ( message, data ) {
        var request;
        for ( var i = 0, l = sentRequests.length; i < l; i = i + 1 ) {
            if ( sentRequests [ i ].uid === data.uid ) {
                request = sentRequests [ i ];
                break;
            }
        }
        $userMessageBox.html ( '<span class="message">' + message + '</span>' );
    } );
    
    socket.emit ( 'join', 'Forum' );
    
    //requestPage ( 'category', null, null, 0, true );
        
    $ ( 'body' ).on ( 'click', 'a', function ( e ) {
        // no location changes while on page
        e.preventDefault ();
        e.stopPropagation ();
    } );
    
    $userChatBar.on ( 'click' )
    
    // switch primary view
    $select.on ( 'click', 'option', function ( e ) {
        $allViews.find ( '[id]' ).addClass ( 'hidden' );
        $allViews.find ( '[id=' + this.id + '-stubs]' ).removeClass ( 'hidden' );
    } );
    
    // switch to secondary view
    $categoryStubs.on ( 'click', 'a.stub', function ( e ) {
        $allViews.find ( '[id]' ).addClass ( 'hidden' );
        $categoryView.removeClass ( 'hidden' );
        
        // request data if needed
        // scroll to subject
    } );
    
    // stop propagation above menu ( so we can listen
    // for other events and close it )
    $menu.on ( 'click', function () {
        return false;
    } );
    
    // menu should automatically go away when anything else is clicked
    $ ( document ).on ( 'click', function () {
        $menuContent.addClass ( 'hidden' );
    } )
    
    $menuItems.each ( function ( i, e ) {
        e.$check = $ ( e ).find ( '.check' );
    } );
    
    $menuButton.on ( 'click', function ( e ) {
        $menuContent.toggleClass ( 'hidden' );
    } );
    
    $menuItems.on ( 'click', function ( e ) {
        this.$check.toggleClass ( 'checked' );
    } );
    
    $showMessages.on ( 'click', function ( e ) {
        $userMessageBox.toggleClass ( 'hidden', !this.$check.hasClass ( 'checked' ) );
    } );
    
    $userPreview.loading = $userPreview.find ( '.loading' );
    
    $previewButton.on ( 'click', function ( e ) {
        console.log ( 'test' );
        if ( this.value === 'Preview' ) {
            
            // get a promise to handle the content render
            new Promise ( function ( resolve, reject ) {
                // some views do not have a title
                var title = $titleSection.hasClass( 'hidden' ) ? '' : $titleInput.val ();
                try { // try to render content
                    resolve ( mdFull.render ( '### ' + title + '\n' + $bodyInput.val () ) ); //----
                } catch ( err ) {                                                           //
                    // reject content ---------------------------------------               //
                    reject ( err );                                         //              //
                }                                                           //              //
            } ).then ( function ( html ) {  // success  <-------------------//--------------//
                //$userPreview.loading.addClass ( 'hidden' );              //
                $previewContent.html ( html );                                 //
            } ).catch ( function ( err ) {  // something went wrong  <------//
                //$userPreview.loading.addClass ( 'hidden' );
                $previewContent.text ( err );
            } );
            $userPreview.removeClass ( 'hidden' );
            //$userPreview.loading.removeClass ( 'hidden' );
            $userPost.addClass ( 'hidden' );
            this.value = 'Edit';
        } else if ( this.value === 'Edit' ) {
            $userPost.removeClass ( 'hidden' );
            //$userPreview.loading.addClass ( 'hidden' );
            $userPreview.addClass ( 'hidden' );
            this.value = 'Preview';
        }
    } );
} ) ();
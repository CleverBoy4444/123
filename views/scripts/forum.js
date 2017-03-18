/* global io, $, Remarkable, hljs */
( function ( socket, md, Application ) {
    
// Application {
    
    new Application (
        
        socket,
        md,
        
        // io
        {
            _error_: function ( err, message ) {
                if ( err ) {
                    console.log ( err );
                } else if ( arguments.length === 1 ) {
                    message = err;
                }
                
                this.$ui.id.userMessageBox.html ( '<span class="error-message">' + ( message || 'Something went wrong, but I don\'t know what.  Sorry about that. See console and contact system administrator.' ) + '</span>' ); },
            
            chatin: function ( id, name, message ) {
                this.chatMessage ( id, name + ': ' + message ); },
            
            joined: function ( id, name ) {
                this.chatMessage ( id, id + ': "' + name + '" joined the room' ); },
            
            left: function ( id, name ) {
                this.chatMessage ( id, id + ': "' + name + '" left the room' );
            }
        },
        
        // ui handles by id
        {
            /*
            forumContent: {
                click: [ '[id$="stubs"]', function ( event ) {
                    var $ui = event.data.$ui,
                        $forumContent = $ui.forumContent,
                        view = ( this.id ).split ( '-' ) [ 0 ],
                        $view = $ui [ view + 'View'];
                    
                    $forumContent.find ( '>[id]' ).addClass ( 'hidden' );
                    
                    if ( view === 'category' ) {        // this is a category stub, requesting to view the category
                    } else {                            // this is a topic stub, requesting to view the topic
                    }
                    
                } ] },
            */
            
            menu: {
                click: function () { return false; } },
            
            menuContent: {
                click: [ '.menu-item', function ( event ) {
                    $ ( this ).find ( '.check' ).toggleClass ( 'checked' );
                } ] },
            
            page: {
                click: function ( event ) {
                    var $ui = event.data.$ui;
                    
                    $ui.id.menuContent.addClass ( 'hidden' );
                    $ui.id.userChat.addClass ( 'hidden' );
                    $ui.id.userChatNew.addClass ( 'hidden' );
                } },
            
            preview: {
                click: function ( event ) {
                    var $id = event.data.$ui.id;
                    if ( this.value === 'Preview' ) {
                        
                        // get a promise to handle the content render
                        new Promise ( function ( resolve, reject ) {
                            
                            $id.userPost.addClass ( 'hidden' );
                            $id.previewContent.html ( '' );
                            $id.userPreview.removeClass ( 'hidden' );
                            $id.previewLoading.removeClass ( 'hidden' );
                            
                            // some views do not have a title
                            var title = $id.titleSection.hasClass( 'hidden' ) ? '' : '### ' + $id.userTitle.val () + '\n\n';
                            try { // try to render content
                                resolve ( md.render ( title + $id.userBody.val () ) ); //----------------
                            } catch ( err ) {                                                           //
                                // reject content ---------------------------------------               //
                                reject ( err );                                         //              //
                            }                                                           //              //
                        } ).then ( function ( html ) {  // success  <-------------------//--------------//
                            $id.previewLoading.addClass ( 'hidden' );                   //
                            $id.previewContent.html ( html );                           //
                        } ).catch ( function ( err ) {  // something went wrong  <------//
                            $id.previewLoading.addClass ( 'hidden' );
                            $id.previewContent.text ( err );
                        } );
                        
                        this.value = 'Edit';
                        
                    } else if ( this.value === 'Edit' ) {
                        $id.userPost.removeClass ( 'hidden' );
                        $id.previewLoading.addClass ( 'hidden' );
                        $id.userPreview.addClass ( 'hidden' );
                        this.value = 'Preview';
                    }
                } },
            
            select: {
                click: [
                    'option', function ( event ) {
                        var $forumContent = event.data.$ui.id.forumContent;
                        
                        // poor ui design consider having specific controls for navigating stubs/categories/topics
                        $forumContent.find ( '>[id]' ).addClass ( 'hidden' );
                        $forumContent.find ( '>[id=' + this.id + '-stubs]' ).removeClass ( 'hidden' );
                    }
                ] },
            
            showMessages: {
                click: function ( event ) {
                    event.data.$ui.id.userMessageBox.toggleClass ( 'hidden', !!$ ( this ).find ( '.checked' ).length );
                } },
            
            toggleMenu: {
                click: function ( event ) {
                    event.data.$ui.id.menuContent.toggleClass ( 'hidden' );
                } },
            
            userChatBar: {
                click: [
                    '.room', function ( event ) {
                        console.log ( 'clicked room...' );
                        var $id = event.data.$ui.id,
                            $userChat = $id.userChat,
                            $userChatRoom = $id.userChatRoom,
                            $userChatTitle = $id.userChatTitle,
                            $userChatOwner = $id.userChatOwner,
                            $userChatContent = $id.userChatContent,
                            $room = $ ( event.target ),
                            $chatMin = $room.parent (),
                            id = $room.text (),
                            chat = event.data.rooms [ id ],
                            messages = chat.messages;
                        
                        console.log ( id );
                        $userChatRoom.text ( id );
                        $userChatTitle.text ( chat.title || '' );
                        $userChatOwner.text ( chat.owner || '' );
                        
                        for ( var i in messages ) {
                            if ( typeof messages [ i ] === 'string' ) {
                                $userChatContent.append ( $ ( '<div class="message">' ).append ( $.parseHTML ( messages [ i ] ) ) );
                            } else {
                                var message = messages [ i ];
                                $userChatContent.append ( $ ( '<div class="message">' ).text ( message.error + '\n\n' + message.originalMessage ) );
                            }
                        }
                        $userChatContent.html ( chat.messages.join ( '' ) );
                        
                        $userChat.attr ( 'data-room', id );
                        $userChat.removeClass ( 'hidden' );
                        
                        $chatMin.removeClass ( 'notify' );
                        
                        // page clicks hide user chat, which is not what we want
                        // here so we stop propagation of this click event
                        return false; },
                    '.close', function ( event ) {
                        event.data.leaveChat ( $ ( this ).parent ().attr ( 'data-room' ) );
                    } ] },
            
            userChat: {
                click: [
                    function ( event ) {
                        // page clicks hide user chat, which is not what we want
                        // here so we stop propagation of this click event
                        return false; },
                    '.minimize', function ( event ) {
                        event.data.$ui.id.userChat.addClass ( 'hidden' );
                    } ] },
                    
            userChatSubmit: {
                click: function ( event ) {
                    var app = event.data,
                        $id = app.$ui.id;
                    
                    app.sendChat ( $id.userChat.attr ( 'data-room' ), $id.userChatInput.val () );
                }
            }
        },
        
        // ui handles by class name
        {
            menuItem: {
                click: [ '.check', function ( event ) {
                    $ ( this ).toggleClass ( 'checked' );
                } ] }
        },
        
        // after everything is hooked up
        function ( app ) {
            $ ( window ).on ( 'beforeunload', function ( event ) {
                for ( var id in app.rooms ) {
                    socket.emit ( 'leave', id, app.noop );
                }
            } );
            
            console.log ( 'joining chat "Forum"...' );
            
            app.joinChat ( 'Forum' );
        }
    );
    
// }
    
    /*
    
// variable declarations {
    
    var $menu = $ ( '#menu' ),
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
        $userChatRoom = $ ( '#user-chat-room' ),
        $userChatTitle = $ ( '#user-chat-title' ),
        $userChatContent = $ ( '#user-chat-content' ),
        myName = $userName.text (),
        myRooms = {},
        sentRequests = [],
        recievedArticles = [],
        requestUID = 0,
        
        // page templates
        tempAbout = document.getElementById ( 'template-about' ),
        tempArticle = document.getElementById ( 'template-article' ),
        tempReply = document.getElementById ( 'template-reply' ),
        tempChatMin = document.getElementById ( 'template-chat-min' );
    
// }
    
// helpers {
    
    function socketErr ( err, message ) {
        if ( err ) {
            console.log ( err );
        } else if ( arguments.length = 1 ) {
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
    
    function setData ( node, name, data ) {
        if ( arguments.length === 2 ) {
            if ( typeof name === 'string' ) {
                return $.data ( node, name );
            } else if ( typeof name === 'object' ) {
                for ( var key in name ) {
                    $.data ( node, key, name [ key ] );
                }
            }
        } else if ( arguments.length === 3 ) {
            $.data ( node, name, data );
        }
    }
    
    function createChatTab ( room, title, id ) {
        var node = tempChatMin.content.cloneNode ( true );
        $ ( '.room', node ).text ( room );
        myRooms [ room ] = node;
        $userChatBar.append ( node );
        setData ( node, { room: room, title: title || null, id: id || null, html: '' } );
        alert ( 'room: ' + $.data ( node, 'room' ) );
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
// }

// socket event bindings {
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
    
// }
    
// ET phone home {
    
    socket.emit ( 'join', 'Forum' );
    
    //requestPage ( 'category', null, null, 0, true );
    
// }
    
// jquery event bindings {
    
    // $ ( 'body' ).on ( 'click', 'a', function ( e ) {
    //     // no location changes while on page
    //     e.preventDefault ();
    //     e.stopPropagation ();
    // } );
    
    // {
    $userChatBar.on ( 'click', '.room', function ( e ) {
        
        // alert ( this.textContent );
        // var self = myRooms [ this.textContent ],
        //     data = self.data ();
        // alert ( self.data ( 'room' ) );
        // $userChatRoom.text ( data.room );
        // if ( data.title ) {
        //     $userChatTitle.text ( data.title );
        //     $userChatTitle.removeClass ( 'hidden' );
        // }
        // $userChatContent.html ( data.html );
        // $userChat.removeClass ( 'hidden' );
        
    } );
    
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
    // }
    
    $showMessages.on ( 'click', function ( e ) {
        $userMessageBox.toggleClass ( 'hidden', !this.$check.hasClass ( 'checked' ) );
    } );
    
    $userPreview.loading = $userPreview.find ( '.loading' );
    
    $previewButton.on ( 'click', function ( e ) {
        if ( this.value === 'Preview' ) {
            
            // get a promise to handle the content render
            new Promise ( function ( resolve, reject ) {
                // some views do not have a title
                var title = $titleSection.hasClass( 'hidden' ) ? '' : $titleInput.val ();
                try { // try to render content
                    resolve ( md.render ( '### ' + title + '\n' + $bodyInput.val () ) ); //----
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
    
// }
    
    */
    
} ) (
    io ( '/forum' ),
    new Remarkable ( 'full', {
        html: true,
        linkify: true,
        typographer: true,
        highlight: function ( str, lang ) {
            function padNum ( str, len ) {
                while ( str.length < len ) {
                    str = "0" + str;
                }
                return str;
            }
            var line = str.split ( '\n' ),
                pad = Math.max ( 2, ( line.length ).toString ().length );
            
            // remove incidental trailing line
            if ( !line [ line.length - 1 ] ) {
                line.length = line.length - 1;
            }
            
            if ( lang && hljs.getLanguage ( lang ) ) {
                try {
                    for ( var i = 0, l = line.length; i < l; i = i + 1 ) {
                        line [ i ] = '' +
                            '<li data-line="' + padNum ( '' + ( i + 1 ), pad ) + '">' +
                                hljs.highlight ( lang, line [ i ], true ).value +
                            '</li>';
                    }
                    return '<ol>' + line.join ( '' ) + '</ol>';
                } catch ( err ) {
                    console.log ( err );
                    return err.toString ();
                }
            }
            
            try {
                for ( var i = 0, l = line.length; i < l; i = i + 1 ) {
                    line [ i ] = '' +
                        '<li data-line="' + padNum ( '' + ( i + 1 ), pad ) + '">' +
                            hljs.highlightAuto ( line [ i ] ).value +
                        '</li>';
                }
                return '<ol>' + line.join ( '' ) + '</ol>';
            } catch (err) {
                console.log ( err );
                return err.toString ();
            }
        }
    } ),
    function Application ( socket, md, ioHandles, uiHandlesById, uiHandlesByClass, then ) {
        var _$ui = { id: {}, class: {} },
            _rooms = {},
            _views = {},
            _requests = [],
            _responses = [],
            _queue = [],
            _$escapeHTML = ( function ( $ ) {
                return function ( text ) {
                    return $.text ( text ).text();
                };
            } ) ( $ ( '<div>' ) ),
            _requestUID = 0,
            _data = {
                
                $ui: _$ui,
                rooms: _rooms,
                views: _views,
                requests: _requests,
                responses: _responses,
                queue: _queue,
                escapeHTML: _$escapeHTML,
                noop: function () {},
                
                requestPage: function ( id, parent, parentId, fromIndex, newest ) {
                    var data = {
                        uid: _requestUID++,
                        from: id,
                        references: parent,
                        id: parentId,
                        index: fromIndex,
                        newest: newest
                    };
                    
                    _requests.push ( data );
                    
                    socket.emit ( 'request', 'page', data );
                },
                
                requestUpdate: function ( id, parent, parentId, since, fromIndex, newest ) {
                    var data = {
                        uid: _requestUID++,
                        from: id,
                        references: parent,
                        id: parentId,
                        timestamp: since,
                        index: fromIndex,
                        newest: newest
                    };
                    
                    _requests.push ( data );
                    
                    socket.emit ( 'request', 'update', data );
                },
                
                joinChat: function ( room, title, owner ) {
                    
                    socket.emit ( 'join', room, function response ( id ) {
                        var node,
                            fragment,
                            jq,
                            chat = _rooms [ id ];
                        
                        if ( !chat ) {
                            fragment = _$ui.id.templateChatMin [ 0 ].content.cloneNode ( true );
                            node = fragment.childNodes [ 0 ];
                            jq = $ ( node );
                            jq.find ( '.room' ).text ( id );
                            jq.attr ( 'data-room', id );
                            chat = _rooms [ id ] = { messages: [], $: jq };
                        } else {
                            chat.messages.length = [];
                            jq = chat.$;
                            jq.attr ( 'data-room', id );
                            node = jq [ 0 ];
                        }
                        
                        if ( arguments.length > 1 ) {
                            chat.title = title;
                        } else {
                            delete chat.title;
                        }
                        
                        if ( arguments.length > 2 ) {
                            chat.owner = owner;
                        } else {
                            delete chat.owner;
                        }
                        
                        _$ui.id.userChatBar.append ( jq );
                        _$ui.id.userMessage.html ( '<span class="message">You are in room "' + id + '", happy chatting!</span>' );
                    } );
                    
                },
                
                leaveChat: function ( room ) {
                    socket.emit ( 'leave', room, function response ( id ) {
                        
                        delete _rooms [ id ];
                        _$ui.userChatBar.remove ( '[data-room="'+ id +'"]' );
                        _$ui.userMessage.html ( '<span class="message">You are no longer in room "' + id + '".</span>' );
                        
                    } );
                },
                
                sendChat: function ( id, message ) {
                    
                    socket.emit ( 'chat', id, message, function ( id ) {
                        _data.chatMessage ( id, 'You: ' + message );
                        _$ui.id.userChatInput.val ( '' );
                    } );
                },
                
                chatMessage: function ( id, message ) {
                    var chat = this.rooms [ id ],
                        $id;
                    
                    if ( chat ) {
                        
                        $id = this.$ui.id;
                        
                        function logMessage ( message ) {
                            
                            if ( typeof message === 'string' ) {
                                if ( !$id.userChat.hasClass ( 'hidden' ) && $id.userChatRoom.text () === id ) {
                                    if ( typeof message === 'string' ) {
                                        // strip out scripts ( not secure, but a start )
                                        $id.userChatContent.append ( $ ( '<div class="message">' ).append ( $.parseHTML ( message ) ) );
                                    } else {
                                        $id.userChatContent.append ( $ ( '<div class="message">' ).text ( message.error + '\n\n' + message.originalMessage ) );
                                    }
                                } else {
                                    $id.userChatBar.find ( '[data-room="'+ id +'"]' ).addClass ( 'notify' );
                                }
                            }
                        }
                        
                        new Promise ( function ( resolve, reject ) {
                            try {
                                resolve ( md.render ( message ) );
                            } catch ( e ) {
                                reject ( e )
                            }
                        } ). then ( function ( html ) {
                            chat.messages.push ( html );
                            logMessage ( html );
                        } ).catch ( function ( err ) {
                            console.log ( err );
                            var message = {
                                error: id + ': ( failed to render content, original message below - see console )',
                                originalMessage: message
                            };
                            chat.messages.push ( message );
                            logMessage ( message );
                        } );
                    }
                },
                
                submitPost: function ( id, parent, parentId ) {
                    alert ( 'apologies, this feature is not yet implemented' );
                }
            },
            __trigger, __name;
        
        console.log ( 'binding socket events...' );
        // set up socket io events
        $.each ( ioHandles, function ( event, handle ) {
            var type = typeof handle;
            if ( Array.isArray ( handle ) ) {
                if ( handle.length === 0 ) {
                    console.error ( 'io event binding: cannot bind with empty array to socket event ' + event );
                } else {
                    var callback = handle [ handle.length - 1 ];
                    if ( typeof callback === 'function' ) {
                        handle [ handle.length - 1 ] = callback.bind ( _data );
                    }
                    
                    handle.unshift ( event );
                    socket.on.apply ( socket, handle );
                }
            } else if ( type === 'function' ) {
                socket.on ( event, handle.bind ( _data ) );
            } else {
                console.error ( 'io event binding: cannot bind argument of type "' + type + '" to socket event "' + event + '"' );
            }
        } );
        
        console.log ( 'binding jquery id events...' );
        // set up jquery id events
        $ ( '[id]' ).each ( function ( index, element ) {
            
            var jq, handles;
            
            __name = ( this.id ).replace ( /-(.)/g, function ( match, sub ) {
                return sub.toUpperCase ();
            } );
            
            //debug
            if ( __name in _$ui ) {
                console.error ( '$ui assignment: element id "' + __name + '" already exists' );
            } else {
                jq = _$ui.id [ __name ] = $ ( element );
            }
            
            handles = uiHandlesById [ __name ];
            
            if ( handles ) {
                applyHandles ( jq, handles );
                
                // debug
                // if ( __name === 'userChatBar' ) {
                //     console.log ( 'connecting chatbar callbacks...' );
                //     __trigger = 'click';
                //     console.log ( handles.click.reduce ( reduceArgs, [] ) )
                //     applyHandles ( jq, handles );
                //     console.log ( 'connected successfully...')
                // } else {
                //     applyHandles ( jq, handles );
                // }
            }
        } );
        
        console.log ( 'binding jquery class events...' );
        // set up jquery id events
        $.each ( uiHandlesByClass, function ( classname, handles ) {
            var jq;
            
            __name = ( classname ).replace ( /([A-Z])/g, function ( match, sub ) {
                return '-' + sub.toLowerCase ();
            } );
            
            jq = _$ui.class [ classname ] = $ ( __name );
            
            applyHandles ( jq, handles );
        } );
        
        if ( typeof then !== 'function' ) {
            console.error ( 'application: cannot invoke callback of type "' + ( typeof then ) + '"' );
        } else {
            then ( _data );
        }
        
        function applyHandles ( jq, handles ) {
            for ( __trigger in handles ) {
                
                var args = handles [ __trigger ], type = typeof args;
                
                if ( Array.isArray ( args ) ) {                         // either delegates are selected for a handle or there are multiple handles under this trigger
                            
                    var stack = args.reduce ( reduceArgs, [] );
                    
                    for ( var i in stack ) {
                        jq.on.apply ( jq, stack [ i ] );
                    }
                    
                } else if ( type === 'function' ) {              // no delegates
                    jq.on ( __trigger, _data, args );
                } else {                                        // user error
                    console.error ( '$ui event binding: cannot bind handler of type "' + type + '" to object "' + __name + '"' );
                }
            }
        }
        
        function reduceArgs ( stack, item ) {
            var type = typeof item;
            if ( type === 'string' || type === 'function') {
                if ( stack.length > 0 ) {
                    var prev = stack [ stack.length - 1 ];
                    if ( typeof prev === 'string' ) {       // assume multiple selectors, concat them
                        if ( type === 'string ' ) {
                            stack [ stack.length - 1 ] = prev + ' ' + item;
                        } else {
                            stack [ stack.length - 1 ] = [ __trigger, prev, _data, item ];
                        }
                    } else {
                        if ( type === 'string' ) {
                            stack [ stack.length ] = item;
                        } else {
                            stack [ stack.length ] = [ __trigger, _data, item ];
                        }
                    }
                } else {
                    if ( type === 'string' ) {
                        stack [ stack.length ] = item;
                    } else {
                        stack [ stack.length ] = [ __trigger, _data, item ];
                    }
                }
            } else {
                console.error ( '$ui event binding: unrecognized binding type "' + type + '" on "' + __trigger + '" of "' + __name + '"' );
            }
            
            return stack;
        }
    }
);
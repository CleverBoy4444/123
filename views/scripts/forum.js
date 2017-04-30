/* global io, $, Remarkable, hljs */
( function ( socket, md, Application ) {
	
// Application {
	
	function showAllArticles ( app, article ) {
		
		var $id = app.$ui.id,
			rank = JSON.parse ( $id.articleView.find ( '.article' ).attr ( 'data-rank' ) ),
			fromCategory = article === undefined,
			location = !fromCategory ? { to: 'topic' } : { to: 'category' },
			collection = fromCategory ? app.articles.category : article.topics,
			sort = $id.order.find ( '[selected]' ).val (),
			listen = `category${fromCategory ? '' : '_' + article.id}`,
			fromSource,
			from;
		
		if ( $id.userTitle.val() || $id.userBody.val () ) {
			if ( $id.userPost.hasClass ( 'hidden' ) ) {
				$id.preview.trigger ( 'click' );
				$id.userBody.focus ();
			}
			
			var discard = confirm ( 'You have unsaved changes in your current submission.\n\nDo you want to discard your changes?' );
			
			if ( discard ) {
				$id.userTitle.val ( '' );
				$id.userBody.val ( '' );
				$id.previewContent.empty ();
			} else {
				$id.userBody.focus ();
				return;
			}
		}
		
		sort = `sort${sort[0].toUpperCase () + sort.slice ( 1 )}`;
		
		$id.return.addClass ( 'hidden' );
		$id.return.find ( '.the-article' ).addClass ( 'hidden' );
		$id.articleStubs.addClass ( 'hidden' );
		$id.articleView.addClass ( 'hidden' );
		$id.forumMore.addClass ( 'hidden' );
		
		if ( fromCategory ) {
			fromSource = 'category';
			from = {
				from: fromSource,
				rank: { type: fromSource }
			};
		} else {
			fromSource = 'topic';
			from = {
				from: fromSource,
				rank: { type: fromSource }
			};
			location.references = from.references = { category: article.id };
			from.rank.category = rank.category;
			$id.return.find ( '.all-articles' )
				.text ( 'Return to All Categories' )
				.attr ( 'data-rank', JSON.stringify ( { type: 'category' } ) );
			$id.return.find ( '.the-article' )
				.text ( 'Return to Category' )
				.attr ( 'data-rank', JSON.stringify ( { type: 'category', category: rank.category } ) )
				.removeClass ( 'hidden' );
			$id.return.removeClass ( 'hidden' );
		}
		
		from.index = collection.length;
		
		$id.forumInput.addClass ( 'hidden' );
		$id.userPreview.addClass ( 'hidden' );
		$id.userPost.addClass ( 'hidden' );
		$id.inputHeading.text ( `New ${fromCategory ? 'Category' : 'Topic'}` );
		if ( fromCategory ) {
			$id.inputTitle.addClass ( 'hidden' );
		} else {
			$id.inputTitle.html ( $ ( article.title ).html () ).removeClass ( 'hidden' );
			$id.titleSection.removeClass ( 'hidden' );
		}
		$id.forumInput.attr ( 'data-location', JSON.stringify ( location ) );
		$id.userPost.removeClass ( 'hidden' );
		$id.forumInput.removeClass ( 'hidden' );
		$id.userTitle.focus ();
		
		$id.articleStubs.empty ();
		app.appendArticles ( $id.articleStubs, $id.templateStub, collection, true, sort );
		$id.articleStubs.removeClass ( 'hidden' );
		
		$id.forumMore.find ( '.count' ).text ( `Showing ${collection.length} of ${collection.total} ${fromCategory ? 'categories' : 'topics'}` );
		$id.forumMore.attr ( 'data-from', JSON.stringify ( from ) );
		
		if ( collection.length < collection.total ) {
			$id.forumMore.find ( '.more' ).removeClass ( 'hidden' );
		} else {
			$id.forumMore.find ( '.more' ).addClass ( 'hidden' );
		}
		
		$id.forumMore.removeClass ( 'hidden' );
		
		app.listenChannel ( listen );
	}
	
	function showArticle ( app, rank ) {
		var $id = app.$ui.id,
			categories = app.articles.category,
			category = categories [ rank.category ],
			article = 'topic' in rank ? category.topics [ rank.topic ] : category,
			location = { to: 'post', references: { category: article.id } },
			comments, topics,
			collection, listen,
			isTopic = 'topic' in rank,
			sort = $id.order.find ( '[selected]' ).val ();
			// ,
			// ref = 'topic' in rank ? { category: category.id, topic: category.topics [ rank.topic ].id } : 'category' in rank ? { category: category.id } : null;
		
		sort = `sort${sort[0].toUpperCase () + sort.slice ( 1 )}`;
					
		if ( 'topic' in rank ) {
			article = app.articles.category [ rank.category ].topics [ rank.topic ];
			location = { to: 'post', references : { category: category.id, topic: article.id } };
			comments = { from: 'post', references: { category: category.id, topic: article.id }, rank: { type: 'post', category: rank.category, topic: rank.topic } };
			listen = `category_${category.id}-topic_${article.id}`;
		} else {
			article = app.articles.category [ rank.category ];
			location = { to: 'post', references: { category: article.id } };
			topics = { from: 'topic', references: { category: article.id }, rank: { type: 'topic', category: rank.category } };
			comments = { from: 'post', references: { category: article.id, topic: null }, rank: { type: 'post', category: rank.category } };
			listen = `category_${article.id}`;
		}
		
		if ( $id.userTitle.val() || $id.userBody.val () ) {
			if ( $id.userPost.hasClass ( 'hidden' ) ) {
				$id.preview.trigger ( 'click' );
			}
			
			$id.userBody.focus ();
			
			var discard = confirm ( 'You have unsaved changes in your current submission.\n\nDo you want to discard your changes?' );
			
			if ( discard ) {
				$id.userTitle.val ( '' );
				$id.userBody.val ( '' );
				$id.previewContent.empty ();
			} else {
				$id.userBody.focus ();
				return;
			}
		}
		
		$id.return.addClass ( 'hidden' );
		$id.articleStubs.addClass ( 'hidden' );
		$id.articleView.addClass ( 'hidden' );
		$id.forumMore.addClass ( 'hidden' );
		
		if ( topics ) {
			$id.return.find ( '.all-articles' )
				.text ( 'Return to All Categories' )
				.attr ( 'data-rank', JSON.stringify ( { type: 'category' } ) );
			$id.return.find ( '.the-article' )
				.addClass ( 'hidden' );
		} else {
			$id.return.find ( '.all-articles' )
				.text ( 'Return to Topics' )
				.attr ( 'data-rank', JSON.stringify ( { type: 'topic', category: rank.category } ) );
			$id.return.find ( '.the-article' )
				.text ( 'Return to Category' )
				.attr ( 'data-rank', JSON.stringify ( { type: 'category', category: rank.category } ) )
				.removeClass ( 'hidden' );
		}
		
		$id.return.removeClass ( 'hidden' );
		
		$id.forumInput.addClass ( 'hidden' );
		$id.userPreview.addClass ( 'hidden' );
		$id.userPost.addClass ( 'hidden' );
		$id.inputHeading.text ( `Reply to ${isTopic ? 'Topic' : 'Category'}` );
		$id.inputTitle.html ( $ ( article.title ).html () ).removeClass ( 'hidden' );
		$id.titleSection.addClass ( 'hidden' );
		$id.forumInput.attr ( 'data-location', JSON.stringify ( location ) );
		$id.userPost.removeClass ( 'hidden' );
		//$id.userTitle.focus ();
		$id.forumInput.removeClass ( 'hidden' );
		
		collection = article.posts;
		
		$id.articleView.empty ();
		app.appendArticles ( $id.articleView, $id.templateArticle, [ article ], false, sort );
		app.listenChannel ( listen );
		
		$id.articleView.find ( '.show-comments' ).addClass ( 'hidden' );
		$id.articleView.find ( '.show-topics' ).addClass ( 'hidden' );
		
		function renderComments () {
			$id.articleView.find ( '.show-comments' )
				.text ( `Show Comments ( ${collection.total} )` )
				.removeClass ( 'hidden' );
			
			comments.index = collection.length;
			$id.forumMore.find ( '.count' ).text ( `Showing ${collection.length} of ${collection.total} Comments` );
			$id.forumMore.attr ( 'data-from', JSON.stringify ( comments ) );
			
			if ( collection.length < collection.total ) {
				$id.forumMore.find ( '.more' ).removeClass ( 'hidden' );
			} else {
				$id.forumMore.find ( '.more' ).addClass ( 'hidden' );
			}
		}
		
		if ( !( 'total' in collection ) ) {
			//console.log ( JSON.stringify ( fromPost ) );
			//console.log ( JSON.stringify ( collection ) );
			app.requestPage ( comments, renderComments, true );
		} else {
			app.appendArticles ( $id.articleView.find ( '.replies' ), $id.templateReply, collection, false, sort );
			renderComments ();
		}
		
		if ( topics ) {
			if ( ! ( 'total' in article.topics ) ) {
				app.requestPage ( topics, function () {
					$id.articleView.find ( '.show-topics' )
						.text ( `Show Topics ( ${article.topics.total} )` )
						.removeClass ( 'hidden' );
				}, false );
			} else {
				$id.articleView.find ( '.show-topics' )
					.text ( `Show Topics ( ${article.topics.total} )` )
					.removeClass ( 'hidden' );
			}
		} else {
			$id.articleView.find ( '.show-topics' ).addClass ( 'hidden' );
		}
		
		$id.articleView.removeClass ( 'hidden' );
	}
	
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
				
				this.errorMessage ( message ); },
			
			chatin: function ( id, name, message ) {
				this.chatMessage ( id, name, message ); },
			
			joined: function ( id, name ) {
				this.chatMessage ( id, id,  '"' + name + '" joined the room' ); },
			
			left: function ( id, name ) {
				this.chatMessage ( id, id, '"' + name + '" left the room' ); },
			
			submission: function ( res ) {
				// logic fetch ? then
				// socket.emit ( 'request', 'submission', res.id, function ( article ) {
					
				// } );
			},
			
			article: function ( article ) {
				alert ( 'debugging article communications' ); }
		},
		
		// ui handles by id
		{
			"return": {
				click: [ '.the-article', function ( event ) {
					let app = event.data,
						rank = JSON.parse ( $ ( this ).attr ( 'data-rank' ) );
					
					showArticle ( app, rank );
				}, '.all-articles', function ( event ) {
					let app = event.data,
						rank = JSON.parse ( $ ( this ).attr ( 'data-rank' ) ),
						article;
						
						if ( 'category' in rank ) {
							article = app.articles.category [ rank.category ];
						}
						
					showAllArticles ( app, article );
				} ]	
			},
			forumContent: {
				click: [ '.stub .title', function ( event ) {
					
					/*
					let $stub = $ ( this ).parent (),
						app = event.data,
						$id = app.$ui.id,
						$container = $id.articleView,
						id = Number ( $stub.attr ( 'data-id' ) ),
						dataRef = $stub.attr ( 'data-ref' ),
						ref = dataRef ? JSON.parse ( dataRef ) : null,
						rank = JSON.parse ( $stub.attr ( 'data-rank' ) ),
						sort = $id.order.find ( '[selected]' ).val (),
						article,
						location,
						topics,
						comments,
						listen;
					
					sort = `sort${sort[0].toUpperCase () + sort.slice ( 1 )}`;
					
					if ( !ref ) {
						article = app.articles.category [ rank.category ];
						location = { to: 'post', references: { category: id } };
						topics = { from: 'topic', references: { category: id }, rank: { type: 'topic', category: rank.category } };
						comments = { from: 'post', references: { category: id, topic: null }, rank: { type: 'post', category: rank.category } };
						listen = `category_${id}`;
					} else if ( 'category' in ref ) {
						article = app.articles.category [ rank.category ].topics [ rank.topic ];
						location = { to: 'post', references : { category: ref.category, topic: id } };
						comments = { from: 'post', references: { category: ref.category, topic: id }, rank: { type: 'post', category: rank.category, topic: rank.topic } };
						listen = `category_${ref.category}-topic_${article.id}`;
					}
					
					$id.forumMore.addClass ( 'hidden' );
					$id.articleStubs.addClass ( 'hidden' );
					$id.return.addClass ( 'hidden' );
					$container.removeClass ( 'hidden' );
					$container.empty ();
					
					app.appendArticles ( $container, $id.templateArticle, [ article ], false );
					
					$id.titleSection.addClass ( 'hidden' );
					
					if ( 'topic' in location.references ) {
						$container.find ( '.return' ).text ( 'Return to Topics' );
						$container.find ( '.show-topics' ).addClass ( 'hidden' );
					} else {
						$container.find ( '.return' ).text ( 'Return to all Categories' );
						$container.find ( '.show-topics' ).removeClass ( 'hidden' );
					}
					
					$id.forumInput.attr ( 'data-location', JSON.stringify ( location ) );
					$id.inputHeading.text ( 'topic' in location.references ? 'Reply to Topic' : 'Reply to Category' );
					$id.inputTitle.html ( $ ( article.title ).html () ).removeClass ( 'hidden' );
					
					// clean up un-submitted content when navigating
					$id.userTitle.val ( '' );
					$id.userBody.val ( '' );
					$id.userTitle.focus ();
					
					app.listenChannel ( listen );
					
					if ( comments ) {
						if ( !( 'total' in article.posts ) ) {
							$id.articleView.find ( '.replies' ).empty ();
							app.requestPage ( comments );
						} else {
							let $replies = $id.articleView.find ( '.replies' ),
								collection = article.posts,
								$more = $replies.parent ().find ( '.more-group' );
							
							$more.attr ( 'data-from', JSON.stringify ( $.extend ( {}, comments, { index: collection.length } ) ) );
							$replies.addClass ( 'hidden' ).empty ();
							app.appendArticles ( $replies, $id.templateReply, article.posts, false, app [ sort ] );
							$id.articleView.find ( '.show-comments' ).text ( `Show Comments ( ${article.posts.total} )` );
							if ( collection.length < collection.total ) {
								$more.find ( '.count' ).text ( `Showing ${collection.length} of ${collection.total} comments` );
								if ( $id.articleView.find ( '.replies' ).hasClass ( 'hidden' ) ) {
									$more.addClass ( 'hidden' );
								} else {
									$more.removeClass ( 'hidden' );
								}
							} else {
								$more.addClass ( 'hidden' );
							}
						}
					}
					
					if ( topics ) {
						if ( !( 'total' in article.topics ) ) {
							$id.articleStubs.empty ();
							app.requestPage ( topics );
						} else {
							$id.articleStubs.empty ();
							app.appendArticles ( $id.articleStubs, $id.templateStub, article.topics, true, app [ sort ] );
							$id.articleView.find ( '.show-topics' )
								.text ( `Go to Topics ( ${article.topics.total} )` )
								.removeClass ( 'hidden' );
						}
					} else {
						$id.articleView.find ( '.show-topics' ).addClass ( 'hidden' );
					}
					*/
					
					let app = event.data,
						$stub = $ ( this ).parent (),
						rank = JSON.parse ( $stub.attr ( 'data-rank' ) );
					
					showArticle ( app, rank );
					
				}, '.show-comments', function ( event ) {
					let app = event.data,
						$id = app.$ui.id,
						$showComments = $ ( this ),
						$replies = $id.articleView.find ( '.replies' ),
						$article = $id.articleView.find ( '.article' ),
						rank = JSON.parse ( $article.attr ( 'data-rank' ) ),
						article = 'topic' in rank ? app.articles.category [ rank.category ].topics [ rank.topic ] : app.articles.category [ rank.category ],
						collection = article.posts,
						$more = $id.forumMore;
					
					if ( $replies.hasClass ( 'hidden' ) ) {
						$showComments.text ( 'Hide Comments' );
						$replies.removeClass ( 'hidden' );
						
						$more.addClass ( 'hidden' );
						
						$more.find ( '.count' ).text ( `Showing ${collection.length} of ${collection.total} Comments` );
						if ( collection.length < collection.total ) {
							$more.find ( '.more' ).removeClass ( 'hidden' );
						} else {
							$more.find ( '.more' ).addClass ( 'hidden' );
						}
						
						$more.removeClass ( 'hidden' );
					} else {
						$showComments.text ( `Show Comments ( ${article.posts.total} )` );
						$more.addClass ( 'hidden' );
						$replies.addClass ( 'hidden' );
					}
				}, '.show-topics', function ( event ) {
					let app = event.data,
						$id = app.$ui.id,
						$article = $id.articleView.find ( '.article' ),
						rank = JSON.parse ( $article.attr ( 'data-rank' ) ),
						article = app.articles.category [ rank.category ];
					
					showAllArticles ( app, article );
					
					/*
					let app = event.data,
						$id = app.$ui.id,
						$article = $id.articleView.find ( '.article' ),
						rank = JSON.parse ( $article.attr ( 'data-rank' ) ),
						article = app.articles.category [ rank.category ],
						ref = { category: article.id },
						location = { to: 'topic', references: ref },
						collection = article.topics,
						$more = $id.forumMore,
						listen = `category_${article.id}`;
					
					$more.attr ( 'data-from', JSON.stringify ( { from: 'topic', references: ref, index: collection.length, rank: rank } ) );
					$id.forumInput.attr ( 'data-location', JSON.stringify ( location ) );
					$id.inputHeading.text ( 'New Topic in Category' );
					$id.inputTitle.html ( $ ( article.title ).html () ).removeClass ( 'hidden' );
					$id.titleSection.removeClass ( 'hidden' );
					$id.userTitle.focus ();
					
					app.listenChannel ( listen );
					
					$id.articleView.addClass ( 'hidden' );
					$id.articleStubs.removeClass ( 'hidden' );
					$id.return.removeClass ( 'hidden' );
					
					// clean up un-submitted content when navigating
					$id.userTitle.val ( '' );
					$id.userBody.val ( '' );
					$id.userTitle.focus ();
					
					if ( collection.length < collection.total ) {
						$more.find ( '.count' ).text ( `Showing ${collection.length} of ${collection.total} topics` );
						$more.removeClass ( 'hidden' );
					} else {
						$more.addClass ( 'hidden' );
					}
					
					*/
					
				},
				
				/*
				'.all-categories', function allCategories ( event ) {
					var app = event.data,
						$id = app.$ui.id,
						$more = $id.forumMore,
						location = { to: 'category' },
						sort = $id.order.find ( '[selected]' ).val (),
						collection = app.articles.category;
					
					
				},'.all', function ( event ) {
					// return to all categories ( if this is the all categories link )
					
					var app = event.data,
					    $id = app.$ui.id,
					    $this = $ ( this ),
					    newLocation, from,
					    collection = app.articles.category,
					    $more = $id.forumMore,
					    sort = $id.order.find ( '[selected]' ).val (),
					    rank,
					    references;
					
					sort = `sort${sort[0].toUpperCase () + sort.slice ( 1 )}`;
					
					// in any case
					$id.articleView.addClass ( 'hidden' );
					$id.return.addClass ( 'hidden' );
					$id.userTitle.val ( '' );
					$id.userBody.val ( '' );
					
					// all categories from anywhere or all categories from category
					if ( ! $this.hasClass ( 'return' ) || ! ( ( 'references' in location ) && ( 'topic' in location.references ) ) ) {
						$id.inputHeading.text ( 'New Category' );
						$id.inputTitle.addClass ( 'hidden' );
						app.listenChannel ( 'category' );
						
						collection = app.articles.category;
						from = 'category';
						rank = { type: from };
						newLocation = '{"to":"category"}';
					
					// all topics from topic
					} else {
						let arank = JSON.parse ( $id.articleView.find ( '.article' ).attr ( 'data-rank' ) ),
							article = app.articles.category [ arank.category ],
							title = $ ( article.title ).html ();
						
						$id.inputHeading.text ( 'New Topic' );
						$id.inputTitle.html ( title );
						$id.inputTitle.removeClass ( 'hidden' );
						app.listenChannel ( 'category_'+article.id );
						
						collection = article.topics;
						from = 'topic';
						rank = { type: 'category', category: arank.category };
						references = { category: article.id };
						newLocation = `{"to":"topic","category":${article.id}}`;
						
						$id.return.removeClass ( 'hidden' );
					}
					
					// clean up un-submitted content when navigating
					$id.userTitle.val ( '' );
					$id.userBody.val ( '' );
					$id.userTitle.focus ();
					$id.titleSection.removeClass ( 'hidden' );
					
					// append categories to article stubs
					$id.articleStubs.empty ();
					app.appendArticles ( $id.articleStubs, $id.templateStub, collection, true, app [ sort ] );
					$id.articleStubs.removeClass ( 'hidden' );
					$id.forumInput.attr ( 'data-location', newLocation );
					
					let moreFrom = { from: from, index: collection.length, rank: rank };
					if ( references ) {
						moreFrom.references = references;
					}
					$more.attr ( 'data-from', JSON.stringify ( moreFrom ) );
					if ( collection.length < collection.total ) {
						$more.find ( '.count' ).text ( `Showing ${collection.length} of ${collection.total} ${from}` );
						$more.removeClass ( 'hidden' );
					} else {
						$more.addClass ( 'hidden' );
					}
					
				}, '.the-category', function ( event ) {
					// return from topic stubs to the topic article
					let app = event.data,
						$id = app.$ui.id,
						rank = JSON.parse ( $id.articleView.find ( '.article' ).attr ( 'data-rank' ) ),
						article = app.articles.category [ rank.category ],
						collection = article.posts,
						title = $ ( article.title ).html (),
						newLocation = `{"to":"category","category":${article.id}}`,
						sort = $id.order.find ( '[selected]' ).val ();
					
					sort = `sort${sort[0].toUpperCase () + sort.slice ( 1 )}`;
					
					$id.titleSection.addClass ( 'hidden' );
					$id.inputHeading.text ( 'Reply to Category' );
					$id.inputTitle.html ( title );
					$id.inputTitle.removeClass ( 'hidden' );
					$id.return.addClass ( 'hidden' );
					$id.articleStubs.addClass ( 'hidden' );
					
					$id.forumInput.attr ( 'data-location', newLocation );
					app.listenChannel ( 'category_'+article.id );
					
					$id.userTitle.val ( '' );
					$id.userBody.val ( '' );
					$id.userBody.focus ();
					
					$id.articleView.empty ();
					app.appendArticles ( $id.articleView, $id.templateArticle, [article], false );
					
					let $replies = $id.articleView.find ( '.replies' ),
						$more = $id.articleView.find ( '.more-group' );
					$replies.addClass ( 'hidden' ).empty ();
					app.appendArticles ( $replies, $id.templateReply, article.posts, false, app [ sort ] );
					$id.articleView.find ( '.show-comments' ).text ( `Show Comments ( ${article.posts.total} )` );
					
					$id.articleView.find ( '.show-topics' )
						.text ( `Go to Topics ( ${article.topics.total} )` )
						.removeClass ( 'hidden' );
					
					$id.articleView.removeClass ( 'hidden' );
					
					if ( collection.length < collection.total ) {
						$more.find ( '.count' ).text ( `Showing ${collection.length} of ${collection.total} comments` );
						if ( $id.articleView.find ( '.replies' ).hasClass ( 'hidden' ) ) {
							$more.addClass ( 'hidden' );
						} else {
							$more.removeClass ( 'hidden' );
						}
					} else {
						$more.addClass ( 'hidden' );
					}
				}, */
				
				'.more', function ( event ) {
					let app = event.data,
						$id = app.$ui.id,
						$more = $id.forumMore,
						from = JSON.parse ( $more.attr ( 'data-from' ) ),
						rank = from.rank,
						collection = app.articles.category,
						ofType;
					
					if ( 'category' in rank ) {
						collection = collection [ rank.category ];
					}
					
					if ( 'topic' in rank ) {
						collection = collection.topics [ rank.topic ];
					}
					
					if ( 'category' === rank.type ) {
						ofType = 'Categories';
					}
					
					if ( 'topic' === rank.type ) {
						collection = collection.topics;
						ofType = 'Topics';
					}
					
					if ( 'post' === rank.type ) {
						collection = collection.posts;
						ofType = 'Comments';
					}
					
					app.requestPage (from, function () {
						$more.addClass ( 'hidden' );
						
						$more.find ( '.count' ).text ( `Showing ${collection.length} of ${collection.total} ${ofType}` );
						from.index = collection.length;
						$more.attr ( 'data-from', JSON.stringify ( from ) );
						
						if ( collection.length < collection.total ) {
							$more.find ( '.more' ).removeClass ( 'hidden' );
						} else {
							$more.find ( '.more' ).addClass ( 'hidden' );
						}
						
						$more.removeClass ( 'hidden' );
						
					}, true );
				} ]
			},
			
			menu: {
				click: function () { return false; } },
			
			menuContent: {
				click: [ '.menu-item', function ( event ) {
					$ ( this ).find ( '.check' ).toggleClass ( 'checked' );
				} ] },
			
			order: {
				change: function ( event ) {
					let $this = $ ( this ),
						value = $this.val ();
					
					$this.find ( 'option' ).removeAttr ( 'selected' );
					$this.find ( `[value=${value}]` ).attr ( 'selected', 'selected' );
				}
			},
			
			page: {
				click: function ( event ) {
					var $ui = event.data.$ui;
					
					$ui.id.menuContent.addClass ( 'hidden' );
					$ui.id.userChat.addClass ( 'hidden' );
					$ui.id.userChatNew.addClass ( 'hidden' );
				} },
			
			preview: {
				click: function ( event ) {
					var app = event.data, $id = app.$ui.id;
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
								resolve ( app.sanitize ( md.render ( title + $id.userBody.val () ) ) );  //
							} catch ( err ) {                                                                   //
								// reject content ---------------------------------------                       //
								reject ( err );                                         //                      //
							}                                                           //                      //
						} ).then ( function ( html ) {  // success  <-------------------//----------------------//
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
			
			submit: {
				click: function ( event ) {
					var app = event.data,
						$id = app.$ui.id,
						$forumInput = $id.forumInput,
						params = JSON.parse ( $forumInput.attr ( 'data-location' ) ),
						title = $id.userTitle.val (),
						body = $id.userBody.val ();
					
					if ( !title ) {
						if ( params.to !== 'post' ) {
							app.errorMessage ( 'Submission must have a title.' );
							$id.userTitle.focus ();
							return;
						}
					}
					
					if ( !body ) {
						app.errorMessage ( 'Submission must have a body.' );
						$id.userBody.focus ();
						return;
					}
					
					title && ( params.title = title );
					params.body = body;
					params.order = $id.order.find ( '[selected]' ).val ();
					
					app.submitArticle ( params, function ( collection ) {
						let $more = $id.forumMore,
							from = JSON.parse ( $more.attr ( 'data-from' ) ),
							type = from.rank.type,
							ofType = 'category' === type ? 'Categories' : 'topic' === type ? 'Topics' : 'Comments';
						
						$more.addClass ( 'hidden' );
						
						$more.find ( '.count' ).text ( `Showing ${collection.length} of ${collection.total} ${ofType}` );
						from.index = collection.length;
						$more.attr ( 'data-from', JSON.stringify ( from ) );
						
						if ( collection.length < collection.total ) {
							$more.find ( '.more' ).removeClass ( 'hidden' );
						} else {
							$more.find ( '.more' ).addClass ( 'hidden' );
						}
						
						$more.removeClass ( 'hidden' );
					} );
				}
			},
			
			toggleMenu: {
				click: function ( event ) {
					event.data.$ui.id.menuContent.toggleClass ( 'hidden' );
				} },
			
			userChat: {
				click: [
					function ( event ) {
						// page clicks hide user chat, which is not what we want
						// here so we stop propagation of this click event
						return false; },
					'.minimize', function ( event ) {
						event.data.$ui.id.userChat.addClass ( 'hidden' );
					} ] },
			
			userChatBar: {
				click: [
					'.room', function ( event ) {
						var $id = event.data.$ui.id,
							$userChat = $id.userChat,
							$userChatRoom = $id.userChatRoom,
							$userChatTitle = $id.userChatTitle,
							$userChatOwner = $id.userChatOwner,
							$userChatContent = $id.userChatContent,
							$room = $ ( this ),
							$chatMin = $room.parent (),
							id = $room.text (),
							chat = event.data.rooms [ id ],
							messages = chat.messages;
						
						$userChatRoom.text ( id );
						$userChatTitle.text ( chat.title || '' );
						$userChatOwner.text ( chat.owner || '' );
						
						$userChatContent.empty ();
						for ( var i in messages ) {
							$id.userChatContent.append ( $.parseHTML ( messages [ i ] ) );
						}
						//$userChatContent.html ( chat.messages.join ( '' ) );
						
						$userChat.attr ( 'data-room', $chatMin.attr ( 'data-room' ) );
						$userChat.removeAttr ( 'style' );
						$userChat.removeClass ( 'hidden' );
						$userChat.css ( { width: $userChat.width (), height: $userChat.height () } );
						
						$chatMin.removeClass ( 'notify' );
						
						event.data.$ui.id.menuContent.addClass ( 'hidden' );
						
						// page clicks hide user chat, which is not what we want
						// here so we stop propagation of this click event
						return false; },
					'.close', function ( event ) {
						//var room = $ ( this ).parent ().attr ( 'data-room' );
						//alert ( typeof room + ': ' + room );
						event.data.leaveChat ( $ ( this ).parent ().attr ( 'data-room' ) );
						event.data.$ui.id.userChat.addClass ( 'hidden' );
						event.data.$ui.id.menuContent.addClass ( 'hidden' );
						return false;
					} ] },
					
			userChatSubmit: {
				click: function ( event ) {
					var app = event.data,
						$id = app.$ui.id;
					
					app.sendChat ( $id.userChat.attr ( 'data-room' ), $id.userChatInput.val () );
				}
			},
			
			userChatInput: {
				keydown: function ( event ) {
					var app = event.data,
						$id = app.$ui.id;
					
					if ( event.which === 13 && ( event.ctrlKey || event.metaKey ) ) {
						event.preventDefault ();
						$id.userChatSubmit.trigger ( 'click' );
						return false;
					}
				}
			}
		},
		
		// ui handles by class name
		{
			menuItem: {
				click: [ '.check', () => {
					$ ( this ).toggleClass ( 'checked' );
				} ] }
		},
		
		// after everything is hooked up
		function ( app ) {
			
			let $id = app.$ui.id;
			
			$ ( window ).on ( 'beforeunload', () => {
				for ( let id in app.rooms ) {
					socket.emit ( 'leave', id, app.noop );
				}
			} );
			
			$id.userChatBar.sortable ( {
				scroll: false,
				tolerance: 'pointer',
				cursorAt: { bottom: 0, left: 0 },
				helper: 'clone',
				appendTo: 'body',
				//forcePlaceholderSize: true,
				//forceHelperSize: true
			} );
			
			$id.userChat.draggable ( {
				scroll: false,
				cancel: '.client'  // all drag events that originate on input portions of the control are cancelled
			} );
			
			app.joinChat ( 'Forum' );
			
			$id.forumInput.attr ( 'data-location', JSON.stringify ( { to: 'category' } ) );
			let from = { from: 'category', rank: { type: 'category' } };
			app.requestPage ( { from: 'category', rank: { type: 'category' } }, function () {
				var collection = app.articles.category;
				
				$id.forumMore.find ( '.count' ).text ( `Showing ${collection.length} of ${collection.total} Categories` );
				from.index = collection.length;
				$id.forumMore.attr ( 'data-from', JSON.stringify ( from ) );
				if ( collection.length < collection.total ) {
					$id.forumMore.find ( '.more' ).removeClass ( 'hidden' );
				} else {
					$id.forumMore.find ( '.more' ).addClass ( 'hidden' );
				}
				$id.forumMore.removeClass ( 'hidden' );
				
				app.listenChannel ( 'category' );
			}, true );
			
			$id.userTitle.focus ();
		}
	);
	
// }
	
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
					for ( let i = 0, l = line.length; i < l; i = i + 1 ) {
						line [ i ] = '' +
							'<li data-line="' + padNum ( '' + ( i + 1 ), pad ) + '">' +
								hljs.highlight ( lang, line [ i ], true ).value +
							'</li>';
					}
					return '<ol>' + line.join ( '' ) + '</ol>';
				} catch ( err ) {
					console.error ( err );
					return err.toString ();
				}
			} else {
				try {
					for ( let i = 0, l = line.length; i < l; i = i + 1 ) {
						line [ i ] = '' +
							'<li data-line="' + padNum ( '' + ( i + 1 ), pad ) + '">' +
								hljs.highlightAuto ( line [ i ] ).value +
							'</li>';
					}
					return '<ol>' + line.join ( '' ) + '</ol>';
				} catch (err) {
					console.error ( err );
					return err.toString ();
				}
			}
		}
	} ),
	function Application ( socket, md, ioHandles, uiHandlesById, uiHandlesByClass, then ) {
		var _$ui = { id: {}, "class": {} },
			_rooms = {},
			_views = {},
			_articles = {
				category: [],
				chat: []
			},
			_responses = [],
			_queue = [],
			_$escapeHTML = ( function ( $ ) {
				return function ( text ) {
					return $.text ( text ).text();
				};
			} ) ( $ ( '<div>' ) ),
			_app = {
				articles: _articles,
				requestLimit: 10,
				$ui: _$ui,
				rooms: _rooms,
				views: _views,
				responses: _responses,
				queue: _queue,
				escapeHTML: _$escapeHTML,
				listening: null,
				
				errorMessage: function ( message ) {
					_$ui.id.userMessage.html ( '<span class="error-message">' + ( message || 'Something went wrong, but I don\'t know what.  Sorry about that. See console and contact system administrator.' ) + '</span>' );
				},
				
				message: function ( message ) {
					_$ui.id.userMessage.html ( '<span class="message">' + message + '</span>' );
				},
				
				objToDataValue: function ( obj, def ) {
					let key, list = [], data;
					
					for ( key in obj ) {
						list.push ( key + '_' + obj [ key ] );
					}
					
					data = list.join ( '-' );
					
					if ( !data.length ) {
						return def;
					}
					
					return data;
				},
				
				formatDate: function ( date ) {
					let hours = date.getHours (),
						weekday = [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' ] [ date.getDay () ],
						month = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ] [ date.getMonth () ],
						day = date.getDate (),
						year = date.getFullYear (),
						hour = ( hours % 12 ) || 12,
						minutes = date.getMinutes (),
						meridian = hours > 11 ? 'pm' : 'am';
					
					minutes = ( '' + minutes ).length < 2 ? '0' + minutes : minutes;
					
					return `${weekday}, ${month} ${day}, ${year} at ${hour}:${minutes}${meridian}`;
				},
				
				shortDate: function ( date ) {
					let hours = date.getHours (),
						day = date.getDate (),
						month = date.getMonth () + 1,
						year = date.getFullYear (),
						hour = ( hours % 12 ) || 12,
						minutes = date.getMinutes (),
						meridian = hours > 11 ? 'pm' : 'am';
					
					minutes = ( '' + minutes ).length < 2 ? '0' + minutes : minutes;
					month = ( '' + month ).length < 2 ? '0' + month : month;
					day = ( '' + day ).length < 2 ? '0' + day : day;
					
					return `${year}/${month}/${day} ${hour}:${minutes}${meridian}`;
				},
				
				noop: () => {},
				
				sortNewest: ( a, b ) => ( a = 'created' in a ? a.created : a.getAttribute ( 'data-created' ) ) >
										( b = 'created' in b ? b.created : b.getAttribute ( 'data-created' ) ) ? -1 : a < b ? 1 : 0,
				
				sortOldest: ( a, b ) => ( a = 'created' in a ? a.created : a.getAttribute ( 'data-created' ) ) <
										( b = 'created' in b ? b.created : b.getAttribute ( 'data-created' ) ) ? -1 : a > b ? 1 : 0,
				
				sortRecent: ( a, b ) => ( a = 'created' in a ? a.edited || a.created : a.getAttribute ( 'data-edited' ) || a.getAttribute ( 'data-created' ) ) >
										( b = 'created' in b ? b.edited || b.created : b.getAttribute ( 'data-edited' ) || b.getAttribute ( 'data-created' ) ) ? -1 : a < b ? 1 : 0,
				
				// prevent undesirable content
				sanitize: function ( html ) {
					var src = $ ( '<div>' ).append ( html );
					
					src.find ( 'audio,embed,iframe,media,object,script,video' ).remove ();
					
					src.find ( '*' ).each ( function () {
						var attr, attrs = this.attributes, name, value;
						for ( var i = 0, l = attrs.length; i < l; i = i + 1 ) {
							attr = attrs [ i ];
							name = attr.name;
							value = attr.value;
							if ( name.match ( /^on.*/i ) || ( name.match ( /href/i ) && value.match ( /^\s*javascript.*/i ) ) ) {
								this.removeAttribute ( name );
							}
						}
					} );
					
					return src.html ();
				},
				
				renderHTML: function ( content, error, then ) {
					new Promise ( ( resolve, reject ) => {
						if ( typeof content === 'function' ) {
							content = content ();
						} else {
							if ( typeof content !== 'string' ) {
								_app.errorMessage ( 'wrong type of content provided, contact system adminstrator' );
								console.error ( new TypeError ( 'cannot fetch content on type "' + typeof content + '"' ) );
								return;
							}
						}
						
						try {
							resolve ( _app.sanitize ( md.render ( content ) ) );
						} catch ( e ) {
							reject ( e );
						}
						
					} ).then ( html => {
						if ( typeof then === 'function' ) {
							then ( html );
						} else {
							_app.errorMessage ( 'no where to send content, "then" executor was not provided, contact system adminstrator' );
							console.error ( new TypeError ( 'executor unavailable' ) );
						}
					} ).catch ( err => {
						if ( typeof error === 'function' ) {
							error ( err );
						} else {
							_app.errorMessage ( 'could not render html ( see console )' );
							console.log ( err );
						}
					} );
				},
				
				cacheArticles: function ( collection, extend, articles, rank ) {
					var article, i, l, key, from = collection.length;
					
					for ( i = 0, l = articles.length; i < l; i = i + 1 ) {
						article = articles [ i ];
						if ( extend ) {
							$.extend ( true, article, extend );
						}
						
						let references = ( 'references' in article ? article.references : article );
						
						if ( 'title' in article ) {
							article.title = _app.sanitize ( md.render ( '#### ' + article.title ) );
						}
						
						if ( 'posts' in article ) {
							article.body = _app.sanitize ( md.render ( article.body ) );
						} else {
							article.body = _app.sanitize ( md.render ( article.body.replace ( '\n', '\\n' ) + `  —  <span class="owner link">${article.username}</span><span class="created">${_app.shortDate ( new Date ( article.created ) )}</span>` ) );
						}
						
						article.rank = $.extend ( true, {}, rank );
						article.rank [ rank.type ] = from + i;
					}
					
					Array.prototype.push.apply ( collection, articles );
				},
				
				appendArticles: function ( $container, $template, collection, stub, sort ) {
					let $id = _app.$ui.id,
						article,
						$tempView,
						$aboutTemplate = $id.templateAbout,
						id,
						received,
						total;
					
					if ( collection.length > 0 ) {
						let isHidden = $container.hasClass ( 'hidden' );
						$container.addClass ( 'hidden' );
						
						received = $container.attr ( 'data-received' );
						total = $container.attr ( 'data-total' );
						id = $container.attr ( 'id' );
						
						if ( !id ) {
							
						}
						
						for ( let i = 0, l = collection.length; i < l; i = i + 1 ) {
							article = collection [ i ];
							
							$tempView = $ ( $template.html () );
							$tempView.find ( '.about' ).append ( $aboutTemplate.html () );
							
							let $edited = $tempView.find ( '.edited' ),
								$created = $tempView.find ( '.created' ),
								$owner = $tempView.find ( '.owner' ),
								$title = $tempView.find ( '.title' ),
								$body = $tempView.find ( '.body' ),
								{ category, topic, chat } = article,
								title = stub ? $ ( article.title ).html() : article.title; // unwrap heading from stub titles
							
							$tempView.attr ( { 'data-id': article.id, 'data-created': article.created, 'data-rank': JSON.stringify ( article.rank ) } );
							
							// if any of title, body or about does not exist
							// the html insertion will do nothing
							$title.html ( title );
							$body.html ( article.body );
							$owner.text ( article.username );
							$created.text (  _app.formatDate( new Date ( article.created ) ) );
							
							//$tempAbout.attr ( 'data-owner-id', article.owner );
							if ( article.edited ) {
								$tempView.attr ( 'data-edited', article.edited );
								$edited.text ( _app.formatDate( new Date ( article.edited ) ) ).removeClass ( 'hidden' );
							} else {
								$edited.text ( '' ).addClass ( 'hidden' );
							}
							
							let ref = {}, references = ( 'references' in article ? article.references : article );
							for ( let name of [ 'category', 'topic', 'chat' ] ) {
								if ( name in references ) {
									ref [ name ] = references [ name ];
								}
							}
							
							if ( Object.keys ( ref ).length > 0 ) {
								$tempView.attr ( 'data-ref', JSON.stringify ( ref ) );
							}
							
							$container.append ( $tempView );
						}
						
						if ( typeof sort === 'function' ) {
							// sort the jquery order then rebuild the dom structure
							// based on the sorted order
							$container.children ().sort ( sort ).each ( function ( i, e ) {
								e.parentNode.appendChild ( e );
							} );
						}
						
						if ( !isHidden ) {
							$container.removeClass ( 'hidden' );
						}
					}
				},
				
				getPresentationLayer: function ( rank, room ) {
					let $id = _$ui.id,
						{ type, category, topic, chat } = rank,
						collection, extend, container, template;
					
					category = typeof category === 'undefined' ? undefined : _articles.category [ category ];
					topic = typeof category === 'undefined' ? undefined : typeof topic === 'undefined' ? undefined : category.topics [ topic ];
					
					if ( type === 'post' ) {
						if ( 'chat' in rank ) {
							collection = _articles.chat [ chat ];
							container = $id.userChat.hasClass ( '.hidden' ) ? null : $id.userChat.attr ( 'data-room' ) === room ? $id.userChatContent : null;
						} else {
							if ( 'topic' in rank ) {
								collection = topic ? topic.posts : null;
							} else {
								collection = category ? category.posts : null;
							}
							
							container = $id.articleView.find ( '.replies' );
						}
						
						template = $id.templateReply;
					} else {
						if ( type === 'category' ) {
							collection = _articles.category;
							extend = { topics: [], posts: [] };
						} else if ( type === 'topic' ) {
							collection = category ? category.topics : null;
							extend = { posts: [] };
						}
						container = $id.articleStubs;
						template = $id.templateStub;
					}
					
					return { collection, extend, container, template };
				},
				
				requestPage: function ( params, callback, append ) {
					
					var $id = _$ui.id;
					
					let {	from, rank, references, index = 0, limit = _app.requestLimit,
							order = 'oldest'
						} = params,
						data = { from, index, limit };
					
					'references' in params && ( data.references = references );
					
					socket.emit ( 'request', 'page', data, function ( err, res ) {
						if ( err ) {
							_app.errorMessage ( 'page request failed ( see console ), please contact system administrator' );
							console.log ( err );
						} else {
								// TODO: fixme!
							let room = 'chat_' + ( ( 'references' in data && 'chat' in data.references && data.references.chat ) || '' ),
								{ collection, extend, container, template } = _app.getPresentationLayer ( rank, room ),
								articles = res.articles,
								sortBy = order [ 0 ].toUpperCase () + order.slice ( 1 ),
								sort = _app [ 'sort' + sortBy ];
							
							// if the presentation is ahead of the cache, we defer
							// the cache until it is pulled from a request
							if ( collection ) {
								_app.cacheArticles ( collection, extend, articles, rank );
								
								collection.received = res.timestamp;
								collection.total = res.total;
							
								if ( container && append ) {
									//container.attr ( { 'data-received': res.timestamp, 'data-total': res.total } );
									_app.appendArticles ( container, template, articles, true, sort );
									if ( container === _app.$ui.id.articleStubs && articles.length === 0 ) {
										container.text ( `( No ${ from === 'category' ? 'categories' : 'topics' } yet )` );
									}
								} else {
									$id.userChat.find ( `[data-room=${room}]` ).addClass ( 'notify' );
								}
							}
							
							if ( 'function' === typeof callback ) {
								callback ();
							}
							
							/*
							
							if ( container.hasClass ( 'replies' ) ) {
								if ( container.hasClass ( 'hidden' ) ) {
									container.parent ().find ( '.show-comments' ).text ( `Show Comments ( ${res.total} )` );
								}
							}
							
							if ( from === 'topic' ) {
								$id.articleView.find ( '.show-topics' ).text ( `Go to Topics ( ${res.total} )` );
							}
							
							let $more, subject;
							if ( container === $id.articleStubs ) {
								$more = $id.forumMore;
								subject = collection === _articles.category ? 'categories' : 'topics';
							} else if ( container.hasClass ( 'replies' ) ) {
								$more = container.parent ().find ( '.more-group' );
								subject = 'comments';
							}
							
							if ( res.total > collection.length ) {
								$more.find ( '.count' ).text ( `Showing ${collection.length} of ${collection.total} ${subject}` );
								if ( ( subject === 'comments' ) ) {
									if ( $id.articleView.find ( '.replies' ).hasClass ( 'hidden' ) ) {
										$more.addClass ( 'hidden' );
									} else {
										$more.removeClass ( 'hidden' );
									}
								} else {
									$more.removeClass ( 'hidden' );
								}
							} else {
								$id.forumMore.addClass ( 'hidden' );
								if ( $more ) {
									$more.addClass ( 'hidden' );
								}
							}
							*/
						}
					} );
				},
				
				requestUpdate: function ( params ) {
					alert ( 'apologies, page update request is not yet implemented' );
				},
				
				submitArticle: function ( params, callback ) {
					let { order } = params;
					socket.emit ( 'request', 'submit', params, function ( err, res ) {
						if ( err ) {
							_app.errorMessage ( 'submission request failed ( see console ), please contact system administrator' );
							console.log ( err );
						} else {
							
							let $id = _app.$ui.id,
								room = _app.listening,
								{ collection, extend, container, template } = _app.getPresentationLayer ( res.rank, room ),
								articles = [ res ],
								sortBy = order [ 0 ].toUpperCase () + order.slice ( 1 ),
								sort = _app [ 'sort' + sortBy ];
							
							if ( collection && ( ! ( res.rank.type in res.rank ) || collection.length === collection.total ) ) {
								'title' in params && ( res.title = params.title );
								res.body = params.body;
								
								if ( container && collection.length === 0 ) {
									container.empty ();
								}
								
								_app.cacheArticles ( collection, extend, [ res ], res.rank );
								collection.received = res.created;
								let total = collection.total = collection.total + 1;
								
								if ( container ) {
									let stub = container === _app.$ui.id.articleStubs;
									_app.appendArticles ( container, template, articles, stub, sort );
									container.attr ( 'data-total', total );
									if ( container.hasClass ( 'replies' ) && container.hasClass ( 'hidden' ) ) {
										container.prev ().find ( '.show-comments' ).text ( `Show Comments ( ${total} )` );
									}
									
									if ( 'function' === typeof callback ) {
										callback ( collection );
									}
								} else {
									$id.userChat.find ( `[data-room=${room}]` ).addClass ( 'notify' );
								}
							} else {
								console.log ( 'update deferred' );
							}
							
							// clear the submission form and refocus on title input
							$id.userTitle.val ( '' );
							$id.userBody.val ( '' );
							$id.userTitle.focus ();
						}
					} );
				},
				
				listenChannel: function ( room ) {
					
					if ( _app.listening ) {
						socket.emit ( 'leave', _app.listening, _app.noop );
					}
					
					if ( room ) {
						socket.emit ( 'join', room, function ( id ) {
							_app.listening = id;
						} );
					}
				},
				
				joinChat: function ( room, title, owner ) {
					
					var argLength = arguments.length;
					
					socket.emit ( 'join', room, function response ( id ) {
						var jq,
							chat = _rooms [ id ],
							tip = ( owner ? owner + ': ' : '' ) + ( title ? title : '' );
						
						if ( !chat ) {
							jq = $ ( _$ui.id.templateChatMin.html () );
							if ( tip ) {
								jq.find ( '.room' ).text ( id ).attr ( 'data-title', tip );
							} else {
								jq.find ( '.room' ).text ( id );
							}
							jq.attr ( 'data-room', id );
							jq.find ( '.close' ).attr ( 'data-title', 'leave chat "' + id + '"' );
							chat = _rooms [ id ] = { messages: [], $: jq };
						} else {
							chat.messages.length = [];
							jq = chat.$;
							jq.attr ( 'data-room', id );
						}
						
						if ( argLength > 1 ) {
							chat.title = title;
						} else {
							delete chat.title;
						}
						
						if ( argLength > 2 ) {
							chat.owner = owner;
						} else {
							delete chat.owner;
						}
						
						_$ui.id.userChatBar.append ( jq );
						_$ui.id.userChatBar.sortable ( 'refresh' );
						_$ui.id.userMessage.html ( '<span class="message">You are in room "' + id + '", happy chatting!</span>' );
					} );
				},
				
				leaveChat: function ( room ) {
					socket.emit ( 'leave', room, function response ( id ) {
						
						delete _rooms [ id ];
						_$ui.id.userChatBar.find ( '[data-room="'+ id +'"]' ).remove ();
						_$ui.id.userMessage.html ( '<span class="message">You are no longer in room "' + id + '".</span>' );
						
					} );
				},
				
				sendChat: function ( id, message ) {
					
					socket.emit ( 'chat', id, message, function ( id ) {
						_app.chatMessage ( id, 'You', message );
						_$ui.id.userChatInput.val ( '' );
						_$ui.id.userChatInput.focus ();
					} );
				},
				
				// TODO: wash me
				chatMessage: function ( id, name, message ) {
					var chat = _rooms [ id ],
						$id = _$ui.id;
					
					function wrapMessage ( err, message ) {
						if ( err ) {
							message = $ ( '<div>' )
								.append ( $ ( '<div class="error">' )
									.append ( $ ( '<p>' )
										.append ( document.createTextNode ( err ) )
										.append ( '<br><br>' )
										.append ( document.createTextNode ( message ) )
									)
								).html ();
						} else {
							message = $ ( '<div>' )
								.append ( $ ( '<div class="message">' )
									.append ( message )
								).html ();
						}
						return message;
					}
					
					function logMessage ( message ) {
							
						if ( typeof message === 'string' ) {
							if ( !$id.userChat.hasClass ( 'hidden' ) && $id.userChatRoom.text () === id ) {
								$id.userChatContent.append ( message );
							} else {
								$id.userChatBar.find ( '[data-room="'+ id +'"]' ).addClass ( 'notify' );
							}
						}
					}
					
					if ( chat ) {
						
						new Promise ( function ( resolve, reject ) {
							try {
								resolve ( _app.sanitize ( md.render ( name + ': ' + message ) ) );
							} catch ( e ) {
								reject ( e );
							}
						} ). then ( function ( html ) {
							var message = wrapMessage ( null, html );
							chat.messages.push ( message );
							logMessage ( message );
						} ).catch ( function ( err ) {
							console.error ( `message from "${ name }" failed\n`, err, '\noriginal message: ' + message );
							message = wrapMessage ( id + ': ( failed to render content, original message below - see console )', message );
							chat.messages.push ( message );
							logMessage ( message );
						} );
					}
				},
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
						handle [ handle.length - 1 ] = callback.bind ( _app );
					}
					
					// push the event onto the left side of the argument bindings
					handle.unshift ( event );
					socket.on.apply ( socket, handle );
				}
			} else if ( type === 'function' ) {
				socket.on ( event, handle.bind ( _app ) );
			} else {
				console.error ( 'io event binding: cannot bind argument of type "' + type + '" to socket event "' + event + '"' );
			}
		} );
		
		console.log ( 'binding jquery id events...' );
		// set up jquery id events
		$ ( '[id]' ).each ( function ( i, element ) {
			
			let jq, handles;
			
			__name = ( this.id ).replace ( /-(.)/g, ( m, sub ) => sub.toUpperCase () );
			
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
			
			__name = ( classname ).replace ( /([A-Z])/g, ( m, sub ) => '-' + sub.toLowerCase () );
			
			jq = _$ui.class [ classname ] = $ ( __name );
			
			applyHandles ( jq, handles );
		} );
		
		if ( typeof then !== 'function' ) {
			console.error ( 'application: cannot invoke callback of type "' + ( typeof then ) + '"' );
		} else {
			then ( _app );
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
					jq.on ( __trigger, _app, args );
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
							stack [ stack.length - 1 ] = [ __trigger, prev, _app, item ];
						}
					} else {
						if ( type === 'string' ) {
							stack [ stack.length ] = item;
						} else {
							stack [ stack.length ] = [ __trigger, _app, item ];
						}
					}
				} else {
					if ( type === 'string' ) {
						stack [ stack.length ] = item;
					} else {
						stack [ stack.length ] = [ __trigger, _app, item ];
					}
				}
			} else {
				console.error ( '$ui event binding: unrecognized binding type "' + type + '" on "' + __trigger + '" of "' + __name + '"' );
			}
			
			return stack;
		}
	}
);
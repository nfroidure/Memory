// Modules
var http=require('http'),
	fs=require('fs'),
	url = require('url'),
	ws = require('websocket').server,
	crypto = require('crypto');

// Constants
const MIME_TYPES={
	'html':'text/html',
	'js':'text/javascript',
	'manifest':'text/cache-manifest',
	'css': 'text/css',
	'png': 'image/png',
	'jpg': 'image/jpeg',
	'ico': 'image/ico',
	'mp3': 'audio/mp3',
	'ogg': 'audio/ogg',
	'mid': 'audio/x-midi',
	'json': 'application/json',
	'csv': 'text/csv',
	'webapp':'application/x-web-app-manifest+json'
	};

// Global vars
var rootDirectory=__dirname+'/www', // default directory
	domain='memory.insertafter.com',
	port=8124;


// Real-time game vars
// player objects
var players=[];
var playersIds=0;
// connexions
var connections={};
// rooms vars
var rooms=[{'id':1,'name':'Hello world !','players':[],'mode':'normal'},
	{'id':2,'name':'Lie to me !','players':[],'mode':'normal'}];
var roomsConnects=[];
roomsConnects[1]=[];
roomsConnects[2]=[];
var roomsIds=2;

// HTTP Server

// looking for the RootDirectory on CLI args
if(process.argv[2])
	rootDirectory=process.argv[2];
if(!fs.statSync(rootDirectory).isDirectory())
	throw Error('Cannot stat the given rootDirectory ('+rootDirectory+').');

var httpServer=http.createServer(function (request, response) {
	// Parsing URI
	var parsedUrl=url.parse(request.url);
	// reserving /ws for the WebSocket server
	if(parsedUrl.pathname==='/ws')
		return;
	// Dynamic contents
	var result;
	// Getting room details
	if(result=/^\/rooms\/([0-9]+)\.json$/.exec(parsedUrl.pathname)) {
		if(!rooms.some(function(room) {
			if(room.id==result[1]) {
				// Sending the room
				response.writeHead(200);
				response.end(JSON.stringify(room));
			}
			return false;
		})) {
			response.writeHead(410);
			response.end();
		}
	return;
	// Listing Rooms
	} else if(parsedUrl.pathname==='/rooms.csv') {
		if(('HEAD'===request.method||'GET'===request.method)) {
			response.writeHead(200);
			// Sending the list
			response.end(rooms.map(function(room) {
				return room.id+','+room.name+','+room.mode
					+','+room.players.length+','+(room.game?1:0);
				}).join('\r\n'));
			return;
		} else if('POST'===request.method) {
			var body = '';
			request.on('data', function (data) {
				body += data;
			});
			request.on('end', function () {
				var data;
				try {
					data=JSON.parse(body);
					if(!data.name&&!data.mode) {
						response.writeHead(400);
					} else {
						response.writeHead(201);
						rooms.push({
							'id':++roomsIds,
							'name':data.name,
							'players':[],
							'mode':data.mode
						});
					}
					response.end();
				} catch(e) {
					response.writeHead(400);
				}
				response.end();
			});
			return;
		}
	// liste des univers
	} else if(parsedUrl.pathname==='/universes.json'&&
		(request.method=='HEAD'||request.method=='GET')) {
		// Reading contents of the unverse folder
		fs.readdir(rootDirectory+'/universes',function(error,files) {
			var index=-1;
			if(error) {
				response.writeHead(500);
				response.end();
				throw Error('Cannot read universes.');
			}
			response.writeHead(200,{'Content-Type':MIME_TYPES['json']});
			// removing file extensions
			files.map(function(file,i) {
				files[i]=file.replace(/.json$/,'');
			});
			response.end(JSON.stringify(files));
		});
		return;
	// generating the manifest
	} else if(parsedUrl.pathname==='/application.manifest'&&
		(request.method=='HEAD'||request.method=='GET')) {
		// parralelizing folder stat
		var folders=['javascript','images','sounds','css'];
		var listings=[];
		var foldersLeft=folders.length;
		folders.forEach(function(name) {
			fs.readdir(rootDirectory+'/'+name,function(error,file) {
				// en cas d'error, on stoppe tout
				if(error) {
					response.writeHead(500);
					response.end();
					throw Error('Unable to read the folder "'+name+'".');
				}
				listings[name]=file;
				// when all folders are stated
				if(0==--foldersLeft) {
					response.writeHead(200,{'Content-Type':MIME_TYPES['manifest']});
					// generating the manifest
					response.write('CACHE MANIFEST\n# v 1.0:'+process.pid+'\n\nCACHE:\n/index.html\n');
					folders.forEach(function(name) {
						for(var i=listings[name].length-1; i>=0; i--) {
							if(-1!==listings[name][i].indexOf('.')&&'list.json'!==listings[name][i])
								response.write('/'+name+'/'+listings[name][i]+'\n');
							}
						});
					// ending the manifest
					response.end('\nFALLBACK:\n/universes.json /universes.json\n\nNETWORK:\n*\n');
					}
				});
			});
		return;
		}

	// Static contents : read-only access
	if('HEAD'!==request.method&&'GET'!==request.method) {
		response.writeHead(401);
		response.end();
		return;
	}
	// No query params
	if('search' in parsedUrl) {
		response.writeHead(401);
		response.end();
	}
	// redirecting the rootDirectory to index.html
	if('/'===parsedUrl.pathname||!parsedUrl.pathname) {
		response.writeHead(301,{'Location':'/index.html'});
		response.end();
		return;
	}
	// Checking the file corresponding to the path
	fs.stat(rootDirectory+parsedUrl.pathname,
		function(error,result) {
			var headers={}, code=0, start=0, end;
			// Sending 404 errors
			if(error||!result.isFile()) {
				response.writeHead(404);
				response.end();
				return;
			}
			// Reading file ext
			var ext=parsedUrl.pathname
				.replace(/^(?:.*)\.([a-z0-9]+)$/,'$1');
			if(!MIME_TYPES[ext]) {
				response.writeHead(500);
				response.end();
				throw Error('Unsupported MIME type ('+ext+')');
			}
			headers['Content-Type']=MIME_TYPES[ext];
			headers['Content-Length']=result.size;
			// Looking for ranged requests
			if(request.headers.range) {
				var chunks = request.headers.range.replace(/bytes=/, "").split("-");
				start = parseInt(chunks[0],10);
				end =  chunks[1] ? parseInt(chunks[1], 10) :
					headers['Content-Length']-1; 
				headers['Content-Range'] = 'bytes ' + start + '-' + end + '/'
					+ (headers['Content-Length']);
				headers['Accept-Ranges'] = 'bytes';
				headers['Content-Length']= (end-start)+1;
				headers['Transfer-Encoding'] = 'chunked';
				headers['Connection'] = 'close';
				code=206;
			} else {
				code=200;
			}
			// sending code and headers
			response.writeHead(code, headers);
			if('GET'===request.method) {
				fs.createReadStream(rootDirectory
				+parsedUrl.pathname,{start: start, end: end})
				.pipe(response);
			} else {
				response.end();
			}
		}
	); 
}).listen(port);

console.log('Server started on http://'+domain+':'+port+'/, '
	+'serving directory :'+rootDirectory);



// WebSocket Server
var wsServer = new ws({
		httpServer: httpServer,
		autoAcceptConnections: false
	});

// listening to new roomsConnects
wsServer.on('request', function(request) {
	// reject bad origin requests
	if(-1===request.origin.indexOf('http://127.0.0.1:'+port)
		&&-1===request.origin.indexOf('http://'+domain+':'+port)
		&&-1===request.origin.indexOf('http://'+domain+':80')
		&&-1===request.origin.indexOf('http://'+domain)) {
		console.log(new Date()+': Connection origin rejected ('+request.origin+').');
		request.reject();
		return;
	}
	// retrieve connection object
	var connection = request.accept(null, request.origin),
	// creating vars related to the player
		player={}, sessid='';
	console.log((new Date()) + ': New connection.');
	// Listening to messages
	connection.on('message', function(message) {
		var msgContent;
		if ('utf8' === message.type) {
			// parsing JSON
			try {
				msgContent=JSON.parse(message.utf8Data);
			} catch(e) {
				console.log(new Date()+': Bad JSON received ' + message.utf8Data);
				return;
			}
			// checking for a message type
			if(!msgContent.type){
				console.log(new Date()+': Bad type' + message.utf8Data);
				return;
			}
			// action witch
			switch(msgContent.type) {
				// connection
				case 'connect':
					// must at least give its name and 2 images
					if(!(msgContent.name&&msgContent.image1&&msgContent.image2))
						return;
					// looking for existing user
					if(msgContent.sessid&&connections[msgContent.sessid]) {
						sessid=msgContent.sessid;
						player=connections[sessid].player;
						// closing old connection if exists
						if(connections[sessid].connection)
							connections[sessid].connection.close();
						connections[sessid].connection=connection;
						// stopping the timer
						if(connections[sessid].timeout) {
							clearTimeout(connections[sessid].timeout);
							connections[sessid].timeout=0;
						}
					}
					// creating otherwise
					else {
						var hash=crypto.createHash('sha1');
						hash.update(message.utf8Data+Date.now(),'utf8');
						sessid=hash.digest('hex');
						connections[sessid]=
							{'connection':connection,'player':player,'sessid':sessid};
						player.id=++playersIds;
					}
					connection.sessid=sessid;
					// storing player infos
					player.name=(''+msgContent.name).replace('&','&amp;')
						.replace('<','&lt').replace('>','&gt')
						.replace('"','&quot;').trim();
					player.gender=0;
					player.image1=msgContent.image1;
					player.image2=msgContent.image2;
					if(msgContent.gender&&msgContent.gender==1)
						player.gender=1;
					else if(msgContent.gender&&msgContent.gender==-1)
						player.gender=-1;
					console.log((new Date()) + ' ['+connection.remoteAddress+'-'
						+(player?player.name+'('+player.id+')':'')+']: '
						+'connection ('+sessid+').');
					// sending connection sessid + player id
					connection.sendUTF(JSON.stringify({'type':'connect',
						'sessid':sessid,'id':player.id}));
					break;
				// room join
				case 'room':
					// room connection
					if(!(msgContent.room&&rooms.some(function(room) {
						// ignore if full
						if(room.id!=msgContent.room||room.players.length>6)
							return false
						// ignore if game started
						if(room.game)
							return false
						// user already in the room
						if(-1!==roomsConnects[room.id].indexOf(sessid)) {
							console.log((new Date()) + ' ['+connection.remoteAddress+'-'
								+(player?player.name+'('+player.id+')':'')+']: '
								+'User already in the room.');
							return true;
						}
						// confirm user he enters the room
						connection.sendUTF(JSON.stringify({'type':'room',
							'room':room}));
						room.players.push(player);
						// notify room players they must update
						roomsConnects[room.id].forEach(function(destSessid) {
							connections[destSessid].connection.sendUTF(JSON.stringify(
								{'type':'join','player':player})
							);
						});
						roomsConnects[room.id].push(sessid);
						connections[sessid].room=room;
						return true;
						}))) {
						connection.sendUTF(JSON.stringify({'type':'room','room':null}));
						// removing the player
						leaveRoom(connections[sessid]);
					}
					console.log((new Date()) + ' ['+connection.remoteAddress+'-'
						+(player?player.name+'('+player.id+')':'')+']: '
						+'room: ' + message.utf8Data);
					break;
				// mini chat
				case 'chat':
					if(!(connections[sessid]&&connections[sessid].room&&msgContent.message))
						return;
					// fitering html
					msgContent.message=msgContent.message.replace('&','&amp;')
						.replace('<','&lt').replace('>','&gt').replace('"','&quot;');
					// sending to each players in the room
					roomsConnects[connections[sessid].room.id].forEach(function(destSessid) {
						connections[destSessid].connection.sendUTF(JSON.stringify({
							'type':'chat','player':player.name,
							'message':msgContent.message}));
					});
					console.log((new Date()) + ' ['+connection.remoteAddress+'-'
						+(player?player.name+'('+player.id+')':'')+']: '
						+'Chat ('+msgContent.message+').');
					break;
				// start the game
				case 'start':
					if(!(connections[sessid]&&connections[sessid].room))
						return;
					// checking if start is possible
					if(connections[sessid].room.players.length<3
						||connections[sessid].room.cards)
						return;
 					var cards=[];
					for(var i=2; i>=0; i--) {
						// creating cards of each players
						for(var j=1; j>=0; j--) {
							cards.push({'player':connections[sessid].room.players[i],
								'num':(j+1), 'status':0});
							cards.push({'player':connections[sessid].room.players[i],
								'num':(j+1), 'status':0});
						}
						// initializing the paler
						connections[sessid].room.players[i].score=0;
						connections[sessid].room.players[i].attempts=0;
						connections[sessid].room.players[i].cards1=null;
					}
					// distributing cards
					connections[sessid].room.cards=[];
					while(cards.length)
						connections[sessid].room.cards.push(cards.splice(
							Math.floor(Math.random()*cards.length),1)[0]);

					// sending the start signal to each player in the room
					roomsConnects[connections[sessid].room.id].forEach(function(destSessid) {
						connections[destSessid].connection.sendUTF(
							JSON.stringify({'type':'start'})
						);
					});
					console.log((new Date()) + ' ['+connection.remoteAddress+'-'
						+(player?player.name+'('+player.id+')':'')+']: '
						+'Start ('+connections[sessid].room.name+').');
					break;
				case 'reveal':
					// checking the card id
					if(!(msgContent.card&&connections[sessid].room
						&&connections[sessid].room.cards
						&&connections[sessid].room.cards[msgContent.card-1]))
						return;
					// if it's the second card and the pair is ok
					if(player.card1&&player.card1!=msgContent.card
						&&connections[sessid].room.cards[player.card1-1].num
						==connections[sessid].room.cards[msgContent.card-1].num
						&&connections[sessid].room.cards[player.card1-1].player
						==connections[sessid].room.cards[msgContent.card-1].player) {
						// if pair has not been found already
						if(!connections[sessid].room.cards[player.card1-1].found) {
							// sending the pair to each players
							roomsConnects[connections[sessid].room.id].forEach(function(destSessid) {
								connections[destSessid].connection.sendUTF(JSON.stringify({
									'type':'pair','winner':player.id,
									'player':connections[sessid].room.cards[msgContent.card-1].player.id,
									'card1':player.card1,
									'card2':msgContent.card,
									'num':connections[sessid].room.cards[msgContent.card-1].num}));
							});
							connections[sessid].room.cards[player.card1-1].found=true;
							connections[sessid].room.cards[msgContent.card-1].found=true;
							// incrementing score
							player.score+=1;
							player.card1=null;
							// check if there still are players
							var leftPlayer=null;
							if(!connections[sessid].room.cards.some(function(card) {
								if(card.found)
									return false;
								if(!leftPlayer) {
									leftPlayer=card.player.id;
									return false;
								}
								return card.player.id!=leftPlayer;
							})) {
								// sending score to players
								roomsConnects[connections[sessid].room.id].forEach(function(destSessid) {
									connections[destSessid].connection.sendUTF(JSON.stringify({
										'type':'victory','winner':leftPlayer,
										'scores':{}}));
								});
								// suppressing cards
								connections[sessid].room.cards=null;
							}
						}
					}
					// if the pair has not been found
					else if(!connections[sessid].room.cards[msgContent.card-1].found) {
						// if it's the first card'
						if(!player.card1) {
							player.card1=msgContent.card
						} else {
							player.attempts++;
							player.card1=null;
						}
						// sending the card infos
						connection.sendUTF(JSON.stringify({'type':'card','card':msgContent.card,
							'player':connections[sessid].room.cards[msgContent.card-1].player.id,
							'num':connections[sessid].room.cards[msgContent.card-1].num}));
					} else {
						player.attempts++;
						player.card1=null;
					}
					console.log((new Date()) + ' ['+connection.remoteAddress+'-'
						+(player?player.name+'('+player.id+')':'')+']: Reveal: ' + message.utf8Data);
					break;
				default:
					console.log((new Date()) + ' ['+connection.remoteAddress+'-'
						+(player?player.name+'('+player.id+')':'')+']: '
						+'Unexpected message: ' + message.utf8Data);
					break;
			}
		}
	});
	// listening for connections close
	connection.on('close', function(reasonCode, description) {
		// if the user was conected
		if(connections[sessid]) {
			// deleting the connection if no reco after 30s
			connections[sessid].timeout=setTimeout(function() {
				console.log((new Date()) + ' ['+connection.remoteAddress+'-'
					+(player?player.name+'('+player.id+')':'')+']: '
					+'Cleanup ('+sessid+').');
				// on supprime la connection
				delete connections[sessid];
			},1000);
			if(connections[sessid].room) {
				leaveRoom(connections[sessid]);
			}
		}
	  console.log((new Date()) + ' ['+connection.remoteAddress+'-'
			+(player?player.name+'('+player.id+')':'')+']: '
			+'Disconnected ('+reasonCode+':'+description+' - '+sessid+').');
	});
});

// Utility functions
// removing the player from his room
function leaveRoom(connection) {
	if(connection&&connection.room) {
		var index=connection.room.players.indexOf(connection.player);
		if(-1!==index) {
			connection.room.players.splice(index,1);
			roomsConnects[connection.room.id].splice(
				roomsConnects[connection.room.id].indexOf(connection.sessid),1);
			// notifying players
			roomsConnects[connection.room.id].forEach(function(destSessid) {
				connections[destSessid].connection.sendUTF(JSON.stringify(
					{'type':'leave','player':connection.player.id})
				);
			});
			connection.room=null;
		}
	}
}

console.log('WebSocket Server started.');

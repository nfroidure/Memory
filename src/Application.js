var Views = {
	Home: require('./ViewHome'),
	Profile: require('./ViewProfile'),
	Options: require('./ViewOptions'),
	Rooms: require('./ViewRooms'),
	Room: require('./ViewRoom'),
	Mono: require('./ViewMono'),
	Update: require('./ViewUpdate'),
	Connection: require('./ViewConnection'),
	NewRoom: require('./ViewNewRoom'),
	Multi: require('./ViewMulti')
};

var View = require('./View');
var Sounds = require('sounds');
var Commandor = require('commandor');

// Application constructor
function Application(rootElement) {
	// Looking for a new version
	if(window.applicationCache) {
		window.applicationCache.addEventListener('updateready', function() {
			// asking player to update if he's not playing
			if((!(root.ViewMono||root.ViewMulti))
				||this.view instanceof root.ViewMono
				||this.view instanceof root.ViewMulti)
				this.showView('Update');
		}.bind(this));
	}
	// saving the rootElement ref
	this.rootElement=rootElement;
	// instanciating the command manager
	this.cmdMgr=new Commandor(rootElement);
	// Adding the changeView command
	this.cmdMgr.suscribe('changeView',
		this.changeView.bind(this));
	// instanciating the sound manager and adding sounds
	this.sounds = new Sounds('sounds',
		// play background sound when loaded
		function() { this.sounds.play('mountainman'); }.bind(this));
	this.sounds.register('mountainman',['mid','mp3'],Infinity,0.2);
	this.sounds.register('card',['ogg']);
	this.sounds.register('card1',['ogg']);
	this.sounds.register('good',['ogg','mp3']);
	this.sounds.register('bad',['ogg']);
	this.sounds.register('applause',['ogg']);
	this.sounds.register('alert1',['ogg']);
	this.sounds.register('alert2',['ogg']);
	this.sounds.register('loose',['ogg']);
	this.sounds.register('win',['ogg']);
	// getting the sound prefs
	try {
		if(window.localStorage&&window.localStorage.muted)
			this.sounds.mute(!!window.localStorage.muted);
	} catch(e) {}
	// saving the message element ref
	this.message=document.querySelector('div.app div.message p');
	// websocket attemps
	this.wsAttempts=0;
	// showing the main view
	this.showView('Home');
}

// Messages management
Application.prototype.showMessage=function (text,duration,callback) {
	if(this.messageTimeout)
		clearTimeout(this.messageTimeout);
	this.messageTimeout=setTimeout(this.hideMessage.bind(this),duration||1500);
	this.messageCallback=callback;
	this.message.firstChild.textContent=text;
	this.message.parentNode.classList.add('show');
};

Application.prototype.hideMessage=function () {
	this.message.parentNode.classList.remove('show');
	this.messageTimeout=null;
	this.messageCallback&&this.messageCallback();
	this.messageCallback=null;
};

// Views management
Application.prototype.changeView=function (event,params) {
	this.showView(params.view);
};

Application.prototype.showView=function (name) {
  this.trackEvent('view', name);
	// uninitializing previous view
	if(this.displayedView) {
		this.displayedView.uninit();
	}
	// creating next view
	if(Views[name]) {
		this.displayedView = new Views[name]();
	} else {
		this.displayedView = new View();
	}
	this.displayedView.init(this, name);
};

// Websockets management
Application.prototype.connect=function () {
	// keeping a ref to the current message callback
	if(this.wsConnection&&this.wsConnection.onmessage)
		var msgCallback=this.wsConnection.onmessage;
	// 3 connexion attempts
	if(this.wsAttempts>2) {
		// canceling
		this.wsConnection.close();
		this.wsConnection=null;
		this.wsAttempts=0;
		// showing the network error view
		this.showView('Network');
	}
	// trying to reconnect
	this.wsAttempts++;
	this.wsConnection = new WebSocket('ws://'+document.location.hostname+':'+(document.location.port||80));
	// adding a tiemout
	this.timeout=setTimeout(function() {
		if(this.wsAttempts>0) {
			this.wsConnection.close();
			this.connect();
		}
	}.bind(this),5000);
	// sending profile on connect
	this.wsConnection.onopen = function () {
		if(msgCallback)
			this.wsConnection.onmessage=msgCallback;
		// cancelling timeout
		if(this.timeout)
			clearTimeout(this.timeout);
		// restting attempts counter
		this.wsAttempts=0;
		// sending user infos
		this.identification();
	}.bind(this);
	// debug log
	this.wsConnection.onerror = function (error) {
		console.log(error);
	}.bind(this);
	// when closed
	this.wsConnection.onclose = function () {
		// cancel timeout
		if(this.timeout)
			clearTimeout(this.timeout);
		// connect attempt
		setTimeout(this.connect.bind(this),2000);
	}.bind(this);
	// listening closes for debug
	this.wsConnection.addEventListener('message', function (event) {
		console.log(event.data);
	});
};

// send the user profil throught web sockets
Application.prototype.identification=function () {
	this.wsConnection.send(JSON.stringify({
		'type':'connect',
		'name':this.user.name,
		'gender':this.user.gender,
		'image1':this.user.image1,
		'image2':this.user.image2,
		'sessid':(this.user.sessid||'')
	}));
};

// disconnection
Application.prototype.disconnect=function () {
	this.wsConnection.onclose=null;
	this.wsConnection.close();
	this.wsConnection=null;
};

// GA Tracking
Application.prototype.trackEvent = function() {
  if('function' === typeof window.ga) {
    ga.apply(null, ['send', 'event'].concat([].slice.call(arguments, 0)));
  }
};

// launching the app
new Application(document.querySelector('div.app'));

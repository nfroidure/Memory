var View = require('./View');

// Show the room chat and allow to start
function ViewRoom()	{ }

// Inherit of View
ViewRoom.prototype=new View();

// Initialization
ViewRoom.prototype.init=function (app,name) {
	// Calling the parent method
	View.prototype.init.bind(this)(app,name);
	// Registering view commands
	this.command('quit');
	this.command('send');
	this.command('play');
	this.command('notification');
	// Selecting template elements
	this.h1=this.content.getElementsByTagName('h1')[0];
	this.h1.firstChild.textContent=this.app.room.name+' ';
	this.button=this.content.querySelector('a[disabled="disabled"]');
	this.updatePlayers();
	this.chat=this.content.querySelector('p.chat');
	this.field=this.content.querySelector('input[type="text"]');
	// Testing notifications availability
	this.buttonNotification=this.content.querySelector('p.menu a:nth-child(3)');
	if('webkitNotifications' in window
		&&window.webkitNotifications.checkPermission()===1) {
			this.buttonNotification.style.display='';
		} else {
			this.buttonNotification.style.display='none';
		}
	// Adding the websocket message callback
	this.app.wsConnection.onmessage=this.message.bind(this);
};

ViewRoom.prototype.quit=function (event, params) {
	this.app.wsConnection.send(JSON.stringify({'type':'room','room':null}));
	this.app.room=null;
};

ViewRoom.prototype.send=function (event, params) {
	this.app.wsConnection.send(JSON.stringify({'type':'chat','message':this.field.value}));
	this.field.value='';
};

ViewRoom.prototype.play=function (event) {
	this.app.wsConnection.send(JSON.stringify({'type':'start'}));
};

ViewRoom.prototype.message=function (event) {
	var msg=JSON.parse(event.data);
	if((!msg.type))
		throw Error('Unexpected server message.');
	if('start'==msg.type) {
		this.app.sounds.play('win');
		this.app.showView('Multi');
	} else if('room'==msg.type) {
		this.app.showView('Rooms');
	} else if('join'==msg.type) {
		this.app.room.players.push(msg.player);
		this.chatLine('',msg.player.name+' joined the room.');
		this.updatePlayers();
	} else if('leave'==msg.type) {
		this.app.room.players.some(function(player,i) {
			if(msg.player==player.id) {
				this.app.room.players.splice(i,1);
				this.chatLine('',player.name+' leaved the room.');
				return true;
			}
		}.bind(this));
		this.updatePlayers();
	} else if('chat'==msg.type) {
		this.chatLine(msg.player,msg.message);
	}
};

ViewRoom.prototype.updatePlayers=function () {
	this.h1.lastChild.firstChild.textContent=this.app.room.players.length+' /3';
	if(this.app.room.players.length==3) {
		this.button.removeAttribute('disabled');
		// trying to show a notification
		if('webkitNotifications' in window
			&&window.webkitNotifications.checkPermission()===0) {
			var notification = window.webkitNotifications.createNotification(
				this.app.user.image1, 'Ready to play',
				'The game can begin, 3 players connected!');
			notification.show();
		}
	} else {
		this.button.setAttribute('disabled','disabled');
	}
};

ViewRoom.prototype.chatLine=function (player,message) {
		if(this.chat.firstChild)
			this.chat.appendChild(document.createElement('br'));
		if(player) {
			this.chat.appendChild(document.createElement('strong'));
			this.chat.lastChild.appendChild(document.createTextNode(player+' : '));
			this.chat.appendChild(document.createTextNode(message));
		} else {
			this.chat.appendChild(document.createTextNode(message));
		}
	this.chat.scrollTop=this.chat.scrollHeight;
};

// permission request for notifications
ViewRoom.prototype.notification=function (event) {
	window.webkitNotifications.requestPermission();
	// hidding the button
	this.buttonNotification.style.display='none';
};

ViewRoom.prototype.empty=function (event) {
	while(this.chat.firstChild)
		this.chat.removeChild(this.chat.firstChild);
};

// Unitialization
ViewRoom.prototype.uninit=function (app) {
	this.empty();
	this.button.setAttribute('disabled','disabled');
	View.prototype.uninit.bind(this)();
};

module.exports = ViewRoom;

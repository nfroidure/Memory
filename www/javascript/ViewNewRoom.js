// AMD + global
(function(root,define){ define(['View'], function (View) {

	// Adding a new room
	function ViewNewRoom()	{ }

	// Inherit of View
	ViewNewRoom.prototype=new View();

	// Initialization
	ViewNewRoom.prototype.init=function (app,name) {
		// Calling the parent method
		View.prototype.init.bind(this)(app,name);
		// Registering view commands
		this.command('send');
		// Selecting temple elements
		this.field=this.content.querySelector('input[type="text"]');
		// Adding the websocket message callback
		this.app.wsConnection.onmessage=this.message.bind(this);
	};

	ViewNewRoom.prototype.envoi=function (event, params) {
		this.app.wsConnection.send(JSON.stringify({'type':'new','name':this.field.value}));
	};

	ViewNewRoom.prototype.message=function (event) {
		var msg=JSON.parse(event.data);
		if((!msg.type))
			throw Error('Unexpected server message.');
		if('new'==msg.type) {
			this.app.showView('Rooms');
		}
	};

	// Unitialization
	ViewNewRoom.prototype.uninit=function (app) {
		this.field.value='';
		View.prototype.uninit.bind(this)();
	};

	return ViewNewRoom;

});})(this,typeof define === 'function' && define.amd ? define : function (name, deps, factory) {
	if(typeof name === 'Object') {
		deps=name; factory=deps; name='ViewNewRoom';
	}
	this[name.substring(name.lastIndexOf('/')+1)]=factory.apply(this, deps.map(function(dep){
		return this[dep.substring(dep.lastIndexOf('/')+1)];
	}));
});

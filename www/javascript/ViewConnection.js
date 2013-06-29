// AMD + global
(function(root,define){ define(['View'], function (View) {

	// Showed when waiting for a connection
	function ViewConnection() { }

	// Inherit of View
	ViewConnection.prototype=new View();

	// Initialization
	ViewConnection.prototype.init=function (app,name) {
		// Calling the parent method
		View.prototype.init.bind(this)(app,name);
		// Registering view commands
		this.command('send');
	};

	// saving user infos
	ViewConnection.prototype.send=function (event, params) {
		this.app.user={'name':event.target[0].value};
		this.app.showView('Rooms');
	};

	return ViewConnection;

});})(this,typeof define === 'function' && define.amd ? define : function (name, deps, factory) {
	if(typeof name === 'Object') {
		deps=name; factory=deps; name='ViewConnection';
	}
	this[name.substring(name.lastIndexOf('/')+1)]=factory.apply(this, deps.map(function(dep){
		return this[dep.substring(dep.lastIndexOf('/')+1)];
	}));
});

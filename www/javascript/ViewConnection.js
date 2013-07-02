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
	var root=this;
	if(typeof name === 'object') {
		factory=deps; deps=name; name='ViewConnection';
	}
	this[name.substring(name.lastIndexOf('/')+1)]=factory.apply(this, deps.map(function(dep){
		return root[dep.substring(dep.lastIndexOf('/')+1)];
	}));
}.bind(this));

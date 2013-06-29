// AMD + global
(function(root,define){ define(['View'], function (View) {

	// Appcache update view
	function ViewUpdate() { }

	// Inherit of View
	ViewUpdate.prototype=new View();

	// Initialization
	ViewUpdate.prototype.init=function (app,name) {
		// Calling the parent method
		View.prototype.init.bind(this)(app,name);
		// Registering view commands
		this.command('update');
	};

	// Updating the application
	ViewUpdate.prototype.update=function () {
		document.location.reload();
	};

	return ViewUpdate;

});})(this,typeof define === 'function' && define.amd ? define : function (name, deps, factory) {
	if(typeof name === 'Object') {
		deps=name; factory=deps; name='ViewUpdate';
	}
	this[name.substring(name.lastIndexOf('/')+1)]=factory.apply(this, deps.map(function(dep){
		return this[dep.substring(dep.lastIndexOf('/')+1)];
	}));
});

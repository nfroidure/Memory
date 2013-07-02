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
	var root=this;
	if(typeof name === 'object') {
		factory=deps; deps=name; name='ViewUpdate';
	}
	this[name.substring(name.lastIndexOf('/')+1)]=factory.apply(this, deps.map(function(dep){
		return root[dep.substring(dep.lastIndexOf('/')+1)];
	}));
}.bind(this));

var View = require('./View');

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

module.exports = ViewUpdate;

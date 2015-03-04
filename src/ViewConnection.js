var View = require('./View');

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

module.exports = ViewConnection;

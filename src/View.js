// Generic view
function View() {}

// Initializing the view
View.prototype.init=function (app,name) {
	// keeping a reference to the application object
	this.app=app;
	// saving the view name
	this.name=name;
	// selectin the corresponding element
	this.content=document.getElementById(name);
	if(!this.content)
		throw Error('Cannot get the view "'+name+'".');
	// displaying the view
	this.content.classList.add('selected');
};

// Simplified command registering
View.prototype.command=function (name,method) {
	// if no method, trying to get it automagically
	method=method||name;
	if(!this[method])
		throw Error('Cannot find the method "'+method+'".');
	// suscribing to the command
	this.app.cmdMgr.suscribe(this.name+'/'+name,
		this[method].bind(this));
};

// Unitializing the view
View.prototype.uninit=function () {
	// Deleting comamnds
	this.app.cmdMgr.unsuscribe(this.name);
	// hiding the view
	this.content.classList.remove('selected');
};

module.exports = View;

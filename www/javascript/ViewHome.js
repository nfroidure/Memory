// AMD + global
(function(root,define){ define(['View'], function (View) {

	// Appcache update view
	function ViewHome() { }

	// Inherit of View
	ViewHome.prototype=new View();

	// Initialization
	ViewHome.prototype.init=function (app,name) {
		// Calling the parent method
		View.prototype.init.bind(this)(app,name);
		// Registering view commands
		this.command('install');
		// Checking websockets availability
		this.buttonMulti=this.content.querySelector('ul.menu li:nth-child(2) a');
		if('WebSocket' in window&&'function' === typeof window.WebSocket
			&&3 == window.WebSocket.CLOSED) {
			this.buttonMulti.setAttribute('href','app:changeView?view=Profile');
		} else {
			this.buttonMulti.setAttribute('href','app:changeView?view=Websocket');
		}
		// Checking installation on Firefox
		this.buttonInstallation=this.content.querySelector('ul.menu li:nth-child(4) a');
		this.buttonInstallation.style.display='none';
		if(undefined !== navigator.mozApps) {
			var request = navigator.mozApps.getSelf();
			request.onsuccess = function() {
				if (request.result) {
				} else {
					this.buttonInstallation.style.display='inline-block';
				}
			}.bind(this);
			request.onerror = function() {
			};
		}
	};

	// Installing the application
	ViewHome.prototype.install=function () {
		var manifestUrl = location.href.substring(0, location.href.lastIndexOf('/')) + '/manifest.webapp';
		var request = window.navigator.mozApps.install(manifestUrl);
		request.onsuccess = function() {
			this.buttonInstallation.style.display='none';
		}.bind(this);
		request.onerror = function() {
		// Display the error information from the DOMError object
		console.log('Install failed, error: ' + this.error.name);
		};
	};

	return ViewHome;

});})(this,typeof define === 'function' && define.amd ? define : function (name, deps, factory) {
	var root=this;
	if(typeof name === 'object') {
		factory=deps; deps=name; name='ViewHome';
	}
	this[name.substring(name.lastIndexOf('/')+1)]=factory.apply(this, deps.map(function(dep){
		return root[dep.substring(dep.lastIndexOf('/')+1)];
	}));
}.bind(this));

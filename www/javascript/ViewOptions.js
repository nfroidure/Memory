// AMD + global
(function(root,define){ define(['View'], function (View) {

	// Manage game settings
	function ViewOptions() { }

	// Inherit of View
	ViewOptions.prototype=new View();

	// Initialization
	ViewOptions.prototype.init=function (app,name) {
		// Calling the parent method
		View.prototype.init.bind(this)(app,name);
		// Registering view commands
		this.command('send');
		// Selecting temple elements
		document.getElementById('sounds').value=(this.app.sounds.muted?0:1);
		document.getElementById('sounds').checked=(document.fullscreenElement
			||document.mozFullScreenElement||document.webkitFullscreenElement);
	};

	ViewOptions.prototype.send=function (event, params) {
		var mute=(parseInt(event.target[0].value,10)?false:true);
		this.app.sounds.mute(mute);
		try {
			if(window.localStorage)
				window.localStorage.muted=(mute?'true':'');
		} catch(e) {}
		if(event.target[1].checked) {
			if((!document.fullscreenElement)&&(!document.mozFullScreenElement)
				&&!document.webkitFullscreenElement) {
				if(document.documentElement.requestFullscreen)
					document.documentElement.requestFullscreen();
				else if(document.documentElement.mozRequestFullScreen)
					document.documentElement.mozRequestFullScreen();
				else if(document.documentElement.webkitRequestFullscreen)
					document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
			}
		}
		else if(document.fullscreenElement||document.mozFullScreenElement
			||document.webkitFullscreenElement) {
			if(document.cancelFullScreen)
				document.cancelFullScreen();
			else if(document.mozCancelFullScreen)
				document.mozCancelFullScreen();
			else if(document.webkitCancelFullScreen)
				document.webkitCancelFullScreen();
		}
		this.app.showView('Home');
	};

	return ViewOptions;

});})(this,typeof define === 'function' && define.amd ? define : function (name, deps, factory) {
	var root=this;
	if(typeof name === 'object') {
		factory=deps; deps=name; name='ViewOptions';
	}
	this[name.substring(name.lastIndexOf('/')+1)]=factory.apply(this, deps.map(function(dep){
		return root[dep.substring(dep.lastIndexOf('/')+1)];
	}));
}.bind(this));

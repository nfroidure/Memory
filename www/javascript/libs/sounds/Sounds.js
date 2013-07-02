// AMD + global
(function(root,define){ define([], function() {

	// HTML5 Sounds manager
	function Sounds(folder,loadCallback) {
		if(!folder)
			throw new Error('No folder given for sounds !');
		// sound is on by default
		this.muted=false;
		// contains sounds elements
		this.sounds={};
		// contains sounds to load
		this.soundsToLoad=[];
		// callback executed when each sounds are loaded
		this.loadedSounds=loadCallback;
		// detecting supported extensions
		var sound=document.createElement('audio');
		this.exts=[];
		if(!sound.canPlayType)
			return;
		if(sound.canPlayType('audio/ogg'))
			this.exts.push('ogg');
		if(sound.canPlayType('audio/mp3'))
			this.exts.push('mp3');
		if(sound.canPlayType('audio/x-midi'))
			this.exts.push('mid');
		// folder containing sounds
		this.folder=folder;
	}

	// register a sound to load
	Sounds.prototype.register = function(name, extensions, iterations, volume) {
		if(!this.exts.length)
			return;
		// creating the Audio element
		var sound=new Audio();
		// Add in the sounds to load list
		this.soundsToLoad.push(sound);
		sound.setAttribute('preload','auto');
		if(extensions.every(function(ext) {
			if(-1===this.exts.indexOf(ext))
				return true;
			sound.setAttribute('src',this.folder+'/'+name+'.'+ext);
			return false;
		}.bind(this)))
			return;
		// iterating as needed
		if(Infinity===iterations)
			sound.setAttribute('loop','loop');
		else if(iterations>1)
			sound.setAttribute('data-iterations',iterations);
		if(volume)
			sound.setAttribute('data-volume',volume);
		sound.setAttribute('data-name',name);
		// adding callback
		sound.addEventListener('canplaythrough', this.soundLoaded.bind(this));
	},

	// remove soundsToLoad when loaded
	Sounds.prototype.soundLoaded = function(event) {
		// getting the index of the loaded sound
		var index=this.soundsToLoad.indexOf(event.target);
		if(index>=0) {
			var sound=this.soundsToLoad.splice(index,1)[0];
			this.sounds[sound.getAttribute('data-name')]=sound;
		}
		// if no more sounds to load, execute callback
		if(this.loadedSounds&&!this.soundsToLoad.length)
			this.loadedSounds();
	};

	// Play a sound
	Sounds.prototype.play = function(name,iterations) {
		// if the sound exists
		if(this.sounds[name]&&(this.sounds[name].hasAttribute('loop')||!this.muted)) {
			// getting iteration count
			if(!iterations) {
				iterations=1;
				if(this.sounds[name].hasAttribute('data-iterations'))
					iterations=parseInt(
						this.sounds[name].getAttribute('data-iterations'),10);
			}
			// cloning the node and playing the sound
			this.sounds[name].currentlyPlayed=
				this.sounds[name].cloneNode();
			if(this.sounds[name].hasAttribute('data-volume')) {
				this.sounds[name].currentlyPlayed.volume=
					this.sounds[name].currentlyPlayed
						.getAttribute('data-volume');
			}
			// if the sound is not muted and it's a background sound
			if(!this.muted) {
				this.sounds[name].currentlyPlayed.play();
				this.sounds[name].currentlyPlayed
					.addEventListener('ended', function() {
					if(--iterations)
						this.sounds[name].currentlyPlayed.play();
					else
						this.sounds[name].currentlyPlayed=null;
				}.bind(this));
			}
		}
	};

	// Stop a sound
	Sounds.prototype.stop = function(name) {
		if(this.sounds[name].currentlyPlayed)
			this.sounds[name].currentlyPlayed.pause();
		this.sounds[name].currentlyPlayed=null;
	};

	// Mute a sound
	Sounds.prototype.mute = function(muted) {
		for(var name in this.sounds) {
			if(this.sounds[name].currentlyPlayed) {
				this.sounds[name].currentlyPlayed[muted?'pause':'play']();
			}
		}
		this.muted=muted;
	};

	return Sounds;

});})(this,typeof define === 'function' && define.amd ? define : function (name, deps, factory) {
	var root=this;
	if(typeof name === 'object') {
		factory=deps; deps=name;
	}
	this.Sounds=factory.apply(this, deps.map(function(dep){
		return root[dep.substring(deps.lastIndexOf('/')+1)];
	}));
}.bind(this));

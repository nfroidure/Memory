// AMD + global
(function(root,define){ define(['View'], function (View) {

	// create and edit user profile
	function ViewProfile() { }

	// Inherit of View
	ViewProfile.prototype=new View();

	// Initialization
	ViewProfile.prototype.init=function (app,name) {
		// Calling the parent method
		View.prototype.init.bind(this)(app,name);
		// Registering view commands
		this.command('send');
		this.command('changes');
		this.command('photo');
		// Selecting template elements
		var form=this.content.getElementsByTagName('form')[0];
		// creating the user
		if(!this.app.user)
			this.app.user={'name':'','gender':-1};
		// Creating the background image comparison worker
		this.imageComparer=new Worker('/javascript/Compare.js');
		this.imageComparer.onmessage=function(event) { console.log('worker',event);
			if('ok'==event.data) {
				form.elements.photo2.setCustomValidity('');
			} else if('notok'==event.data) {
				form.elements.photo2.setCustomValidity('Images are too similar, please choose another one.');
			}
		}.bind(this);
		// adding default images
		var images=document.querySelectorAll('div.view.selected img.profile');
		// drag and drop management
		form.addEventListener('dragenter', function(e) {
			e.stopPropagation(); e.preventDefault(); }, false);
		form.addEventListener('dragover', function(e) {
			e.stopPropagation(); e.preventDefault(); }, false);
		form.addEventListener('drop', this.drop.bind(this), false);
		// creating the dfault images
		this.defaultImage(images[0],form.elements.user.value,1);
		this.defaultImage(images[1],form.elements.user.value,2);
		// Trying to access to user camera
		(navigator.getUserMedia||navigator.webkitGetUserMedia
			||navigator.mozGetUserMedia||navigator.msGetUserMedia
			||(function(){})).call(navigator,{'video':true},
			this.initVideo.bind(this),
			function(error) {
				console.log(error);
			});
	};

	ViewProfile.prototype.changes=function (event,params,form) {
		var images=document.querySelectorAll('div.view.selected img.profile');
		// drawing default image if no photo given
		if(event.target==form.elements.photo||(event.target==form.elements.user
			&&!(form.elements.photo.files&&form.elements.photo.files.length))) {
			if(form.elements.photo.files&&form.elements.photo.files.length)
				this.customImage(form.elements.photo.files[0],images[0],1);
			else
				this.defaultImage(images[0],form.elements.user.value,1);
			form.elements.photo2.setCustomValidity('Please wait while comparing images.');
		}
		if(event.target==form.elements.photo2||(event.target==form.elements.user
			&&!(form.elements.photo2.files&&form.elements.photo2.files.length))) {
			if(form.elements.photo2.files&&form.elements.photo2.files.length)
				this.customImage(form.elements.photo2.files[0],images[1],2);
			else
				this.defaultImage(images[1],form.elements.user.value,2);
			form.elements.photo2.setCustomValidity('Please wait while comparing images.');
		}
	};

	ViewProfile.prototype.customImage=function (fichier,image,n) {
		// From file to dataUri
		var reader = new FileReader();
		reader.readAsDataURL(fichier);
		reader.onload = function(event) {
			// using a temp image to crop the image
			var img=document.createElement('img');
			img.src = event.target.result;
			img.onload=function() {
				var canvas=document.createElement('canvas');
				canvas.width=90;
				canvas.height=90;
				var contexte=canvas.getContext('2d');
				contexte.drawImage(img,
					(img.width>img.height?(img.width-img.height)/2:0),
					(img.width>img.height?0:(img.height-img.width)/2),
					(img.width>img.height?img.height:img.width),
					(img.width>img.height?img.height:img.width),
					0, 0,90,90);
				// injecting in the image element
				image.src = canvas.toDataURL();
			// sending image datas to the image comparer
				this.imageComparer.postMessage(JSON.stringify({'image':n,'data':
					Array.prototype.slice.call(contexte.getImageData(0,0,90,90).data,0)}));
			}.bind(this);
		}.bind(this);
	};

	// Printing a default image with the user name
	ViewProfile.prototype.defaultImage=function (image,user,n) {
		// creating the canvas
		var canvas=document.createElement('canvas');
		canvas.width=90;
		canvas.height=90;
		var contexte=canvas.getContext('2d');
		// random color
		contexte.fillStyle = 'rgba('+Math.floor(Math.random()*200)
			+','+Math.floor(Math.random()*200)
			+','+Math.floor(Math.random()*200)+',0.4)';
		// drawing circle 0
		contexte.beginPath();
		contexte.arc(Math.floor(Math.random()*80)+5,
			Math.floor(Math.random()*80)+5, 5, 0, Math.PI*2, true); 
		contexte.closePath();
		contexte.fill();
		// drawing circle 1
		contexte.beginPath();
		contexte.arc(Math.floor(Math.random()*70)+10,
			Math.floor(Math.random()*70)+10, 10, 0, Math.PI*2, true); 
		contexte.closePath();
		contexte.fill();
		// drawing circle 2
		contexte.beginPath();
		contexte.arc(Math.floor(Math.random()*60)+15,
			Math.floor(Math.random()*60)+15, 15, 0, Math.PI*2, true); 
		contexte.closePath();
		contexte.fill();
		// drawing circle 3
		contexte.beginPath();
		contexte.arc(Math.floor(Math.random()*50)+20,
				Math.floor(Math.random()*50)+20, 20, 0, Math.PI*2, true); 
		contexte.closePath();
		contexte.fill();
		// printing user name
		contexte.fillStyle = '#000';
		contexte.textAlign = 'center';
		contexte.textBaseline='middle';
		contexte.font = "20pt Arial";
		contexte.fillText(user, 45, (n==1?22:67),90);
		// injecting in the img element
		image.src = canvas.toDataURL();
		// sending image datas to the image comparer
		this.imageComparer.postMessage(JSON.stringify({'image':n,'data':
			Array.prototype.slice.call(contexte.getImageData(0,0,90,90).data,0)}));
	};

	// File drop
	ViewProfile.prototype.drop=function (event) {
		var images=document.querySelectorAll('div.view.selected img.profile');
		if(event.target==images[0]||event.target==images[1]) {
			if(event.dataTransfer.files&&event.dataTransfer.files.length
				&&event.dataTransfer.files[0].type.indexOf('image/')===0) {
					this.customImage(event.dataTransfer.files[0],event.target);
					var form=document.querySelector('div.view.selected form');
					form.elements.photo2.setCustomValidity('Please wait while checking your images.');
				}
		}
		event.stopPropagation();
		event.preventDefault();
	};

	// Initializing camera
	ViewProfile.prototype.initVideo=function (fluxVidéo) {
		var images=document.querySelectorAll('div.view.selected img.profile');
		var video = document.createElement('video');
		video.setAttribute('class','profile');
		if (navigator.mozGetUserMedia)
			video.mozSrcObject = fluxVidéo;
		else
			video.src = (window.URL || window.webkitURL)
				.createObjectURL(fluxVidéo);
		var a=document.createElement('a');
		a.setAttribute('title','Take a photo');
		var a2=a.cloneNode();
		a.setAttribute('href','app:Profil/photo?image=1');
		a.appendChild(video);
		video.play();
		a2.setAttribute('href','app:Profil/photo?image=2');
		a2.appendChild(video.cloneNode());
		a2.firstChild.play();
		images[0].parentNode.insertBefore(a,images[0]);
		images[1].parentNode.insertBefore(a2,images[1]);
	};

	// Take a photo from the camera
	ViewProfile.prototype.photo=function (event, params) {
		var images=document.querySelectorAll('div.view.selected img.profile');
		var videos=document.querySelectorAll('div.view.selected video.profile');
		// creating a canvas
		var canvas=document.createElement('canvas');
		canvas.width=90;
		canvas.height=90;
		var contexte=canvas.getContext('2d');
		// drawing from user cam
		var vid=videos[params.image-1];
		contexte.drawImage(vid,
			(vid.videoWidth>vid.videoHeight?(vid.videoWidth-vid.videoHeight)/2:0),
			(vid.videoWidth>vid.videoHeight?0:(vid.videoHeight-vid.videoWidth)/2),
			(vid.videoWidth>vid.videoHeight?vid.videoHeight:vid.videoWidth),
			(vid.videoWidth>vid.videoHeight?vid.videoHeight:vid.videoWidth),
			0, 0,90,90);
		// injecting in the img element
		images[params.image-1].src = canvas.toDataURL();
	};

	// Sending the profile
	ViewProfile.prototype.send=function (event, params) {
		var images=document.querySelectorAll('div.view.selected img.profile');
		// getting user infos
		this.app.user={'name':event.target[0].value,
			'gender':(event.target[4].checked?1:event.target[5].checked?0:-1),
			'image1':images[0].src,'image2':images[1].src};
		// connecting to the websocket server
		if(!this.app.wsConnection)
			this.app.connect();
		else
			this.app.identification();
		// registering msg callback
		this.app.wsConnection.onmessage=this.connected.bind(this);
	};

	// conection callback
	ViewProfile.prototype.connected=function (event) {
		var msg=JSON.parse(event.data);
		if((!msg.type)||'connect'!=msg.type||!msg.sessid)
			throw Error('Unexpected message received.');
		// storing user id
		this.app.user.sessid=msg.sessid;
		this.app.user.id=msg.id;
		// showing rooms
		this.app.showView('Rooms');
	};

	// Unitialization
	ViewProfile.prototype.uninit=function (app) {
		var videos=document.querySelectorAll('div.view.selected video.profile');
		if(videos&&videos.length) {
			for(var i=videos.length-1; i>=0; i--)
				videos[i].parentNode.parentNode.removeChild(videos[i].parentNode);
		}
		View.prototype.uninit.bind(this)();
	};

	return ViewProfile;

});})(this,typeof define === 'function' && define.amd ? define : function (name, deps, factory) {
	if(typeof name === 'Object') {
		deps=name; factory=deps; name='ViewProfile';
	}
	this[name.substring(name.lastIndexOf('/')+1)]=factory.apply(this, deps.map(function(dep){
		return this[dep.substring(dep.lastIndexOf('/')+1)];
	}));
});

// AMD + global
(function(root,define){ define([], function() {

	// Commandor constructor : rootElement is the element
	// from wich we capture commands
	var Commandor=function Commandor(rootElement) {
		if((!rootElement)||! (rootElement instanceof HTMLElement))
			throw Error('No rootElement given');
		// Commands hashmap
		this.commands={};
		// Helper for event listening
		rootElement.addEvent=rootElement.addEventListener||rootElement.attachEvent;
		// keeping a reference to the rootElement
		this.rootElement=rootElement;
		// MS Pointer events
		if(!!('onmsgesturechange' in window)) {
			// event listeners for buttons
			(function() {
				var curElement=null;
					this.rootElement.addEvent('MSPointerDown', function(event) {
					curElement=this.findButton(event.target);
					}.bind(this),true);
				this.rootElement.addEvent('MSPointerUp', function(event) {
					if(curElement==this.findButton(event.target))
						this.captureButton(event);
					else
						curElement=null;
					}.bind(this),true);
			}).call(this);
		} else {
			// Webkit touch events
			if(!!('ontouchstart' in window)) {
				(function() {
					var curElement=null;
					// variable contenant le dernier élément visé
					this.rootElement.addEvent('touchstart', function(event) {
						curElement=this.findButton(event.target);
						}.bind(this),true);
					this.rootElement.addEvent('touchend', function(event) {
						// on vérifie qu'on est toujours sur le même élément
						if(curElement==this.findButton(event.target))
							this.captureButton(event);
						// sinon, on vide la variable
						else
							curElement=null;
					}.bind(this),true);
				}).call(this);
			}
		// Clic events
		this.rootElement.addEvent('click',
			this.captureButton.bind(this),true);
		}
	// event listeners for forms submission
	this.rootElement.addEvent('submit',
		this.captureForm.bind(this),true);
	// event listeners for form changes
	this.rootElement.addEvent('change',
		this.formChange.bind(this),true);
	this.rootElement.addEvent('input',
		this.formChange.bind(this),true);
	this.rootElement.addEvent('select',
		this.formChange.bind(this),true);
	};

	// Look for a button
	Commandor.prototype.findButton=function(element) {
		// on remonte les parent de l'élément pour
		// trouver un lien ou un bouton de soumission
		while(element!==this.rootElement
			&&element.nodeName!=='A'
			&&(element.nodeName!='INPUT'
					||(!element.hasAttribute('type'))
					||element.getAttribute('type')!='submit'
					||!element.hasAttribute('formaction')))
			{
			element=element.parentNode;
			}
		return element;
		};

	// Button command handler
	Commandor.prototype.captureButton=function(event) {
		var element=this.findButton(event.target),
			command='';
		// looking for a button with formaction attribute
		if('INPUT'===element.nodeName
				&&element.hasAttribute('type')
				&&element.getAttribute('type')=='submit'
				&&element.hasAttribute('formaction'))
			command=element.getAttribute('formaction');
		// looking for a link
		if('A'===element.nodeName&&element.hasAttribute('href'))
			command=element.getAttribute('href');
		// executing the command
		this.executeCommand(event,command,element);
		command&&(event.stopPropagation()||event.preventDefault());
	};

	// Form change handler
	Commandor.prototype.formChange=function(event) {
		var element=event.target,
			command='';
		// find the evolved form
		while(element!==this.rootElement
			&&'FORM'!==element.nodeName) {
			element=element.parentNode;
		}
		// searching the data-change attribute containing the command
		if('FORM'===element.nodeName&&element.hasAttribute('data-change'))
			command=element.getAttribute('data-change');
		// executing the command
		this.executeCommand(event,command,element);
	};

	// Form command handler
	Commandor.prototype.captureForm=function(event) {
		var element=event.target,
			command='';
		while(element!==this.rootElement
			&&'FORM'!==element.nodeName) {
			element=element.parentNode;
			}
		// Si l'élément est un formulaire et propose une commande
		if('FORM'===element.nodeName&&element.hasAttribute('action'))
			command=element.getAttribute('action');
		// Si la commande existe on stoppe la propagation
		// et on annule l'évènement
		this.executeCommand(event,command,element);
		command&&(event.stopPropagation()
			||event.preventDefault());
	};

	// Common command executor
	Commandor.prototype.executeCommand=function (event,command,element) {
		// checking for the app protocol
		if(0!==command.indexOf('app:'))
			return false;
		// removing app:
		command=command.substr(4);
		var chunks=command.split('?');
		// the first chunk is the command path
		var callback=this.commands;
		var nodes=chunks[0].split('/');
		for(var i=0, j=nodes.length; i<j; i++) {
		if(!callback[nodes[i]])
			return false;
			callback=callback[nodes[i]];
		}
		// Preparing arguments
		var args=[];
		if(chunks[1]) {
			chunks=chunks[1].split('&');
			for(i=0, j=chunks.length; i<j; i++) {
				var parts=chunks[i].split('=');
				if(undefined!==parts[0]&&undefined!==parts[1])
					args[parts[0]]=decodeURIComponent(parts[1]);
			}
		}
		// executing the command fallback
		return !!!callback(event,args,element);
	};

	// Add a callback for the specified path
	Commandor.prototype.suscribe=function(path,callback) {
		var nodes=path.split('/'),
			command=this.commands;
		for(var i=0, j=nodes.length-1; i<j; i++) {
			if((!command[nodes[i]])||!(command[nodes[i]] instanceof Object)) {
				command[nodes[i]]={};
				}
			command=command[nodes[i]];
			}
		command[nodes[i]]=callback;
	};

	// Delete callback for the specified path
	Commandor.prototype.unsuscribe=function(path) {
		var nodes=path.split('/'),
			command=this.commands;
		for(var i=0, j=nodes.length-1; i<j; i++) {
			command=command[nodes[i]]={};
		}
		command[nodes[i]]=null;
	};

	return Commandor;

});})(this,typeof define === 'function' && define.amd ? define : function (name, deps, factory) {
	if(typeof name === 'Object') {
		deps=name; factory=deps;
	}
	this.Commandor=factory.apply(this, deps.map(function(){
		return this[deps.substring(deps.lastIndexOf('/')+1)];
	}));
});

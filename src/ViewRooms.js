var View = require('./View');

// Show the rooms list
function ViewRooms() { }

// Inherit of View
ViewRooms.prototype=new View();

// Initialization
ViewRooms.prototype.init=function (app,name) {
	// Calling the parent method
	View.prototype.init.bind(this)(app,name);
	// Registering view commands
	this.command('join');
	this.command('reload');
	// Selecting template elements
	this.table=document.querySelector('div.view.selected table tbody');
	this.trTpl=this.table.firstChild;
	this.table.removeChild(this.trTpl);
	// Adding the websocket message callback
	this.app.wsConnection.onmessage=this.message.bind(this);
	// getting rooms list
	this.reload();
};

// join a room
ViewRooms.prototype.join=function (event, params) {
	this.app.wsConnection.send(JSON.stringify({'type':'room','room':params.room}));
};

// reload rooms list
ViewRooms.prototype.reload=function (event, params) {
	// empty room list
	this.empty();
	// creating the request
	var request=new XMLHttpRequest();
	var lastLineIndex=0;
	request.open('GET','/rooms.csv',true);
	request.onprogress=request.onload=function(event){
		// getting the last line index
		var newIndex=request.responseText.lastIndexOf('\n');
		// extracting lines
		if(newIndex!==-1&&lastLineIndex<newIndex) {
			var content=request.responseText.substring(lastLineIndex,newIndex+1);
			// parsing CSV
			var value='';
			var fields=[];
			for(var i=0, j=content.length; i<j; i++) {
				// escape chars
				if('\\'==content[i]) {
					value+=content[i+1];
					i++;
				// field end character
				} else if(','==content[i]||'\r'==content[i]||'\n'==content[i]||i==j-1) {
					fields.push(value);
					value='';
					// line end character
					if('\r'==content[i]||'\n'==content[i]||i==j-1) {
						// displaying the line
						this.printLine(fields);
						// reset fields
						fields=[];
					if('\r'==content[i])
						i++;
					}
				} else {
					if(content[i]!='"')
						value+=''+content[i];
				}
			}
			// saving the new index
			lastLineIndex=newIndex+1;
		}
	}.bind(this);
	request.send();
};

// ligne print
ViewRooms.prototype.printLine=function (fields) {
		var newLine=this.trTpl.cloneNode(true);
		// building the link
		newLine.firstChild.firstChild.firstChild.textContent=fields[1];
		newLine.firstChild.firstChild.setAttribute('href',
			this.trTpl.firstChild.firstChild.getAttribute('href')+fields[0]);
		// num players
		newLine.childNodes[1].firstChild.textContent=fields[3]+'/3';
		// room type
		newLine.childNodes[2].firstChild.textContent=fields[2];
		// inserting the line
		this.table.appendChild(newLine);
};

// message reception
ViewRooms.prototype.message=function (event) {
	var msg=JSON.parse(event.data);
	if((!msg.type))
		throw Error('Unexpected server message.');
	if('room'==msg.type) {
		if(msg.room) {
			this.app.room=msg.room;
			this.app.room.players.push(this.app.user);
			this.app.showView('Room');
		}
		else
			this.reload();
	}
};

// Empty room list
ViewRooms.prototype.empty=function (event) {
	while(this.table.firstChild)
		this.table.removeChild(this.table.firstChild);
};

// Unitialization
ViewRooms.prototype.uninit=function (app) {
	this.empty();
	this.table.appendChild(this.trTpl);
	View.prototype.uninit.bind(this)();
};

module.exports = ViewRooms;

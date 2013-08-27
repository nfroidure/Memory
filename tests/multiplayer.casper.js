var casper = require("casper").create({
    verbose: true,
    logLevel: "debug"
});
var user='user'+(Math.round(Math.random()*100));

casper.on('resource.requested', function(msg) {
    this.log('Resource:'+msg.url);
});

casper.on("page.error", function(msg, trace) {
  this.echo("Error:    " + msg, "ERROR");
  this.echo("file:     " + trace[0].file, "WARNING");
  this.echo("line:     " + trace[0].line, "WARNING");
  this.echo("function: " + trace[0]["function"], "WARNING");
  errors.push(msg);
});

casper.start("http://127.0.0.1:8124/index.html", function() {
	this.waitUntilVisible('#Home', function() {
		this.echo('Clicking the multiplayer button');
		this.click('a[href="app:changeView?view=Profile"]');
		this.echo('Waiting for the view');
		this.waitUntilVisible('#Profile', function() {
			this.echo('Adding a user');
		  this.fill('#Profile form', { user: user }, false);
			this.echo('Waiting image comparison');
			this.waitWhileSelector('#Profile input[type="file"]:invalid', function() {
				this.echo('Sending the form');
				this.fill('#Profile form', {}, true);
			});
		});
	});
});

casper.then(function() {
	this.echo('Waiting the room list');
	this.waitUntilVisible('#Rooms', function() {
		this.echo('Clicking on the first room');
		this.click('#Rooms a');
		this.echo('Waiting to be in the room');
		
		this.waitUntilVisible('#Room', function() {
			this.echo('Say hello ;)');
	    this.fill('#Room form', { message: 'Kikoolol !' }, true);
			this.echo('Waiting the start of the Game');
			this.waitUntilVisible('#Multi', function() {}, function() {}, Infinity);
		});
	});
});

casper.then(function() {
	this.echo('The game started');
	/*function round() {
		// Getting the available cards count
	  var avCards = this.evaluate(function() {
        var elements = __utils__.findAll('#Multi div.cards p:not(.found):not(.selected) a');
        var indexes =  [];
        Array.prototype.forEach(function(element, index) {
        	if(element.classList.has('found')||element.classList.has('face')
        		||element.classList.has('selected')) {
        			return;
        		}
        	indexes.push(index);
        });
        return indexes;
    });
    if(indexes.length) {
			this.echo('Clicking on 2 available cards');
			var index=Math.round(Math.random()*indexes.length);
			console.log('Chosen a card ',index,indexes[index]);
			this.click('#Multi div.cards p:nth-child('+(index+1)+') a');
			var index=Math.round(Math.random()*indexes.length);
			console.log('Chosen a card ',index,indexes[index]);
			this.click('#Multi div.cards p:nth-child('+(index+1)+') a');
			round.call(this);
    } else {
    	console.log('nothing here');
    }
	}
	round.call(this);*/

	/*this.waitWhileSelector('#Multi div.cards p:not(.found) a b c', function() {
		this.echo('No more cards to find.');
	},Infinity);*/
	this.echo('Waiting the end of the Game');
	this.waitUntilVisible('#Room', function() {}, function() {}, Infinity);
});



casper.then(function() {
	this.echo('The game ended');
	this.echo('Exiting the room');
	this.click('#Room a[href="app:Room/quit"]');
	this.waitUntilVisible('#Home', function() {
		this.echo('Back to home !');
	});
});

casper.run(function() {
	this.echo('Et voilà');
});

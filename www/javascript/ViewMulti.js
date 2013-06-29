// AMD + global
(function(root,define){ define(['View'], function (View) {

	function ViewMulti() { }

	// Inherit of View
	ViewMulti.prototype=new View();

	// Initialization
	ViewMulti.prototype.init=function (app,name) {
		// Calling the parent method
		View.prototype.init.bind(this)(app,name);
		// Registering view commands
		this.command('reveal');
		// Selecting template elements
		this.score=this.content.querySelector('ul.infos li:first-child span').firstChild;
		this.score.textContent=0;
		this.essais=this.content.querySelector('ul.infos li:nth-child(2) span').firstChild;
		this.essais.textContent=0;
		this.lives=this.content.querySelector('ul.infos li:nth-child(3) span').firstChild;
		this.lives.textContent=2;
		this.cards=this.content.querySelectorAll('div.cards p');
		// Adding the websocket message callback
		this.app.wsConnection.onmessage=this.message.bind(this);
	};

	ViewMulti.prototype.reveal=function (event, params) {
		// si l'interface n'est pas gelée
		// en attente d'une msg du serveur
		if(!this.uiFrozen) {
			var card=this.cards[parseInt(params.card,10)-1];
			// on vérifie que la card soit bien côté dos
			if(card.classList.contains('face')
				||this.card2)
				return false;
			this.app.wsConnection.send(JSON.stringify({'type':'reveal','card':params.card}));
			this.uiFrozen=true;
		}
	};

	ViewMulti.prototype.message=function (event) {
		var msg=JSON.parse(event.data);
		if((!msg.type))
			throw Error('Unexpected server message.');
		// card revealed confirmation
		if('card'==msg.type) {
			var card=this.cards[parseInt(msg.card,10)-1];
			if(card.classList.contains('found')
				||card.classList.contains('selected')
				||this.card2)
				return false;
			// reveal the card
			this.showCard(card,msg.player,msg.num,true);
			// if cards differs
			if(this.card1) {
				this.app.sounds.play('bad');
				this.card2=card;
				// programming cards hide
				setTimeout(function() {
					// if cards has not been found
					if(this.card1.classList.contains('selected'))
						this.hideCard(this.card1);
					if(this.card2.classList.contains('selected'))
						this.hideCard(this.card2);
					this.card1=null;
					this.card2=null;
					this.uiFrozen=false;
					}.bind(this),1000);
			} else {
				this.uiFrozen=false;
				this.card1=card;
			}
		} else if('pair'==msg.type) {
			var card1=this.cards[parseInt(msg.card1,10)-1],
				card2=this.cards[parseInt(msg.card2,10)-1];
			// showing pair found
			this.showCard(card1,msg.player,msg.num,false);
			this.showCard(card2,msg.player,msg.num,false);
			// cancel selection if she contains a card of the pair
			if(this.card1&&(this.card1==card1||this.card1==card2)) {
				this.card1=null;
				this.uiFrozen=false;
			}
			// if the pair owns the user
			if(msg.player==this.app.user.id) {
				this.app.sounds.play('alert2');
				this.lives.parentNode.classList.add('warn2');
				// removing a life
				this.lives.textContent=parseInt(this.lives.textContent,10)-1;
				// if no more lives
				if(0===parseInt(this.lives.textContent,10))
					{
					this.uiFrozen=true;
					this.app.sounds.play('loose');
					this.app.showMessage('You loose!');
					}
			}
			// if the user is the winner
			else if(msg.winner==this.app.user.id) {
				this.app.sounds.play('good');
				card1.classList.add('found');
				card2.classList.add('found');
				// updating score
				this.score.textContent=parseInt(this.lives.textContent,10)+1;
				this.uiFrozen=false;
			} else {
				this.app.sounds.play('alert1');
			}
		} else if('victory'==msg.type) {
			if(msg.winner==this.app.user.id) {
				this.app.showMessage('You win!',2000,function(){
					this.app.showView('Room');
				}.bind(this));
				this.app.sounds.play('applause');
			}
			else
				this.app.showMessage('Game over!',2000,function(){
					this.app.showView('Room');
				}.bind(this));
		}
	};

	// cards management
	ViewMulti.prototype.hideCard=function (card) {
		card.classList.remove('face');
		card.classList.remove('selected');
	}

	ViewMulti.prototype.showCard=function (card,playerId,num,selected) {
		card.classList.add('face');
		if(selected)
			card.classList.add('selected');
		else
			card.classList.remove('selected');
		this.app.room.players.forEach(function(player) {
			if(playerId==player.id) {
				card.firstChild.firstChild.style.backgroundImage='url('
					+player['image'+num]+')';
				card.firstChild.firstChild.style.backgroundSize='contain';
			}
		});
	};

	// Resetting the ui
	ViewMulti.prototype.reset=function (app) {
		this.card1=null;
		for(var i=this.cards.length-1; i>=0; i--) {
			this.cards[i].classList.remove('selected');
			this.cards[i].classList.remove('found');
			this.cards[i].classList.remove('face');
		}
	};

	// Unitialization
	ViewMulti.prototype.uninit=function (app) {
		this.reset();
		View.prototype.uninit.bind(this)();
	};

	return ViewMulti;

});})(this,typeof define === 'function' && define.amd ? define : function (name, deps, factory) {
	if(typeof name === 'Object') {
		deps=name; factory=deps; name='ViewMulti';
	}
	this[name.substring(name.lastIndexOf('/')+1)]=factory.apply(this, deps.map(function(dep){
		return this[dep.substring(dep.lastIndexOf('/')+1)];
	}));
});

var View = require('./View');

// View pour jeu en solo
function ViewMono() { }

// Inherit of View
ViewMono.prototype=new View();

// Initialization
ViewMono.prototype.init=function (app,name) {
	// Calling the parent method
	View.prototype.init.bind(this)(app,name);
	// Registering view commands
	this.command('reveal');
	this.command('replay');
	// Selecting template elements
	this.level=document.querySelector('div.view.selected ul.infos '
		+'li:first-child span').firstChild;
	this.timeLeft=document.querySelector('div.view.selected ul.infos '
		+'li:nth-child(2) span').firstChild;
	this.attempts=document.querySelector('div.view.selected ul.infos '
		+'li:nth-child(3) span').firstChild;
	// Loading game universe
	var request = new XMLHttpRequest();
	request.open('GET','/universes.json',false);
	request.send(null);
	if(request.status!=200)
		throw Error('Could not retrieve universes list!');
	this.universesList=JSON.parse(request.responseText);
	// starting
	this.replay();
};

// Restart the game
ViewMono.prototype.replay=function () {
	// Reset levels
	this.level.textContent=1;
	// distributing cards
	this.distribute();
};

// Start a level
ViewMono.prototype.distribute=function () {
	// Reset
	this.attempts.textContent=0;
	this.pairsFound=0;
	// Selecting ui cards
	var uiCards=Array.prototype.slice.call(
		document.querySelectorAll('div.view.selected div.cards p'),0);
	// Loading universe
	var request = new XMLHttpRequest();
	var universeName=this.universesList[
		Math.floor(Math.random()*this.universesList.length)];
	request.open('GET','universes/'+universeName+'.json',false);
	request.send();
	if(request.status!=200)
		throw Error('Unable to get univers !');
	var universe=JSON.parse(request.responseText);
	// Distributing cards
	this.cards=[];
	// iterating on each pairs
	for(var i=(uiCards.length/2)-1; i>=0; i--)	{
		// getting 2 cards randomly
		var card1=uiCards.splice(Math.floor(Math.random()*uiCards.length),1)[0];
		var card2=uiCards.splice(Math.floor(Math.random()*uiCards.length),1)[0];
		// getting card type from the universe
		card1.cardType=card2.cardType=universe.cards.pop();
		// adding background image
		if(universe.image) {
			card1.firstChild.firstChild.style.backgroundImage='url(/images/'+universe.image+')';
			card1.firstChild.firstChild.style.backgroundPosition='-'+(i*universe.width)+'px center';
			card2.firstChild.firstChild.style.backgroundImage='url(/images/'+universe.image+')';
			card2.firstChild.firstChild.style.backgroundPosition='-'+(i*universe.width)+'px center';
		}
		// or remove old bg
		else {
			card1.firstChild.firstChild.style.backgroundImage='none';
			card2.firstChild.firstChild.style.backgroundImage='none';
		}
		// adding the right text
		card1.firstChild.firstChild.firstChild.firstChild.textContent=card1.cardType.text;
		card2.firstChild.firstChild.firstChild.firstChild.textContent=card2.cardType.text;
		// pushing cards in the game
		this.cards.push(card2.jemel=card1,card1.jemel=card2);
	}
	// Remise à zéro des classes
	this.reset();
	// Remise à 0 des sons d'alerte
	this.alert1Ringed=false;
	this.alert2Ringed=false;
	// Remise à zéro du timer
	this.maxTimeLeft=new Date(Date.now()+5000+(120000/parseInt(this.level.textContent,10)));
	// Mise en route du compte à rebours
	if(universe.image) {
		// on crée un nœud de type image
		var img=document.createElement('img');
		img.setAttribute('src','images/'+universe.image);
		// on démarre quand elle est chargée
		img.onload=this.updateTimeLeft.bind(this);
	}
	else
		this.updateTimeLeft();
};

// updating the countdown
ViewMono.prototype.updateTimeLeft=function () {
	clearTimeout(this.timeoutTemps);
	var timeLeft=(this.maxTimeLeft.getTime()-Date.now())/1000;
	if(0>=timeLeft)
		timeLeft=0;
	this.timeLeft.textContent=Math.floor(timeLeft/60)
		+'\''+(Math.floor(timeLeft%60)<10?'0':'')+Math.floor(timeLeft%60);
	if(timeLeft<20&&!this.alert1Ringed) {
		this.app.sounds.play('alert1');
		this.timeLeft.parentNode.classList.add('warn1');
		this.alert1Ringed=true;
	}
	if(timeLeft<10&&!this.alert2Ringed) {
		this.app.sounds.play('alert2');
		this.timeLeft.parentNode.classList.add('warn2');
		this.alert2Ringed=true;
	}
	if(timeLeft>0)
		this.timeoutTemps=setTimeout(this.updateTimeLeft.bind(this), 1000);
	else {
		this.timeoutTemps=null;
		this.app.sounds.play('loose');
		this.app.showMessage('Time\'s up!',3000,this.replay.bind(this));
	}
};

// Commande pour reveal une card
ViewMono.prototype.reveal=function (event, params) {
	// on vérifie qu'on est pas entrain d'afficher un résultat
	if(this.resultTimeout)
		return false;
	// récupération de la card cliquée
	var card=document.querySelector(
		'div.view.selected div.cards p:nth-child('+params.card+')');
	// on vérifie qu'elle n'est pas déjà trouvée ou sélectionnée
	if(card.classList.contains('found')
		||card.classList.contains('selected'))
		return false;
	// on la sélectionne
	card.classList.add('face');
	card.classList.add('selected');
	// ajout de la couleur associée à la card
	card.firstChild.style.backgroundColor='#'+card.cardType.color;
	// Si aucune card selected on garde une référence à celle-ci
	if(!this.card1) {
		this.card1=card;
		this.app.sounds.play('card');
	}
	// sinon, on vérifie si elle sont jemels
	else {
		this.app.sounds.play('card1');
		this.card2=card;
		// si elles sont jemel on appelle la méthode gagner
		// sinon on appelle la méthode perdre
		this.resultTimeout=setTimeout(
			this[(this.card1.jemel==this.card2?'win':'loose')].bind(this),
			(this.card1.jemel==this.card2?100:700));
	}
};

// if cards are of a different kind
ViewMono.prototype.loose=function () {
	this.app.sounds.play('bad');
	this.resultTimeout=null;
	this.card1.classList.toggle('face');
	this.card1.classList.toggle('selected');
	this.card2.classList.toggle('face');
	this.card2.classList.toggle('selected');
	this.card1=null;
	this.card2=null;
	// adding a attempt
	this.attempts.textContent=parseInt(this.attempts.textContent,10)+1;
};

// found a pair
ViewMono.prototype.win=function () {
	this.app.sounds.play('good');
	this.resultTimeout=null;
	this.card1.classList.toggle('selected');
	this.card1.classList.toggle('found');
	this.card2.classList.toggle('selected');
	this.card2.classList.toggle('found');
	// resetting cards
	this.card1=null;
	this.card2=null;
	// adding pair to found items
	this.pairsFound++;
	// if every pairs are found
	if(this.pairsFound==this.cards.length/2) {
		this.level.textContent=parseInt(this.level.textContent,10)+1;
		clearTimeout(this.timeoutTemps);
		this.timeoutTemps=null;
		this.app.sounds.play('applause');
		this.app.showMessage('You win!',1500,this.distribute.bind(this));
	}
};

// resetting ui
ViewMono.prototype.reset=function () {
	this.card1=null;
	this.card2=null;
	if(this.resultTimeout) {
		clearTimeout(this.resultTimeout);
		this.resultTimeout=null;
	}
	this.timeLeft.parentNode.classList.remove('warn1');
	this.timeLeft.parentNode.classList.remove('warn2');
	for(var i=this.cards.length-1; i>=0; i--) {
		this.cards[i].classList.remove('selected');
		this.cards[i].classList.remove('found');
		this.cards[i].classList.remove('face');
	}
};

// Unitialization
ViewMono.prototype.uninit=function (app) {
	this.app.messageCallback=null;
	clearTimeout(this.timeoutTemps);
	this.reset();
	View.prototype.uninit.bind(this)();
};

module.exports = ViewMono;

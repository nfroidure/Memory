// Constantes
var RACINE=__dirname+'/../www', // on ajoute la racine par défaut
	DOMAINE='127.0.0.1',
	PORT=8124;

var fs=require('fs'),
	request = require('request'),
	assert = require('assert');

describe('Test du serveur HTTP', function(){
	it("Test de la redirection vers index.html", function(done) {
		request({uri:'http://'+DOMAINE+':'+PORT+'/',followRedirect:false},
		function(error, response, body){
			if(error) throw error;
			assert.equal(response.statusCode,301);
			assert.equal(response.headers.location,'/index.html');
			done();
		});
	});

	it("Récupérer un fichier sur le serveur", function(done) {
		request('http://'+DOMAINE+':'+PORT+'/index.html',
		function(error, response, body){
		  assert.equal(body,fs.readFileSync(RACINE+'/index.html'));
			done();
		});
	});
});

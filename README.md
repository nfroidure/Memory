Memory
============

Memory is a free game written in HTML5/JavaScript and created during the writting of a french book to illustrate JavaScript application development.

You can test it on : http://memory.insertafter.com/index.html

Requirements
-------------
* Modern web browser (Chrome, Firefox ...)
* NodeJS + npm install websocket
* Libs : RequireJS, Commandor, Sounds.
* Building :
```bash
npm install -g requirejs
cd www
# Debug
r.js -o baseUrl=./javascript/ name=Application out=javascript/production.js optimize=none
# Production
r.js -o baseUrl=./javascript/ name=Application out=javascript/production.js
```
* Testing :
```bash
npm install -g request mocha; mocha tests/*.mocha.js
```

Launching
-------------
```bash
node server.js
```

Sounds
-------------
* Iwan Gabovitch - http://qubodup.net/
* Devin Watson - http://opengameart.org/users/dklon
* Brandon Morris - http://opengameart.org/users/dklon
* A.J. Gillespie - http://opengameart.org/users/avgvst

License
-------
Copyright Nicolas Froidure 2013.

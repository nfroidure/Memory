Memory
============

Memory is a free game written in HTML5/JavaScript and created during the write of a french book illustrating JavaScript application development.

You can test it on : http://memory.insertafter.com/index.html

Requirements
-------------
* Modern web browser (Chrome, Firefox ...)
* NodeJS + npm install websocket
* Libs : RequireJS, Commandor, Sounds.

Building
-------------

Web app :
```bash
# Requirements
npm install -g requirejs
./libs.sh
# Build
./build.sh
# Dev
./dev.sh
```

Android app :
Reach the bin dir
```bash
cd materials/android/bin
```
Generate the key :
```bash
keytool -genkey -v -keystore memory-key.keystore -alias memory -keyalg RSA -keysize 2048 -validity 10000
```
Build for release :
```bash
ant release
```
Sign, then align :
```bash
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore memory-key.keystore Memory-release-unsigned.apk memory
zipalign -v 4 Memory-release-unsigned.apk Memory-release-signed.apk
```

Launching
-------------
```bash
node server.js
```

Testing
-------------
```bash
npm install -g request mocha; mocha tests/*.mocha.js
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

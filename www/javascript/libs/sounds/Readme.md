Sounds
==============

Sounds is a simple JavaScript library playing sounds. Modern browsers only, experimental.

```js
var soundManager=new Sounds('media/sounds',function() {
	console.log('All sounds loaded !');
	soundManager.register('tadaaa');
	});
soundManager.register('supersound');
soundManager.register('supersound1');
soundManager.register('supersound2');
soundManager.register('tadaaa');
```

Licence
--------------
GNU/GPL

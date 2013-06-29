var imageData1=null, imageData2=null, timeout=null, MIN_DIFFS=7;

// compare 2 images
function compareImages() {
	// compare images with a delta on y OR x
	// 0 to 15 pixels on x
	for(var dx=0; dx<15; dx++) {
		// 0 to 15 pixels on y
		for(var dy=0; dy<15; dy++) {
			if(!(dataDiffers(imageData1,imageData2,dx,dy)
				&&dataDiffers(imageData2,imageData1,dx,dy))) {
				postMessage('notok');
				return;
			}
		}
	}
	postMessage('ok');
}

// compare image datas
function dataDiffers(data1,data2,dx,dy) {
	var numDiffs=0;
	// iterating throught each pixels
	for(var x=dx; x<90; x++) {
		for(var y=dy; y<90; y++) {
			// and throught each color channels
			for(var i=0; i<3;	i++)
				if(data1[(x*90*4)+(y*4)+i]<data2[(x*90*4)+(y*4)+i]-5
					&&data1[(x*90*4)+(y*4)+i]>data2[(x*90*4)+(y*4)+i]+5)
					numDiffs++;
			// more permissive with transparency
			if(data1[(x*90*4)+(y*4)+i]<data2[(x*90*4)+(y*4)+i]-10
				||data1[(x*90*4)+(y*4)+i]>data2[(x*90*4)+(y*4)+i]+10)
				numDiffs++;
		}
	}
	// sending result
	if(numDiffs<(((90-dx)*(90-dy)*4*MIN_DIFFS)/100))
		return false;
	return true;
}
 
// listening to main thread messages
onmessage = function (event) {
	if(event.data) {
		var data=JSON.parse(event.data);
		if(1==data.image) {
			imageData1=data.data;
		} else if(2==data.image) {
			imageData2=data.data;
		}
		// cancel last comparison programamtion
		if(timeout)
			clearTimeout(timeout);
		// program a new comparison
		if(imageData1&&imageData2)
			timeout=setTimeout(compareImages,2000);
	}
};

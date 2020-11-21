(function() {
    var canvas = document.getElementById('canvas'),
        video = document.getElementById('webcam');

	// setInterval(function(){
		// console.log("check face")
		
	// },1000)



    async function draw(video,canvas, width, height)
    {
        // context.drawImage(video,0,0,width,height);
        const model = await blazeface.load();
        const returnTensors = false;
        const predictions = await model.estimateFaces(document.getElementById("webcam"), returnTensors);
		var context = canvas.getContext('2d')
		// console.log(predictions)
          if (predictions.length > 0)
          {
           console.log("predictin found",predictions);
           for (let i = 0; i < predictions.length; i++) {
           const start = predictions[i].topLeft;
           const end = predictions[i].bottomRight;
           var probability = predictions[i].probability;
           const size = [end[0] - start[0], end[1] - start[1]];
           // Render a rectangle over each detected face.
		   context.clearRect(0, 0, canvas.width, canvas.height);
           context.beginPath();
           context.strokeStyle="green";
           context.lineWidth = "4";
           context.rect(start[0], start[1],size[0], size[1]);
           context.stroke();
           var prob = (probability[0]*100).toPrecision(5).toString();
           var text = prob+"%";
           context.fillStyle = "red";
           context.font = "13pt sans-serif";
           context.fillText(text,start[0]+5,start[1]+20);
            }
           }
        setTimeout(draw,1000,video,context,width,height);
    }
	draw(video, canvas,640,480);
})();
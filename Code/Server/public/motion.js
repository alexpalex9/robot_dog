/**
 * jquery.motionDetection.js
 * @version: v1.0.0
 * @author: Sebastian Marulanda http://marulanda.me
 * @see: https://github.com/smarulanda/jquery.motionDetection
 */
 
 // séparer canvas drawing en video memory!!

(function($) {

	$.fn.motionDetection = function(options) {
		
		var defaults = {
			pollingFrequency: 250,
			threshold: 0.25,
			hide: true,
			$canvas : $('.motionDetection_overlay'),
			$source : $('.motionDetection'),
			cellsQty : 12,
			movementThreshold : 0.1,
			onDetection: function(data) { 
				console.log("Motion detected!",data); 
				
				//const canvas = ctx.canvas;
				var canvas = data.canvas
				//canvas.width = canvas.width;
				//canvas.height = canvas.height;
				var ctx = canvas.getContext('2d')
				
				//ctx.save();
				//csActualRatio = 
				//csActualRatio = canvas.width / canvas.height
				//cs.x *= csActualRatio;
				//cs.y *= csActualRatio;
				
				
				const grid = data.frame;
				//console.log(canvas.width,canvas.height)
				//ctx.clearRect(0, 0, canvas.width, canvas.height);
				var csratio = grid.length / canvas.width
				var aspectRatio = canvas.width / canvas.height
				// to calculate
				//console.log("settings",settings,data.settings)
				var cellArea = canvas.width * canvas.height / settings.cellsQty;
				var cellwidth = Math.sqrt(cellArea) * aspectRatio
				var cellheight = cellArea / cellwidth
				//console.log('cell dime',cellArea,cellwidth,cellheight)
				var cellwidthqty = Math.floor(canvas.width / cellwidth)
				//console.log("cell dimension",cellwidth,cellheight,cellArea,csratio)
				
				cellwidth = 64 // 64
				cellwidthqty = 10 //10
				cellheight = 48 //48
				cellheightqty = 10 // 10
				settings.cellsQty = cellwidthqty * cellheightqty
				cellArea = 30.72
				for (var i = 0; i < settings.cellsQty; i++) {
					var x = Math.floor((i % cellwidthqty) * cellwidth)
					//var x = Math.floor((i / cellwidthqty)) * cellwidth
					var y = Math.floor(i / cellheightqty) * cellheight
					//var y = Math.floor(i % cellheightqty * cellheight)
					var intensity = grid[i] /10 ;// / cellArea;
					//console.log('draw',x,y,grid[i],intensity)
					//ctx.strokeStyle = 'rgba(0, 80, 200, 0.2)';
					ctx.fillStyle = intensity > settings.movementThreshold ? `rgba(0, 80, 200, ${0.1 + intensity})` : 'transparent';
					//ctx.strokeStyle = ctx.fillStyle;
					//console.log('draw',x,y,ctx.fillStyle,intensity )
					ctx.beginPath();
					
					ctx.rect(x, y, cellwidth , cellheight);
					ctx.closePath();
					//ctx.stroke();
					ctx.fill();
				}
				/*
				// scale up cell size
				const cellArea = cs.x * cs.y;
				cs.x *= csActualRatio;
				cs.y *= csActualRatio;
				
				ctx.strokeStyle = 'rgba(0, 80, 200, 0.2)';

				ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
				grid.forEach((cell, i) => {
					const x = i % gs.x;
					const y = Math.floor(i / gs.x);
					let intensity = cell / cellArea;
					// higher opacity for cells with more movement
					ctx.fillStyle = intensity > options.movementThreshold ? `rgba(0, 80, 200, ${0.1 + intensity})` : 'transparent';

					ctx.beginPath();
					ctx.rect(x * cs.x, y * cs.y, cs.x, cs.y);
					ctx.closePath();
					ctx.stroke();
					ctx.fill();
				});
				*/
			}
		};

		var settings = $.extend({}, defaults, options);

		var canvas, canvasContext;
		var previousFrame, currentFrame;

		return this.each(function() {
			video = settings.$source[0];
			canvas = settings.$canvas[0];
			//console.log(video,canvas)
			//video.setAttribute("autoplay", true);

			canvas.width = video.width;
			canvas.height = video.height;

			canvasContext = canvas.getContext('2d');
			
			//cellWidth = parseInt(canvas.width/horizontalCells)
			//cellHeight = parseInt(canvas.height/verticalCells)
			

			//if (settings.hide) {
			//	video.style.display = "none";
				//canvas.style.display = "none";
			//}

			// setupWebcam();
			update();
		});
		
		function update() {
			//console.log('update',settings.pollingFrequency,video.naturalHeight)
			if (video.naturalHeight!=0){
				drawVideo();
				checkMotion();
				
			}
			setTimeout(update, settings.pollingFrequency);
		}

		function drawVideo() {
			// console.log("isempty?",video.complete,video.naturalHeight);
			// if (video.naturalHeight!=0){
			console.log("draw video")
				canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);
			// }
		}

		function checkMotion() {
			//previousFrame = (!previousFrame) ? canvasContext.getImageData(0, 0, canvas.width, canvas.height) : currentFrame;
			currentFrame = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
			//console.log(currentFrame)
			if (!previousFrame){
				previousFrame = currentFrame;
			}
			var data = difference(previousFrame.data, currentFrame.data);
			previousFrame = currentFrame;
			//console.log(data)
			//if (data.pixelsChanged > (settings.threshold * canvas.width * canvas.height)) {
				settings.onDetection.call(this,data);
			//}
		}
		function reframe(frame){
			//settings.cellsQty = 10
			rate = parseInt(frame.length/(settings.cellsQty));
			//settings.cellrate = rate
			//settings.cellratio = rate / 4  
			//console.log("rate",rate)
			var newframe = []
			
			for (var i = 0; i < settings.cellsQty; i++) {
				var a=0,b=0,c=0,d=0;
				//for (var j =  i * rate; j < (i+1) * rate / 4; j++) {
				for (var j =  i * rate; j < (i+1) * rate ; j=j+4) {
					//console.log(i,j)
					a = a + frame[j]
					b = b + frame[j+1]
					c = c + frame[j+2]
					d = d + frame[j+3]
				}
				//console.log("a=",a)
				newframe.push(a/rate)
				newframe.push(b/rate)
				newframe.push(c/rate)
				newframe.push(d/rate)
			}
			//console.log(i,j,frame.length)
			return newframe
		}
		function difference(frame1, frame2) {
			
			frame1 = reframe(frame1)
			frame2 = reframe(frame2)
			//console.log('frame1',frame1)
			//console.log('frame2',frame2)
			var pixelsChanged = 0;
			//console.log(frame1)
			frameDiff = []
			//for (var i = 0; i < (frame1.length / 4); i++) {
			//console.log('frame1 RERERE.length',frame1.length)
			for (var i = 0; i < frame1.length ; i = i + 4) {
				// Average a pixel's 3 color channels
				var avg1 = (frame1[i] + frame1[i+1] + frame1[i+2]) / 3;
				var avg2 = (frame2[i] + frame2[i+1] + frame2[i+2]) / 3;
				// The grayscale difference for that pixel
				var diff = Math.abs(avg1 - avg2);
				//console.log(avg1,avg2,diff)
				// Count the pixel as changed if above 0x15 threshold
				pixelsChanged += (diff > 0x15);
				//pixelsChanged += (diff > 0x15);
				frameDiff.push(diff)
			}
			//console.log(frameDiff)
			return {pixelsChanged:pixelsChanged,frame:frameDiff,canvas:settings.$canvas[0],settings:settings};
		}
	
	}

}(jQuery));

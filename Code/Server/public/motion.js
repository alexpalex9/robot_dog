(function($) {

	$.fn.motionDetection = function(options) {
		var _this = this;
		var defaults = {
			pollingFrequency:500,
			threshold: 0.0,
			hide: true,
			$canvas_draw : $('#motion_draw'),
			$canvas_overlay : $('#motion_overlay'),
			$source : $('#webcam'),
			cellwidthqty : 64,
			cellheightqty : 32, // 10 it works good
			movementThreshold : 0.1,
			onDetection: function(data) { 
				// console.log("Motion detected!",data); 
				var ctx = canvas_overlayContext
				const grid = data.frame;
				
				var cellwidth = settings.cellwidth
				var cellheight = settings.cellheight
				var cellwidthqty = settings.cellwidthqty
				var cellheightqty = settings.cellheightqty
				
				ctx.clearRect(0, 0, canvas_overlay.width, canvas_overlay.height);
				for (var i = 0; i < settings.cellsQty; i++) {
					var x = Math.floor((i % cellwidthqty) * cellwidth)
					var y = Math.floor(i / cellwidthqty) * cellheight
					var intensity = grid[i] / 255 ;// / cellArea;
					ctx.fillStyle = intensity > settings.movementThreshold ? `rgba(0, 80, 200, ${0.1 + intensity})` : 'transparent';
					ctx.beginPath();
					
					ctx.rect(x, y, cellwidth , cellheight);
					ctx.closePath();
					ctx.fill();
				}
			}
		};

		var settings = $.extend({}, defaults, options);
		var canvas_draw, canvas_drawContext, canvas_overlay, canvas_overlayContext;
		var previousFrame, currentFrame;
		
		var video = settings.$source[0];
		// console.log('video width',video.width)
		_this.init = function(){
			
			canvas_draw = settings.$canvas_draw[0];
			console.log("set canvas draw",video.width,video.height)
			canvas_draw.width = video.width;
			canvas_draw.height = video.height;
			canvas_drawContext = canvas_draw.getContext('2d');
			
			canvas_overlay = settings.$canvas_overlay[0];
			canvas_overlay.width = video.width;
			canvas_overlay.height = video.height;
			canvas_overlayContext = canvas_overlay.getContext('2d');
			
			settings.cellsQty = settings.cellwidthqty * settings.cellheightqty			
			settings.cellwidth = canvas_draw.width / settings.cellwidthqty // 64
			settings.cellheight =  Math.floor(canvas_draw.height / settings.cellheightqty) // 64
			settings.totalwidth =   canvas_draw.width
			// settings.cellwidthqty = cellwidthqty
			// settings.cellheightqty = cellheightqty
			_this.on('click',function(){
				console.log('click')
				if (_this.hasClass('disabled')==false){
					_this.toggleClass('active')
				}
			})
		}
		
		_this.init();
		_this.removeClass('disabled')
		// drawVideo();
		// drawVideoCanvas()
		function drawVideoCanvas(){
			// function to show pixelized image, not use, more for debugging
			var canvas = $('#motion_pixel').get(0)
			canvas.width = video.width
			canvas.height = video.height
			currentFrame = canvas_drawContext.getImageData(0, 0, canvas.width,canvas.height);
			var ctx = canvas.getContext('2d')	
			cellwidth = settings.cellwidth
			cellheight = settings.cellheight
			cellwidthqty = settings.cellwidthqty
			cellheightqty = settings.cellheightqty
			data = reframe(currentFrame.data)
			
			for (var i = 0; i < settings.cellsQty * 4; i = i + 4) {
				var x = Math.floor((i/4 % cellwidthqty) * cellwidth)
				var y = Math.floor(i/4 / cellwidthqty) * cellheight
				ctx.fillStyle = "rgba( " + data[i] + "," + data[i+1] + "," + data[i+2] + "," + data[i+3] +" )"
				ctx.strokeStyle = "rgba(0,0,0,1)";
				ctx.beginPath();
				ctx.rect(x, y, cellwidth , cellheight);
				ctx.closePath();
				ctx.fill();
			}
		}

		return this.each(function() {
			update();
			// drawVideoCanvas()
		});
		
		function update() {
			
			if (video.naturalHeight!=0){
				if (_this.hasClass('active')){
					drawVideo();
					checkMotion();
					drawVideoCanvas()
				}else{
					settings.$canvas_overlay.get(0).getContext('2d').clearRect(0, 0, settings.$canvas_overlay.get(0).width, settings.$canvas_overlay.get(0).height);
				}
				
				
			}else{
				console.log("height is 0")
			}
			setTimeout(update, settings.pollingFrequency);
		}

		function drawVideo() {
			canvas_drawContext.drawImage(video, 0, 0, canvas_draw.width, canvas_draw.height);
		}

		function checkMotion() {
			// console.log("check motion")
			currentFrame = reframe(canvas_drawContext.getImageData(0, 0, canvas_draw.width, canvas_draw.height).data);
			if (!previousFrame){
				previousFrame = currentFrame;
			}
			var data = difference(previousFrame, currentFrame);
			previousFrame = currentFrame;
			if (data.pixelsChanged > (settings.threshold * settings.cellsQty)) {
				settings.onDetection.call(this,data);
			}else{
				canvas_overlayContext.clearRect(0, 0, settings.$canvas_overlay.get(0).width, settings.$canvas_overlay.get(0).height);
			}
		}

		function reframe(frame){
			// console.log(frame)
			var newframe = []
			var cellwidth = settings.cellwidth
			var cellheight = settings.cellheight
			var cellwidthqty = settings.cellwidthqty
			var cellheightqty = settings.cellheightqty
			var cellsQty = cellwidthqty * cellheightqty
			var count = cellheight * cellwidth;
			// console.log("cellheight",cellheight)
			// console.log("cellheightqty",cellheightqty)
			// console.log("cellwidthqty",cellwidthqty)
			// console.log("cellwidth",cellwidth)
			for (var i = 0; i < cellsQty; i++) {
				var a=0
				var b=0
				var c=0
				var d=0;
				var xnp = i % cellwidthqty
				var ynp = Math.floor(i / cellwidthqty)
				
				var undery =  Math.floor(ynp * cellheight * settings.totalwidth )
				var underx =  Math.floor(xnp  * cellwidth)
				var xstart = undery + underx
				// console.log("undery",undery)
				// console.log("underx",underx)
				// if (i==5){
				// console.log("xnp",xnp)
				// console.log("ynp",ynp)
				
				// console.log("under y", ynp * cellheight * cellwidth * cellwidthqty )
				// console.log("under x", xnp  * cellwidthqty)
				// }
				// console.log(i,"xstart",xstart)
				// for( yp = xstart ; yp ; yp = yp + cellwidth * cellwidthqty)
				for (var iy = 0 ; iy < cellheight ; iy = iy + 1){
					// if (i==6){
						// console.log("xstart",xstart)
					// }
					
					for (var ix = 0 ; ix < cellwidth ; ix = ix + 1){
						var index = xstart + ix + iy * (settings.totalwidth)
						// if (i==6){
							// console.log("index = ",index)
						// }
						a = a + frame[index*4];
						b = b + frame[index*4+1];
						c = c + frame[index*4+2];
						d = d + frame[index*4+3];
					}
				
				}
				newframe.push(a/count)
				newframe.push(b/count)
				newframe.push(c/count)
				newframe.push(d/count)
			}
			// for (var i = 0; i < settings.cellsQty; i++) {
				// var a=0
				// var b=0
				// var c=0
				// var d=0;
				// var hstart = Math.floor( i /  cellwidthqty ) 				
				// var xstart =  i %  cellwidthqty * cellwidth + (hstart * cellwidth * cellheight * cellwidthqty)
				// var xend =  xstart + cellwidth
				// var ystep = cellwidth * cellwidthqty
				// for (var x = xstart ; x<xend; x++){
					// var ystart = x
					// var yend = x + cellwidth * cellwidthqty * cellheight
					// for (var y = ystart ; y < yend  ; y = y + ystep){
						// var index = y * 4
						// a = a + frame[index];
						// b = b + frame[index+1];
						// c = c + frame[index+2];
						// d = d + frame[index+3];

					// }
				// }
				

			// }
			// console.log(newframe)
			return newframe
		}
		function difference(frame1, frame2) {
			var pixelsChanged = 0;
			var frameDiff = [];
			for (var i = 0; i < frame1.length ; i = i + 4) {
				// Average a pixel's 3 color channels
				var avg1 = (frame1[i] + frame1[i+1] + frame1[i+2]) / 3;
				// var avg1 = (frame1[i] + frame1[i+1] + frame1[i+2] + frame1[i+3]) / 3;
				var avg2 = (frame2[i] + frame2[i+1] + frame2[i+2] ) / 3;
				// var avg2 = (frame2[i] + frame2[i+1] + frame2[i+2] + frame2[i+3]) / 3;
				// The grayscale difference for that pixel
				var diff = Math.abs(avg1 - avg2);
				frameDiff.push(diff);
				//console.log(avg1,avg2,diff)
				// Count the pixel as changed if above 0x15 threshold
				pixelsChanged += (diff > 0x15);
				//pixelsChanged += (diff > 0x15);
				
			}
			//console.log(frameDiff)
			return {pixelsChanged:pixelsChanged,frame:frameDiff};
		}
	
	}

}(jQuery));

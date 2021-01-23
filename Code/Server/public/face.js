(function($) {

	$.fn.faceDetection = function(options) {
		// this should be the button
		var _this = this;
		_this.addClass('disabled')
		console.log("face",this,faceapi)
		var defaults = {
			pollingFrequency: 5000,
			minConfidence : 0.2,
			$canvas_overlay : $('#face_overlay'),
			$source : $('#webcam'),
			onDetection: function(detection) {
				console.log("face detected!",detection);
				const resizedResults = faceapi.resizeResults(detection, settings.$source.get(0))
				console.log("erase")
				// settings.$canvas_overlay.get(0).getContext('2d').clearRect(0, 0, _this.$canvas_overlay.get(0).width, _this.$canvas_overlay.get(0).height);
				console.log("draw")
				faceapi.draw.drawDetections(settings.$canvas_overlay.get(0), resizedResults,0.05)
				faceapi.draw.drawFaceExpressions(settings.$canvas_overlay.get(0), resizedResults,0.05)				
			}
		};
		
		var settings = $.extend({}, defaults, options);
		
		var video = settings.$source[0];
		canvas_overlay = settings.$canvas_overlay[0];
		canvas_overlay.width = video.width;
		canvas_overlay.height = video.height;
		
		var path = '/models/';
		console.log("loading models")
		Promise.all([
		  //faceapi.loadFaceLandmarkModel(path),
		  //faceapi.loadFaceRecognitionModel(path),
		  //faceapi.loadTinyFaceDetectorModel(path),
		  faceapi.loadFaceLandmarkModel(path),
		  //faceapi.loadFaceLandmarkTinyModel(path),
		  faceapi.loadFaceRecognitionModel(path),
		  faceapi.loadFaceExpressionModel(path),
		  faceapi.loadSsdMobilenetv1Model(path)
		  //faceapi.loadFaceRecognitionModel(path)
		  //faceapi.loadFaceLandmarkModel(path)
		]).then(function(){
			console.log("model loaded")
			_this.removeClass('disabled')
		}).catch(function(e){
			console.log("error loading model",e)
			
		})
		_this.on('click',function(){
			console.log('click')
			if (_this.hasClass('disabled')==false){
				_this.toggleClass('active')
			}
		})
	
		return this.each(function() {
			// console.log('return')
			update();
		});
		
		function update() {
			
			if (video.naturalHeight!=0){
				if (_this.hasClass('active')){
					face_detection()
				}else{
					// console.log(settings.$canvas_overlay.get(0))
					settings.$canvas_overlay.get(0).getContext('2d').clearRect(0, 0, settings.$canvas_overlay.get(0).width, settings.$canvas_overlay.get(0).height);
					
				}
			}
			setTimeout(update, settings.pollingFrequency);
			
		}

		async function face_detection(){
			console.log("check face")
			var options =  new faceapi.SsdMobilenetv1Options({ minConfidence: settings.minConfidence})
			var detection =  await faceapi.detectAllFaces($('#webcam').get(0),options).withFaceLandmarks().withFaceExpressions().withFaceDescriptors()       
			settings.$canvas_overlay.get(0).getContext('2d').clearRect(0, 0, settings.$canvas_overlay.get(0).width, settings.$canvas_overlay.get(0).height);
			if (detection.length){
				settings.onDetection.call(this,detection);
			}else{
				console.log("no face results")
			}
				  
		}
	}

}(jQuery));

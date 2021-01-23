(function($) {

	$.fn.faceDetection = function(options) {
		// this should be the button
		var _this = this;
		_this.addClass('disabled')
		console.log("face",this,faceapi)
		var defaults = {
			pollingFrequency: 1000,
			minConfidence : 0.2,
			$canvas_overlay : $('#face_overlay'),
			$source : $('#webcam'),
			onDetection: function(data) {
				console.log("face detected!",data);
				const resizedResults = faceapi.resizeResults(detection, $('#webcam').get(0))
				console.log("erase")
				// settings.$canvas_overlay.get(0).getContext('2d').clearRect(0, 0, _this.$canvas_overlay.get(0).width, _this.$canvas_overlay.get(0).height);
				console.log("draw")
				faceapi.draw.drawDetections(settings.$canvas_overlay.get(0), resizedResults,0.05)
				faceapi.draw.drawFaceExpressions(settings.$canvas_overlay.get(0), resizedResults,0.05)				
			}
		};
		
		var settings = $.extend({}, defaults, options);
		
		var path = '/models/';
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
		})
		_this.on('click',function(){
			if (_this.hasClass('disabled')==false){
				_this.toggleClass('active')
			}
		})
	
		return this.each(function() {
			update();
		});
		
		function update() {
			// console.log(settings.$canvas_overlay.get(0))
			if (_this.hasClass('active')){
				face_detection()
				setTimeout(update, settings.pollingFrequency);
			}else{
				// console.log(settings.$canvas_overlay.get(0))
				settings.$canvas_overlay.get(0).getContext('2d').clearRect(0, 0, settings.$canvas_overlay.get(0).width, settings.$canvas_overlay.get(0).height);
				
			}
			
		}

		async function face_detection(){
			console.log("detection")
			var options =  new faceapi.SsdMobilenetv1Options({ minConfidence: settings.minConfidence})
			var detection =  await faceapi.detectAllFaces($('#webcam').get(0),options).withFaceLandmarks().withFaceExpressions().withFaceDescriptors()       
			settings.$canvas_overlay.get(0).getContext('2d').clearRect(0, 0, _this.$canvas_overlay.get(0).width, _this.$canvas_overlay.get(0).height);
			if (detection.length){
				settings.onDetection.call(this,detection);
			}else{
				console.log("no results")
			}
				  
		}
	}

}(jQuery));

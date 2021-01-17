var init = function(){
	var _this = {
		face_detection :{
			$canvas : $('#face_overlay')
		}
	};
	_this.socket = io.connect(url + "/robot");
	//var canvas = $('#webcam_overlay').get(0)
    //var context = canvas.getContext('2d')  
    
	$('html').on('click','.cmd',function(){
		
			_this.socket.emit('run',  $(this).data('v')) // {'episodes': $('#episodes').val() , });
		// console.log("url =",'cmd?cmd=' + $(this).data('cmd') + '&value=' + $(this).data('v'))
		// $.ajax({
			// url : '/cmd&cmd=' + $(this).data('cmd') + '&value=' + $(this).data('v'),
			// type : 'GET',
			// dataType : 'json', //'html',
			// data : {
				// cmd : $(this).data('cmd'),
				// value : $(this).data('v')
				
			// },
			// timeout : 50000,		
			// success : function (data, status) {
				// console.log("success",data)
				// console.log(typeof(data))
			// },
			// error: function(xhr,error) {
				// console.log("error in ajax request",error)
			// },
			// complete:function(){
			// }
		// });
	})
	$('html').on('click','#face_detection_button:not(.disabled)',function(){
		if (_this.face_detection.job===undefined){
			console.log("launch face detection")
			$('#face_detection_button').addClass("active")
			_this.face_detection.job = setInterval(function(){
				console.log("face detection")
				face_detection()
			  },2000)
		}else{
			_this.face_detection.$canvas.get(0).getContext('2d').clearRect(0, 0, _this.face_detection.$canvas.get(0).width, _this.face_detection.$canvas.get(0).height);
			clearInterval(_this.face_detection.job)
			$('#face_detection_button').removeClass("active")
			delete _this.face_detection.job
		}
	})
	// Create JoyStick object into the DIV 'joy1Div'
	console.log("init Joystick")
	var Joy1 = new JoyStick('joy1Div',{
		internalFillColor :"#818181",
		internalStrokeColor : "#818181",
		externalStrokeColor  : "#818181"
		});

	var joy1IinputPosX = document.getElementById("joy1PosizioneX");
	var joy1InputPosY = document.getElementById("joy1PosizioneY");
	var joy1Direzione = document.getElementById("joy1Direzione");
	var joy1X = document.getElementById("joy1X");
	var joy1Y = document.getElementById("joy1Y");

	setInterval(function(){ joy1IinputPosX.value=Joy1.GetPosX(); }, 50);
	setInterval(function(){ joy1InputPosY.value=Joy1.GetPosY(); }, 50);
	setInterval(function(){ joy1Direzione.value=Joy1.GetDir(); }, 50);
	setInterval(function(){ joy1X.value=Joy1.GetX(); }, 50);
	setInterval(function(){ joy1Y.value=Joy1.GetY(); }, 50);

	// Create JoyStick object into the DIV 'joy2Div'
	var joy2Param = { "title": "joystick2", "autoReturnToCenter": false };
	var Joy2 = new JoyStick('joy2Div', joy2Param);

	var joy2IinputPosX = document.getElementById("joy2PosizioneX");
	var joy2InputPosY = document.getElementById("joy2PosizioneY");
	var joy2Direzione = document.getElementById("joy2Direzione");
	var joy2X = document.getElementById("joy2X");
	var joy2Y = document.getElementById("joy2Y");
	//Joy2.onTouchMove({
	//		targetTouches : [{pageX:50,pageY:0}]
	//})
	setInterval(function(){ joy2IinputPosX.value=Joy2.GetPosX(); }, 50);
	setInterval(function(){ joy2InputPosY.value=Joy2.GetPosY(); }, 50);
	setInterval(function(){ joy2Direzione.value=Joy2.GetDir(); }, 50);
	setInterval(function(){ joy2X.value=Joy2.GetX(); }, 50);
	setInterval(function(){ joy2Y.value=Joy2.GetY(); }, 50);


    async function face_detection(){
      console.log("detection")
	  // new faceapi.TinyFaceDetectorOptions()
		var options =  new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2})
      var detection =  await faceapi.detectAllFaces($('#webcam').get(0),options).withFaceLandmarks().withFaceExpressions().withFaceDescriptors()       
      //context.clearRect(0, 0, canvas.width, canvas.height);
      _this.face_detection.$canvas.get(0).getContext('2d').clearRect(0, 0, _this.face_detection.$canvas.get(0).width, _this.face_detection.$canvas.get(0).height);
      if (detection.length){
		console.log(detection)
		//detection.forEach(function(fd){
		 // var bestMatch = new faceapi.FaceMatcher(fd.descriptor)  
		 // console.log(bestMatch.toString())
		//})
		const resizedResults = faceapi.resizeResults(detection, $('#webcam').get(0))
		console.log("draw")
		faceapi.draw.drawDetections(_this.face_detection.$canvas.get(0), resizedResults,0.05)
		faceapi.draw.drawFaceExpressions(_this.face_detection.$canvas.get(0), resizedResults,0.05)
	  }else{
		console.log("no results")
	  }
		  //const faceDescriptors = [detection.descriptor]
		  //faceapi.draw.drawDetections(canvas,detection)
		  //console.log(detection)
		  
	}

	console.log("load face api models")
	path = '/'
    path = '/models/'
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
		$('#face_detection_button').removeClass('disabled')
		
	})
	
	console.log("load motion detection")
	$('#videoContainer').motionDetection({
		$canvas : $("#motion_overlay"),
		$source : $("#webcam")
		
	});
	
	//console.log("load a2c")
	//var a2c = actor_critic()
	/*
	var $canvas = $('#rgb_canvas')
	var $rgb = $('#rgb')
	var canvas =$canvas.get(0)
	var ctx = canvas.getContext('2d')
	ctx.drawImage($rgb.get(0), 0, 0, canvas.width, canvas.height);
	console.log(ctx.getImageData(0, 0, canvas.width, canvas.height))
	*/
	/*
const options = {
    gridSize: {
        x: 16*2,
        y: 12*2,
    },
    debug: true,
    pixelDiffThreshold: 0.3,
    movementThreshold: 0.0012,
    fps: 30,
    canvasOutputElem: document.getElementById('dest')
}

var overlay = document.getElementById('overlay');
const ctx = overlay.getContext('2d');
let timeoutClear;

const md = new MotionDetect('src', options);

// on motion detected, draw grid
md.onDetect((other, data) => {
    clearTimeout(timeoutClear);

    const canvas = ctx.canvas;
    canvas.width = other.canvas.width;
    canvas.height = other.canvas.height;

    ctx.save();
    const grid = data.motions;
    const gs = data.gd.size;
    const cs = data.gd.cellSize;
    const csActualRatio = data.gd.actualCellSizeRatio;

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

    ctx.restore();

    timeoutClear = setTimeout(()=>{
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }, 1000);
   csActualRatio
    
}) */

}

$(init())

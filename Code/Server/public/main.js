var _this;
var init = function(){
	_this = {
		face_detection :{
			$canvas : $('#face_overlay')
		},
		COMMAND : {
		    CMD_MOVE_STOP : "CMD_MOVE_STOP",
			CMD_MOVE_FORWARD : "CMD_MOVE_FORWARD" ,
			CMD_MOVE_BACKWARD : "CMD_MOVE_BACKWARD",
			CMD_MOVE_LEFT : "CMD_MOVE_LEFT",
			CMD_MOVE_RIGHT : "CMD_MOVE_RIGHT",
			CMD_TURN_LEFT : "CMD_TURN_LEFT",
			CMD_TURN_RIGHT : "CMD_TURN_RIGHT",
			CMD_BUZZER : "CMD_BUZZER",
			CMD_LED_MOD : "CMD_LED_MOD",
			CMD_LED : "CMD_LED",
			CMD_BALANCE : "CMD_BALANCE",
			CMD_SONIC : "CMD_SONIC",
			CMD_HEIGHT : "CMD_HEIGHT",
			CMD_HORIZON : "CMD_HORIZON",
			CMD_HEAD : "CMD_HEAD",
			CMD_CALIBRATION : "CMD_CALIBRATION",
			CMD_POWER : "CMD_POWER",
			CMD_ATTITUDE : "CMD_ATTITUDE",
			CMD_RELAX : "CMD_RELAX",
			CMD_WORKING_TIME : "CMD_WORKING_TIME"	
			
		},
		joy_move : {
			x :0,
			y : 0,
			diagonal : {},
			ratio : 3,
			sensitivity : 33
		},
		joy_attitude : {
			x :0,
			y:0
		},
		follow : {
			flag : false
		}
	};
	var url = "http://" + document.domain + ":" + location.port;
	_this.socket = io.connect(url + "/robot");
	//var canvas = $('#webcam_overlay').get(0)
    //var context = canvas.getContext('2d')  
    
	$('html').on('click','.cmd',function(){
			console.log("click emit")
			_this.socket.emit('cmd',  $(this).data('cmd')) // {'episodes': $('#episodes').val() , });
	})
	$('html').on('click','#follow',function(){
		if (_this.follow.flag==true){
			$(this).removeClass('active')
			
		}else{
			$(this).addClass('active')
		}
	})
	/*
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
	*/
	// Create JoyStick object into the DIV 'joy1Div'
	console.log("init Joystick")
	var JoyMove = new JoyStick('joyMove',{
		title: "joystickMove", 
		internalFillColor :"#818181",
		internalStrokeColor : "#818181",
		externalStrokeColor  : "#818181"
		});

	// https://github.com/bobboteck/JoyStick
	var joy1IinputPosX = document.getElementById("joy1PosizioneX");
	var joy1InputPosY = document.getElementById("joy1PosizioneY");
	var joy1Direzione = document.getElementById("joy1Direzione");
	var joy1X = document.getElementById("joy1X");
	var joy1Y = document.getElementById("joy1Y");
	
	setInterval(function(){
		var cmdArray = []
		//var cmdArray = ['CMD_WORKING_TIME','']
		var x = JoyMove.GetX();
		var y = JoyMove.GetY();
		if ((Math.abs(x-_this.joy_move.x)>_this.joy_move.sensitivity || Math.abs(y-_this.joy_move.y)>_this.joy_move.sensitivity)
			|| (x==0 && y==0 && (x!=_this.joy_move.x || y!=_this.joy_move.y)) ){
			// console.log("clear Interval",x,y,Math.abs(x)-0<sensitivity,Math.abs(y)<sensitivity)
			clearInterval(_this.joy_move.diagonal.interval)
			// stop line command position to be reviewed
			// cmdArray.push(_this.COMMAND.CMD_MOVE_STOP + "#8")
			// delete _this.joy_move.diagonal.interval
			_this.joy_move.diagonal.flag = false
			// console.log(x,y);
			if (Math.abs(x)-0<_this.joy_move.sensitivity && Math.abs(y)-0<_this.joy_move.sensitivity){

				// cmdArray.push(_this.COMMAND.CMD_MOVE_STOP + "#8")
				_this.socket.emit('cmd',  cmdArray)
			}else if (y>0 && Math.abs(x)-_this.joy_move.sensitivity<0){
				cmdArray.push(_this.COMMAND.CMD_MOVE_FORWARD + "#" + parseInt(y/_this.joy_move.ratio))
				_this.socket.emit('cmd',  cmdArray)
			}
			else if (y<0 && Math.abs(x)-_this.joy_move.sensitivity<0){
				// _this.socket.emit('cmd',  _this.COMMAND.CMD_MOVE_BACKWARD & "#" & -x)
				cmdArray.push(_this.COMMAND.CMD_MOVE_BACKWARD + "#" + parseInt(-y/_this.joy_move.ratio))
				_this.socket.emit('cmd',  cmdArray)
			}
			else if (x>0 && Math.abs(y)-_this.joy_move.sensitivity<0){
				cmdArray.push(_this.COMMAND.CMD_TURN_RIGHT + "#" + parseInt(x/_this.joy_move.ratio))
				_this.socket.emit('cmd',  cmdArray)
			}
			else if (x<0 && Math.abs(y)-_this.joy_move.sensitivity<0){
				// _this.socket.emit('cmd',  _this.COMMAND.CMD_MOVE_BACKWARD & "#" & -x)
				cmdArray.push(_this.COMMAND.CMD_TURN_LEFT + "#" + parseInt(-x/_this.joy_move.ratio))
				_this.socket.emit('cmd',  cmdArray)
			}else{
				// console.log("MIXED COMMAND")
				// _this.joy_move.diagonal.flag = true
				// diagonalJoy(x,y)
			}
			console.log("send CMD",cmdArray)
			_this.socket.emit('cmd',  cmdArray)
			_this.joy_move.x = x
			_this.joy_move.y = y
		}
		
	
	}, 250);
	
	function diagonalJoy(x,y){
		if (!_this.joy_move.diagonal.current){
			_this.joy_move.diagonal.current = "x"	
		}
		console.log("mix job")
		
		var cmdArrayD = [];
		var cmdArray = [];
		if (_this.joy_move.diagonal.current=='x'){
			_this.joy_move.diagonal.current = "y"
			_this.joy_move.diagonal.time = 2000
			//cmdArray.push(_this.COMMAND.CMD_MOVE_STOP + "#8")
			if (y>0){
				cmdArrayD.push(_this.COMMAND.CMD_MOVE_FORWARD + "#" + parseInt(y/_this.joy_move.ratio))
			}else if (y<0){
				cmdArrayD.push(_this.COMMAND.CMD_MOVE_BACKWARD + "#" + parseInt(y/_this.joy_move.ratio))
			}
		}else{
			_this.joy_move.diagonal.current = "x"
			_this.joy_move.diagonal.time = 1000
			if ((x>0 && y>0) || (x>0 && y>0)){
				cmdArrayD.push(_this.COMMAND.CMD_TURN_RIGHT + "#" + parseInt(x/_this.joy_move.ratio))
			}else if ((x<0 && y>0) || (x<0 && y<0)){
				cmdArrayD.push(_this.COMMAND.CMD_TURN_LEFT + "#" + parseInt(-x/_this.joy_move.ratio))
			}
		}
		_this.socket.emit('cmd', cmdArrayD)
		if (_this.joy_move.diagonal.flag==true){
			setTimeout(function(){
				diagonalJoy(x,y)
			},_this.joy_move.diagonal.time)
		}
		
	}
	// setInterval(function(){ joy1IinputPosX.value=Joy1.GetPosX(); }, 50);
	// setInterval(function(){ joy1InputPosY.value=Joy1.GetPosY(); }, 50);
	// setInterval(function(){ joy1Direzione.value=Joy1.GetDir(); }, 50);
	// setInterval(function(){ joy1X.value=Joy1.GetX(); }, 50);
	// setInterval(function(){ joy1Y.value=Joy1.GetY(); }, 50);

	// Create JoyStick object into the DIV 'joy2Div'

	var JoyAttitude = new JoyStick('joyAttitude', { 
		title: "joystickAttitude", 
		autoReturnToCenter: true ,
		internalFillColor :"#818181",
		internalStrokeColor : "#818181",
		externalStrokeColor  : "#818181"
	});
	setInterval(function(){
		var x = JoyAttitude.GetX();
		var y = JoyAttitude.GetY();
		if ((x!=0 && y!=0) || x!=_this.joy_attitude.x || _this.joy_attitude.y!=y){
			cmdArrayD = []
			console.log(x,y)
			cmdArrayD.push(_this.COMMAND.CMD_ATTITUDE + '#0#' + parseInt(-y/5) + '#' + parseInt(x/5))
			console.log(cmdArrayD)
			_this.socket.emit('cmd', cmdArrayD)
			
			
		}
		_this.joy_attitude.x = x
		_this.joy_attitude.y = y
			
		
	},250)

	var JoyHead = new JoyStick('joyHead',{  
		autoReturnToCenter: true ,
		title: "joystickHead", 
		internalFillColor :"#818181",
		internalStrokeColor : "#818181",
		externalStrokeColor  : "#818181"
	});
	/*
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
	*/
	console.log("init face detection")
	_this.faceDetctor = $('#face_detection_button').faceDetection({})
	
	console.log("init motion detection")
	$('#motion_detection_button').motionDetection({
		$canvas : $("#motion_overlay"),
		$source : $("#webcam")
	});
	
	
}

$(init())

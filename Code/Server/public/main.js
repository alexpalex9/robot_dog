// head 50 to 180 CMD_HEAD


var _this;
var init = function(){
	console.log("DOM ready, launch init")
	_this = {
		servos : {
			state : {}
		},
		face_detection :{
			$canvas : $('#face_overlay')
		},
		motionDetctor : {
			
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
			ratio : 4,
			sensitivity : 20
		},
		joy_attitude : {
			x :0,
			y:0
		},
		joy_head : {
			x :0,
			y:0,
			maxAngle:180,
			minAngle:45,
			sensitivity : 5
		},
		sonar : {
			pollingFrequency : 100
		},
		gyro : {},
		follow : {
			flag : false
		},
		a2c : {
			active : false
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
	if ($('#joyMove').length>0){
	
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
				cmdArray.push(_this.COMMAND.CMD_MOVE_STOP + "#8")
				// delete _this.joy_move.diagonal.interval
				// _this.joy_move.diagonal.flag = false
				// console.log(x,y);
				if (Math.abs(x)-0<_this.joy_move.sensitivity && Math.abs(y)-0<_this.joy_move.sensitivity){

					// cmdArray.push(_this.COMMAND.CMD_MOVE_STOP + "#8")
					// _this.socket.emit('cmd',  cmdArray)
				}else if (y>0 && Math.abs(x)-_this.joy_move.sensitivity<0){
					cmdArray.push(_this.COMMAND.CMD_MOVE_FORWARD + "#" + parseInt(y/_this.joy_move.ratio))
					// _this.socket.emit('cmd',  cmdArray)
				}
				else if (y<0 && Math.abs(x)-_this.joy_move.sensitivity<0){
					// _this.socket.emit('cmd',  _this.COMMAND.CMD_MOVE_BACKWARD & "#" & -x)
					cmdArray.push(_this.COMMAND.CMD_MOVE_BACKWARD + "#" + parseInt(-y/_this.joy_move.ratio))
					// _this.socket.emit('cmd',  cmdArray)
				}
				else if (x>0 && Math.abs(y)-_this.joy_move.sensitivity<0){
					cmdArray.push(_this.COMMAND.CMD_TURN_RIGHT + "#" + parseInt(x/_this.joy_move.ratio))
					// _this.socket.emit('cmd',  cmdArray)
				}
				else if (x<0 && Math.abs(y)-_this.joy_move.sensitivity<0){
					// _this.socket.emit('cmd',  _this.COMMAND.CMD_MOVE_BACKWARD & "#" & -x)
					cmdArray.push(_this.COMMAND.CMD_TURN_LEFT + "#" + parseInt(-x/_this.joy_move.ratio))
					// _this.socket.emit('cmd',  cmdArray)
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
	}
	
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

	
	if ($('#joyAttitude').length>0){
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
	}
	
	if ($('#joyHead').length>0){
		var JoyHead = new JoyStick('joyHead',{  
			autoReturnToCenter: true ,
			title: "joystickHead", 
			internalFillColor :"#818181",
			internalStrokeColor : "#818181",
			externalStrokeColor  : "#818181"
		});
		_this.joy_head.a = (_this.joy_head.maxAngle - _this.joy_head.minAngle)/200
		_this.joy_head.b = _this.joy_head.maxAngle/2 + _this.joy_head.minAngle/2 
					
		setInterval(function(){
			var x = JoyHead.GetX();
			var y = JoyHead.GetY();
			if ((Math.abs(x-_this.joy_head.x)>_this.joy_head.sensitivity || Math.abs(y-_this.joy_head.y)>_this.joy_head.sensitivity)){
				cmdArray = []
				// if (Math.abs(x)-0<_this.joy_head.sensitivity && Math.abs(y)-0<_this.joy_head.sensitivity){
					
					
				// }else if ((y>0 || y<0 ) && Math.abs(x)-_this.joy_head.sensitivity<0){
					var value = parseInt(y * _this.joy_head.a + _this.joy_head.b)
					cmdArray.push(_this.COMMAND.CMD_HEAD + "#" + value)
				// }else if ((x>0 || x<0 ) && Math.abs(y)-_this.joy_head.sensitivity<0){
					cmdArray.push(_this.COMMAND.CMD_ATTITUDE + '#0#0#' + parseInt(x/5))
				// }
				console.log(cmdArray)
				_this.socket.emit('cmd', cmdArray)
			}
			_this.joy_head.x = x
			_this.joy_head.y = y				
		},250)
	}
	


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
	// $("#webcam").one("load", function() {
	// var webcamerror = function(elemt){
		// $(elemt).attr("src", "/images/dog_client.png");
	// }
	
	
	$(window).on("resize",function(){
		console.log("windows resized")
		if (_this.motionDetctor!=undefined){
		if (_this.motionDetctor.init!=undefined){
			_this.motionDetctor.init()
		}
		}
		if (_this.faceDetctor!=undefined){
		if (_this.faceDetctor.init!=undefined){
			_this.faceDetctor.init()
		}
		}
	})


	$("#sonar_button").on('click',function(){
		// var $this = this
		// console.log($(this).hasClass('active'))
		
		if(!$(this).hasClass("disabled")){
			if($(this).hasClass("active")){
				$(this).removeClass("active")
				clearInterval(_this.sonar.job)
				$("#sonar_button").html("Sonic")
			}else{
				$(this).addClass("active")
				_this.sonar.job = setInterval(function(){
					// console.log("emit sonic")
					_this.socket.emit('cmd', [_this.COMMAND.CMD_SONIC])
				},_this.sonar.pollingFrequency)	
			}
		}
		
	})
	_this.socket.on("sonic",function(data){
		// console.log("sonic",data)
		$("#sonar_button").html(data + " cm")
		_this.sonar.value = data
	})

	// _this.gyro.job = setInterval(function(){
		// _this.socket.emit('gyro')
	// },250)	
	// _this.socket.on("gyro",function(data){
		// _this.gyro.value = data
	// })
	
	$("#webcam").on("error", function() {
		console.log("webcam error")
		$(this).unbind("error").unbind("load").attr("src", "/images/dog_client.png");
	})
	
	$("#webcam").one("load", function() {
		console.log("init face detection")
		_this.faceDetctor = $('#face_detection_button').faceDetection({})
		
		console.log("init motion detection")
		_this.motionDetctor = $('#motion_detection_button').motionDetection({
			$canvas : $("#motion_overlay"),
			$source : $("#webcam")
		});
	})
	// $("#webcam").attr('src','stream.mjpg')
		// setInterval(function(){
		// _this.socket.emit('get state')
	// },250);
	_this.socket.on("servos angle",function(data){
		// console.log("receive servos anlge",data)
		_this.servos.state = data
		for (var s in data){
			// console.log("loop",$("#servo_" + s.toString()).length)
			$("#servo_" + s).attr("data-isTriggering","yes");
			$("#servo_" + s).val(data[s]).trigger('change');
			$("#servo_" + s).attr("data-isTriggering","no");
		}
					
		// console.log("state",data)
	});
	// _this.servos.setAngle = function(servo,angle){
		// data = {}
		// data[servo] = angle
		// $("#servo_"+ servo).val(angle).trigger('change');
		
		// _this.socket.emit('set servos angle', data)
	// };
	_this.servos.setAngles = function(data){
		_this.socket.emit('set servos angle', data)
	};
	var knobOptions = {		
		change: function (value) {
			// $('.mm-page.mm-slideout').addClass('nopan')
		},
		release: function (value) {
			// console.log("release, isTriggering?",$(this.$[0]).attr('data-isTriggering'))
			if ("yes"!=$(this.$[0]).attr('data-isTriggering')){
				// console.log("release knob")
				var cmd ={}
				cmd[$(this.$[0]).attr('data-servo')] = value
				// _this.socket.emit("set servos angle",cmd);
				_this.servos.setAngles(cmd)
			};
			$(this.$[0]).attr('data-v',value);
			$(this.$[0]).attr('data-isTriggering',"no");
		},
		cancel: function(){},
		draw: function () {},
		format : function(v){
			return v+'°'
		}
	}
	// knob:function(){	
	$(".knob").knob(knobOptions);
	// },
	// $("#servo_3").attr("data-isTriggering","yes");
	// $("#servo_3").val(45).trigger('change');
	// $("#servo_3").attr("data-isTriggering","no");
	
	$('git_pull').on('click',function(){
		_this.socket.emit('git pull', [_this.COMMAND.CMD_SONIC])
	})
	_this.socket.on('git pulled', function(data){
		console.log(data)
	})
}

$(init())

	

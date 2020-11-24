var init = function(){
	$('html').on('click','.cmd',function(){
		console.log("url =",'cmd?cmd=' + $(this).data('cmd') + '&value=' + $(this).data('v'))
		$.ajax({
			url : '/cmd&cmd=' + $(this).data('cmd') + '&value=' + $(this).data('v'),
			//url : '/cmd',
			type : 'GET',
			dataType : 'json', //'html',
			data : {
				cmd : $(this).data('cmd'),
				value : $(this).data('v')
				
			},
			timeout : 50000,		
			success : function (data, status) {
				console.log("success",data)
				console.log(typeof(data))
			},
			error: function(xhr,error) {
				console.log("error in ajax request",error)
			},
			complete:function(){
			}
		});
		
		
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

	setInterval(function(){ joy2IinputPosX.value=Joy2.GetPosX(); }, 50);
	setInterval(function(){ joy2InputPosY.value=Joy2.GetPosY(); }, 50);
	setInterval(function(){ joy2Direzione.value=Joy2.GetDir(); }, 50);
	setInterval(function(){ joy2X.value=Joy2.GetX(); }, 50);
	setInterval(function(){ joy2Y.value=Joy2.GetY(); }, 50);

	// var joy3Param = { "title": "joystick3" };
	// var Joy3 = new JoyStick('joy3Div', joy3Param);

	// var joy3IinputPosX = document.getElementById("joy3PosizioneX");
	// var joy3InputPosY = document.getElementById("joy3PosizioneY");
	// var joy3Direzione = document.getElementById("joy3Direzione");
	// var joy3X = document.getElementById("joy3X");
	// var joy3Y = document.getElementById("joy3Y");

	// setInterval(function(){ joy3IinputPosX.value=Joy3.GetPosX(); }, 50);
	// setInterval(function(){ joy3InputPosY.value=Joy3.GetPosY(); }, 50);
	// setInterval(function(){ joy3Direzione.value=Joy3.GetDir(); }, 50);
	// setInterval(function(){ joy3X.value=Joy3.GetX(); }, 50);
	// setInterval(function(){ joy3Y.value=Joy3.GetY(); }, 50);


}

$(init())

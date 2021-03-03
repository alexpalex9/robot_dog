class Environment
{

	constructor(depth,SERVOS) {

		// this.use_gyro = use_gyro
		this.depth = depth
		console.log("DEPTH ENV",depth)
		// this.SERVOS = [
			// {'name':2,'init':0,'used':false},
			// {'name':3,'init':80,'used':true,'min':70,'max':90,'step':10,'actions':[60,80,100]},
			// {'name':4,'init':90,'used':false},
			// {'name':5,'init':0,'used':false},
			// {'name':6,'init':87,'used':true,'min':90,'max':110,'step':10,'actions':[67,87,107]},
			// {'name':7,'init':90,'used':false},
			// {'name':8,'init':90,'used':false},
			// {'name':9,'init':87,'used':true,'min':77,'max':97,'step':10,'actions':[67,87,107]},
			// {'name':10,'init':180,'used':false},
			// {'name':11,'init':90,'used':false},
			// {'name':12,'init':90,'used':true,'min':80,'max':100,'step':10,'actions':[70,90,110]},
			// {'name':13,'init':180,'used':false},
			// {'name':15,'init':90,'used':false,'label':'head'},
		// ]
		
		this.SERVOS = SERVOS
		this.AMOUNT_INPUTS = 0
		this.actions_index = []
		this.servos_walk = [];
		// this.actions_labels = []
		for (var i in this.SERVOS){
			if (this.SERVOS[i].used==true){
				
				this.SERVOS[i]['actions_labels'] = []
				this.SERVOS[i]['actions_index']= []
				this.AMOUNT_INPUTS = this.AMOUNT_INPUTS + 1
				for (var act in this.SERVOS[i].actions){
					this.SERVOS[i].actions_index.push({'servo':this.SERVOS[i].name,'angle':this.SERVOS[i].actions[act]})
					this.SERVOS[i].actions_labels.push(this.SERVOS[i].name + '-'+ this.SERVOS[i].actions[act])
				}
				this.servos_walk.push(this.SERVOS[i])
			}
		}

		this.servos_object = {}
		this.initial_servos_state = {}
		
		
		for (var s in this.SERVOS){
			this.initial_servos_state[this.SERVOS[s].name] = this.SERVOS[s]['init']
			if (this.SERVOS[s]['used']==true){
				this.servos_object[this.SERVOS[s].name] = {}
				this.servos_object[this.SERVOS[s].name]['state'] = this.SERVOS[s]['init']
				this.servos_object[this.SERVOS[s].name]['scale_a'] = 1 / (this.SERVOS[s].actions[this.SERVOS[s].actions.length-1] - this.SERVOS[s].actions[0])
				this.servos_object[this.SERVOS[s].name]['scale_b'] = - this.SERVOS[s].actions[0] * this.servos_object[this.SERVOS[s].name]['scale_a']
				
				// make closure below?
				// var _thistemp = this;
				// this.servos_object[servos[s].name].scale = function(state){
						// return (function(a,b){
						// console.log(state,a,b)
						// return state * a + b
					// })(_thistemp.servos_object[servos[s].name]['scale_a'],_thistemp.servos_object[servos[s].name]['scale_b'])
				// }
				
				// console.log("TEST TEST TEST",this.servos_object[servos[s].name].scale(90))	
			}
		}	
		// if (use_gyro==true){
			// this.AMOUNT_INPUTS = this.AMOUNT_INPUTS + 3 ;
		// }
		console.log("this.servos_walk",this.servos_walk)
	}
	get_servos_count(){
		return this.servos_walk.length
	}		
	get_actions_label(i){
		return this.servos_walk[i].actions_labels
	}
	get_actions_count(i){
		// console.log(this.servos_walk[i].actions_index)
		return this.servos_walk[i].actions_index.length
	}
	get_inputs_count(){
		return this.AMOUNT_INPUTS
	}	
	isDone = function(){
		// console.log("this.sonic_state",this.sonic_state)
		return (this.sonic_state<5 || this.sonic_state>50)
	}
	
	getState = function(){
		var states = []
		for (var s in this.statesA_scaled){
			states = states.concat(this.statesA_scaled[s])
		}
		
		
		return states 
	}
	getReward = function(){
		return this.reward
	}
	
	
	init = async function () {
		console.log("INIT environment - started")
		// this.servos_actions = servos_actions

	
		await this.SetServosAngles(this.initial_servos_state)
		
		// console.log("INIT",this.servos_object)
		var statesA = []
		var statesA_scaled = []
		for (var s in this.servos_object){
			statesA.push([])
			statesA_scaled.push([])
			for (var d=0;d<this.depth;d++){
				statesA[statesA.length-1].push(this.servos_object[s]['state'])
				statesA_scaled[statesA_scaled.length-1].push(this.servos_scale_sate(s,this.servos_object[s]['state']))
			}
			
		}
		// console.log("STATES  INIT",statesA)
		// console.log("STATES SCALED INIT",statesA_scaled)
		
		this.sonic_state  = await this.Sonic();
		this.initial_distance = this.sonic_state 
		this.last_distance = this.sonic_state
		// console.log(gyro)
		
		// console.log(statesA)
		
		// if (this.use_gyro==true){
			// var gyro_state = await this.Gyro();
			// for (var g in gyro_state){
				// statesA.push([])
				// statesA_scaled.push([])
				// for (var d=0;d<this.depth;d++){
					// statesA[statesA.length-1].push(gyro_state[g])
					// statesA_scaled[statesA_scaled.length-1].push(gyro_state[g]/100)
				// }
				
			// }
			
		// }else{
			// var gyro_state = {'x':0,'y':0,'z':0}
		// }
		// console.log(gyro_state,statesA,statesA_scaled)
		$("#reset_button").removeClass('active')
		
		this.statesA = statesA
		this.statesA_scaled = statesA_scaled
		this.reward = 0
		// console.log("INIT environment - finished")
		// return  {
			// gyro_state : gyro_state,
			// state : statesA,
			// state_scaled : statesA_scaled
		// }
		
	}

	


	servos_scale_sate = function(servo,state){
		// console.log("servos_scale_sate",state,servo,this.servos_object)
		return state * this.servos_object[servo].scale_a + this.servos_object[servo].scale_b
	}
	
	Sonic = function(timeout = 10000) {
		return new Promise((resolve, reject) => {
			let timer;
			_this.socket.emit('cmd', [_this.COMMAND.CMD_SONIC])
			function responseHandler(message) {
				// resolve promise with the value we got
				resolve(message);
				clearTimeout(timer);
			}

			_this.socket.once('sonic', responseHandler); 

			// set timeout so if a response is not received within a 
			// reasonable amount of time, the promise will reject
			timer = setTimeout(() => {
				reject(new Error("timeout waiting for msg"));
				socket.removeListener('sonic await', responseHandler);
			}, timeout);

		});
	}
		
	SetServosAngles = function(data,timeout = 10000) {
		return new Promise((resolve, reject) => {
			let timer;
			_this.socket.emit('set servos angle',data)
			function responseHandler(message) {
				// console.log("SERVOS ANGLE SET")
				resolve(message);
				
				// for (var s in message){
					// $("#servo_" + s).attr("data-isTriggering","yes");
					// $("#servo_" + s).val(message[s]).trigger('change');
					// $("#servo_" + s).attr("data-isTriggering","no");	
					
				// }
				clearTimeout(timer);
			}

			_this.socket.once('servos angle await', responseHandler); 
			
			// set timeout so if a response is not received within a 
			// reasonable amount of time, the promise will reject
			timer = setTimeout(() => {
				reject(new Error("timeout waiting for msg"));
				socket.removeListener('servos angle', responseHandler);
			}, timeout);

		});
	}	
	Gyro = function(timeout = 10000) {
		return new Promise((resolve, reject) => {
			let timer;
			_this.socket.emit('gyro')
			function responseHandler(message) {
				resolve(message);
				clearTimeout(timer);
			}

			_this.socket.once('gyro', responseHandler); 

			// set timeout so if a response is not received within a 
			// reasonable amount of time, the promise will reject
			timer = setTimeout(() => {
				reject(new Error("timeout waiting for msg"));
				socket.removeListener('gyro await', responseHandler);
			}, timeout);

		});
	}
		
	step = async function(actions_index) {//,state,state_scaled,incremental){
		// console.log("step, action = ",action)
		// console.log("step, state = ",state)
		// console.log("step, action = ",action_index,this.actions_index)
		var actions_angle = {}
		for (var a in actions_index){
			var action_index = actions_index[a]
			var action = this.servos_walk[a].actions_index[action_index]
			var l = this.statesA[0].length - 1
			// next_stateA = Array.from(state);
			var next_stateA = [];
			var next_stateA_scaled = [];
			
			// var new_angle = {}
			// for (var s in state){
			var s = 0
			

				actions_angle[action.servo] =  action.angle
				this.servos_object[action.servo]['state'] = action.angle

			for (var servo in this.servos_object){
				next_stateA.push(Array.from(this.statesA[s]));
				next_stateA_scaled.push(Array.from(this.statesA_scaled[s]));
				// console.log("servo",next_stateA,next_stateA_scaled)
				next_stateA[s] = next_stateA[s].slice(1)
				next_stateA_scaled[s] = next_stateA_scaled[s].slice(1)
				
				if (servo==action.servo){
					next_stateA[s].push(action.angle)
					// console.log("pushing next state",servo,s,action.angle,this.servos_scale_sate(action.servo,action.angle))
					next_stateA_scaled[s].push(this.servos_scale_sate(action.servo,action.angle))
				}else{
					
					// console.log("no action, pushing at i=",next_stateA[s].length-1,next_stateA[s])
					var last_item = next_stateA[s][next_stateA[s].length-1]
					var last_item_scaled = next_stateA_scaled[s][next_stateA_scaled[s].length-1]
					// next_stateA[s].push(next_stateA[s][next_stateA[s].length-1])
					next_stateA[s].push(last_item)
					 
					// console.log("pushing result",next_stateA[s].length-1,next_stateA[s])
					// next_stateA_scaled[s].push(next_stateA_scaled[s][next_stateA_scaled[s].length-1])
					next_stateA_scaled[s].push(last_item_scaled)
					
				}
				
				// new_angle[servo] = st
				
				s = s +1
			}
		}
		console.log("ACTIONS",actions_angle)
		await this.SetServosAngles(actions_angle)
		
		// if (this.use_gyro==true){
			// var gyro_state = await this.Gyro();
			
			
			// for (var dim in gyro_state){

				
				// next_stateA.push(Array.from(this.statesA[s]));
				// next_stateA_scaled.push(Array.from(this.state_scaled[s]));
				
				// next_stateA[s] = next_stateA[s].slice(1)
				// next_stateAA_scaled[s] = next_stateAA_scaled[s].slice(1)
				
				// var st = gyro_state[dim]
				// next_stateA[s].push(st)
				// next_stateA_scaled[s].push(st/100)
				// s = s + 1
			// }
		// }else{
			// var gyro_state = {'x':0,'y':0,'z':0}
		// }
		
		this.sonic_state = await this.Sonic();
		// var distance_change	 = (sonic_state - 50 )/ 100
		if (!this.last_distance){
			this.last_distance = this.sonic_state 
		}
		
		this.statesA = next_stateA
		this.statesA_scaled = next_stateA_scaled
		var improvement = this.last_distance - this.sonic_state
		// if (improvement>0){
			this.reward = improvement / 5
		// }else{
			// this.reward = 0
		// }
		
		this.last_distance = this.sonic_state
	}
	
}
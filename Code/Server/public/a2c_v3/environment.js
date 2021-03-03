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
					this.SERVOS[i].actions_index.push({'servo':this.SERVOS[i].name,'angle':this.SERVOS[i].actions[act],'angle_scaled':(this.SERVOS[i].actions[act]-this.SERVOS[i].actions[0])/(this.SERVOS[i].actions[this.SERVOS[i].actions.length-1]-this.SERVOS[i].actions[0])})
					this.SERVOS[i].actions_labels.push(this.SERVOS[i].name + '-'+ this.SERVOS[i].actions[act])
					
					// this.SERVOS[i].actions_index_scaled.push(this.SERVOS[i].name + '-'+ this.SERVOS[i].actions[act])
				}
				this.SERVOS[i]['state'] = this.SERVOS[i]['init']
				this.servos_walk.push(this.SERVOS[i])
			}
		}
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
		for (var s in this.states_scaled){
			states = states.concat(this.states_scaled[s])
		}
		// console.log(states)
		
		return states 
	}
	getReward = function(){
		return this.reward
	}
	
	
	init = async function () {
		console.log("INIT environment - started")
		// this.servos_actions = servos_actions
	
	
		
		// console.log("this.servos_walk",this.servos_walk)
		// console.log("INIT",this.servos_object).
		var data = {}
		this.states = []
		this.states_scaled = []
		for (var s in this.SERVOS){
			data[s] = this.SERVOS[s]['state']	
		}
		for (var s in this.servos_walk){
			this.states.push([])
			this.states_scaled.push([])
			console.log("doing servo",s)
			
			for (var d=0;d<this.depth;d++){
				this.states[s].push(this.servos_walk[s]['state'])
				for (var a in this.servos_walk[s].actions_index){
					if (this.servos_walk[s].actions_index[a].angle==this.servos_walk[s]['state']){
						this.states_scaled[s].push(this.servos_walk[s].actions_index[a].angle_scaled)
					}
				}
				// this.states_scaled.push(this.servos_scale_sate(s,this.servos_object[s]['state']))
			}
		}
		
		// console.log("SET ANGLE",data)
		await this.SetServosAngles(data)
		
		console.log("STATES  INIT",this.states)
		console.log("STATES SCALED INIT",this.states_scaled)
		
		this.sonic_state  = await this.Sonic();
		this.initial_distance = this.sonic_state 
		this.last_distance = this.sonic_state

		$("#reset_button").removeClass('active')
		console.log("init state",this.states)
		console.log("init state",this.states_scaled)

		this.reward = 0

		
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
			console.log("action", a, action_index)
			var servo = this.servos_walk[a].actions_index[action_index].servo
			var angle = this.servos_walk[a].actions_index[action_index].angle
			var angle_scaled = this.servos_walk[a].actions_index[action_index].angle_scaled

			this.states[a] = this.states[a].slice(1)
			this.states_scaled[a] = this.states_scaled[a].slice(1)
			this.states[a].push(angle)
			this.states_scaled[a].push(angle_scaled)
			actions_angle[servo] = angle
			
		}
		console.log("ACTIONS",actions_angle,this.states,this.states_scaled)
		await this.SetServosAngles(actions_angle)

		this.sonic_state = await this.Sonic();
		// var distance_change	 = (sonic_state - 50 )/ 100
		if (!this.last_distance){
			this.last_distance = this.sonic_state 
		}		

		var improvement = this.last_distance - this.sonic_state
		this.reward = improvement / 5
		this.last_distance = this.sonic_state
	}
	
}
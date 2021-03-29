class Environment
{

	constructor(depth,SERVOS) {

		this.depth = depth		
		this.SERVOS = SERVOS
		this.AMOUNT_INPUTS = 0
		this.actions_index = []
		this.servos_walk = [];
		this.states_index = []
		for (var i in this.SERVOS){
			if (this.SERVOS[i].used==true){
				
				//this.SERVOS[i]['actions_labels'] = []
				//this.SERVOS[i]['actions_index']= []
				var this_state_index = []
				this.AMOUNT_INPUTS = this.AMOUNT_INPUTS + 1
				for (var act in this.SERVOS[i].actions){
					var angle_scaled = (this.SERVOS[i].actions[act]-this.SERVOS[i].actions[0])/(this.SERVOS[i].actions[this.SERVOS[i].actions.length-1]-this.SERVOS[i].actions[0])
					//this.SERVOS[i].actions_index.push({'servo':this.SERVOS[i].name,'angle':this.SERVOS[i].actions[act],'angle_scaled':angle_scaled})
					//this.SERVOS[i].actions_labels.push(this.SERVOS[i].name + '-'+ this.SERVOS[i].actions[act])
					this_state_index.push(1.0 * angle_scaled)
				}
				for (var d=0;d<this.depth;d++){
					this.states_index.push(this_state_index)
				}
					
				this.SERVOS[i]['state'] = this.SERVOS[i]['init']
				this.servos_walk.push(this.SERVOS[i])
			}
		}
		
	}
	get_angle_scaled(i,angle){		
		return (angle-this.servos_walk[i].min)/(this.servos_walk[i].max - this.servos_walk[i].min)
	}
	get_servos_count(){
		return this.servos_walk.length
	}		
	get_states_index(){
		return this.states_index
	}
	get_actions_servos_index(s){
		return this.servos_walk[s].actions_index
	}
	get_actions_index(){
		var actions_index = []
		for (var s in this.servos_walk){
			actions_index.push([])
			for (var a in this.servos_walk[s].actions_index){
				actions_index[s].push( a * 1.0)
			}
		}
		
		return actions_index
	}
	get_actions_count(){
		var numActions = 12
		// for (var s in this.servos_walk){
			// numActions += this.servos_walk[s].actions_index.length
		// }
		return numActions
	}
	get_inputs_count(){
		return this.AMOUNT_INPUTS * this.depth
	}	
	isDone = function(){
		return (this.sonic_state<5 || this.sonic_state>70)
	}
	
	getState = function(){
		var states = []
		for (var s in this.states_scaled){
			states = states.concat(this.states_scaled[s])
		}		
		return states 
	}
	getReward = function(){
		return this.reward
	}
	
	
	init = async function () {
		console.log("INIT environment - started")
		var data = {}
		this.states = []
		this.states_scaled = []
		for (var s in this.SERVOS){
			data[this.SERVOS[s].name] = this.SERVOS[s]['init']
		}
		for (var s in this.servos_walk){
			
			// data[this.servos_walk[s].name] = this.servos_walk[s]['init']
			this.servos_walk[s]['state'] = this.servos_walk[s]['init']			
			this.states.push([])
			this.states_scaled.push([])			
			for (var d=0;d<this.depth;d++){
				this.states[s].push(this.servos_walk[s]['state'])
				this.states_scaled[s].push(this.get_angle_scaled(s,this.servos_walk[s]['state']))
				// for (var a in this.servos_walk[s].actions_index){
					// if (this.servos_walk[s].actions_index[a].angle==this.servos_walk[s]['state']){
						// this.states_scaled[s].push(this.servos_walk[s].actions_index[a].angle_scaled)
					// }
				// }
			}
		}
		
		console.log("INI - SET ANGLE",data)
		await this.SetServosAngles(data)
		
		this.sonic_state  = await this.get_sonic();
		this.initial_distance = this.sonic_state 
		this.last_distance = this.sonic_state
		this.reward = 0
		console.log("INIT servo",this.servos_walk)
		console.log("INIT state",this.states_scaled)
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

  
	async get_sonic(){
		var sum = 0
		var item = 0
		for (var s = 0;s<3;s++){
			var son = await this.Sonic()
			if (son>3 && son <70){
				sum = son + sum
				item = item + 1
			}
		}
		return sum/item
		
	}
	step = async function(actions_index) {//,state,state_scaled,incremental){
		// console.log("step, action = ",action)
		// console.log("step, state = ",state)
		// console.log("step, action = ",action_index,this.actions_index)
		var previous_state = this.states
		var actions_angle = {}
		for (var a in actions_index){
			var action_index = actions_index[a]
			// console.log("action", a, action_index)

			//var servo = this.servos_walk[a].actions_index[action_index].servo
			var servo = this.servos_walk[a].name
			//var angle = this.servos_walk[a].actions_index[action_index].angle
			var new_angle = this.servos_walk[a].state
			if (action_index==0){
				new_angle = new_angle + this.servos_walk[a].step
			}else if (action_index==2){
				new_angle = new_angle - this.servos_walk[a].step
			}
			if (new_angle > this.servos_walk[a].max){
				new_angle = this.servos_walk[a].max
			}
			if (new_angle < this.servos_walk[a].min){
				new_angle = this.servos_walk[a].min
			}
			
			var new_angle_scaled = this.get_angle_scaled(a,new_angle)

			this.states[a] = this.states[a].slice(1)
			this.states_scaled[a] = this.states_scaled[a].slice(1)
			this.states[a].push(new_angle)
			this.states_scaled[a].push(new_angle_scaled)
			actions_angle[servo] = new_angle
			
		}
		// console.log("ACTIONS",actions_angle,this.states,this.states_scaled)
		await this.SetServosAngles(actions_angle)

		// this.sonic_state = await this.get_sonic();
		this.sonic_state = await this.get_sonic();
		var improvement = this.last_distance - this.sonic_state
		this.reward = improvement / 5
		this.last_distance = this.sonic_state
		
		var hasmoved = 0
		for (var s in this.states){
			hasmoved = hasmoved + this.states[s][0] - previous_state[s][0]
			
		}
		return hasmoved!=0
		

	}
}
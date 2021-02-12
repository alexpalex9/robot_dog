// A2C in node : https://naifmehanna.com/2019-02-01-implementing-a2c-algorithm-using-tensorflow-js/
// some code in github https://github.com/naifmeh/smartbotjs/blob/remotecrawlers/utils/math_utils.js
// tf.js tutorials : https://www.tensorflow.org/js/tutorials
 
 // pi 4 leg : https://sebastianfoerster86.wordpress.com/2016/11/07/robot-controlled-by-artificial-neural-network/ 
 
 
 // https://github.com/naifmeh/smartbotjs/blob/remotecrawlers/algorithm/environment.js


function randomChoice(p) {
    let rnd = p.reduce( (a, b) => a + b ) * Math.random();
    return p.findIndex( a => (rnd -= a) < 0 );
}

function randomChoices(p, count) {
    return Array.from(Array(count), randomChoice.bind(null, p));
}

//let result = randomChoices([0.1, 0, 0.3, 0.6, 0], 3);

function Environment(depth,use_gyro) {

	this.use_gyro = use_gyro
	this.depth = depth

	this.SERVOS = [
		{'name':2,'init':0,'used':false},
		{'name':3,'init':80,'used':true,'min':70,'max':90,'step':10,'actions':[65,80,95]},
		{'name':4,'init':85,'used':false},
		{'name':5,'init':0,'used':false},
		{'name':6,'init':100,'used':true,'min':90,'max':110,'step':10,'actions':[85,100,115]},
		{'name':7,'init':85,'used':false},
		{'name':8,'init':95,'used':false},
		{'name':9,'init':80,'used':true,'min':70,'max':90,'step':10,'actions':[65,80,95]},
		{'name':10,'init':180,'used':false},
		{'name':11,'init':95,'used':false},
		{'name':12,'init':90,'used':true,'min':80,'max':100,'step':10,'actions':[75,90,105]},
		{'name':13,'init':180,'used':false},
		{'name':15,'init':90,'used':false,'label':'head'},
	]
	this.AMOUNT_INPUTS = 0
	this.actions_index = []
	this.servos_walk = [];
	for (var i in this.SERVOS){
		if (this.SERVOS[i].used==true){
			this.servos_walk.push(this.SERVOS[i])
			this.AMOUNT_INPUTS = this.AMOUNT_INPUTS + 1
			for (var act in this.SERVOS[i].actions){
				this.actions_index.push({'servo':this.SERVOS[i].name,'angle':this.SERVOS[i].actions[act],'index':this.actions_index.length})
			}
		}
	}
	
	
	if (use_gyro==true){
		this.AMOUNT_INPUTS = this.AMOUNT_INPUTS + 3 ;
	}
		
	
	this.getData = function(){
		return {
			AMOUNT_INPUTS : this.AMOUNT_INPUTS,
			ACTION_INDEX : this.actions_index,
			SERVO_WALK : this.servos_walk
		}
	}
	
	this.reset = async function(){
		var sonic_state = await this.Sonic();
		this.initial_distance = sonic_state
		console.log("Reset done, new initial distance is",this.initial_distance)
	}
	this.init = async function () {
		
		// this.servos_actions = servos_actions
		this.servos_object = {}
		var initial_servos_state = {}
		
		for (var s in this.SERVOS){
			initial_servos_state[this.SERVOS[s].name] = this.SERVOS[s]['init']
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
	
		await this.SetServosAngles(initial_servos_state)
		
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
		
		
		var sonic_state = await this.Sonic();
		this.initial_distance = sonic_state
		// console.log(gyro)
		
		// console.log(statesA)
		
		if (this.use_gyro==true){
			var gyro_state = await this.Gyro();
			for (var g in gyro_state){
				statesA.push([])
				statesA_scaled.push([])
				for (var d=0;d<this.depth;d++){
					statesA[statesA.length-1].push(gyro_state[g])
					statesA_scaled[statesA_scaled.length-1].push(gyro_state[g]/100)
				}
				
			}
			
		}else{
			var gyro_state = {'x':0,'y':0,'z':0}
		}
		// console.log(gyro_state,statesA,statesA_scaled)
		// console.log("STATES",statesA)
		return  {
			gyro_state : gyro_state,
			state : statesA,
			state_scaled : statesA_scaled
		}
		
	}




	this.servos_scale_sate = function(servo,state){
		// console.log("servos_scale_sate",state,servo,this.servos_object)
		return state * this.servos_object[servo].scale_a + this.servos_object[servo].scale_b
	}
	
	this.Sonic = function(timeout = 10000) {
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
					socket.removeListener('sonic', responseHandler);
				}, timeout);

			});
		}
		
	this.SetServosAngles = function(data,timeout = 10000) {
		return new Promise((resolve, reject) => {
			let timer;
			_this.socket.emit('set servos angle',data)
			function responseHandler(message) {
				resolve(message);
				clearTimeout(timer);
			}

			_this.socket.once('servos angle', responseHandler); 

			// set timeout so if a response is not received within a 
			// reasonable amount of time, the promise will reject
			timer = setTimeout(() => {
				reject(new Error("timeout waiting for msg"));
				socket.removeListener('servos angle', responseHandler);
			}, timeout);

		});
	}	
	this.Gyro = function(timeout = 10000) {
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
				socket.removeListener('gyro', responseHandler);
			}, timeout);

		});
	}
		
	this.step = async function(state,action,state_scaled,incremental){
		// console.log("step, action = ",action)
		// console.log("step, state = ",state)
		// console.log("step, action = "state,action,state_scaled)
		var l = state[0].length - 1
		// next_state = Array.from(state);
		var next_state = [];
		var next_state_scaled = [];
		
		// var new_angle = {}
		// for (var s in state){
		var s = 0
		var action_angle = {}
		
		
			
			
			// if (incremental){
				
				// var act_angle = action[servo] *  this.servos_object[servo]['step']  + this.servos_object[servo]['state']
				// console.log(servo,act_angle)
				// if (act_angle > this.servos_object[servo]['max']){
					// act_angle = this.servos_object[servo]['max']
				// }
				// if (act_angle < this.servos_object[servo]['min']){
					// act_angle = this.servos_object[servo]['min']
				// }
			// }else{
				// var act_angle = action[servo]
			// }
			
			// console.log(servo,action[servo],this.servos_object[servo]['state'],act_angle)
			action_angle[action.servo] =  action.angle
			this.servos_object[action.servo]['state'] = action.angle
			// as increment decision
			// if (action[parseInt(s)]-0.5>0){
				// act = 5
			// }
			// if (action[parseInt(s)]-0.5<0){
				// act = -5
			// }
			// var st = next_state[s][l] + act
			
			// as angle decision
			// var st = 90
			// if (action[parseInt(s)]>0.666){
				// st = 110;
			// }else if (action[parseInt(s)]<0.333){
				// var st = 70
			// }
			
			// for (var i in action){
			// var rnd = Math.random()
			// if (rnd>0.9){
				// st = 110
			// }else if (rnd<0.1){
				// st = 90
			// }
					// }
					
			// var st = next_state[s][l] + act
			
			// if (st > this.maxAngle){
				// st = this.maxAngle
			// }
			// if (st < this.minAngle){
				// st = this.minAngle
			// }
		for (var servo in this.servos_object){
			next_state.push(Array.from(state[s]));
			next_state_scaled.push(Array.from(state_scaled[s]));
			
			next_state[s] = next_state[s].slice(1)
			next_state_scaled[s] = next_state_scaled[s].slice(1)
			
			if (servo==action.servo){
				next_state[s].push(action.angle)
				next_state_scaled[s].push(this.servos_scale_sate(action.servo,action.angle))
			}else{
				next_state[s].push(next_state[s][next_state[s].length-1])
				next_state_scaled[s].push(next_state_scaled[s][next_state[s].length-1])
				
			}
			
			// new_angle[servo] = st
			
			s = s +1
		}
		
		
		// console.log("new angles",action_angle,next_state,next_state_scaled)
		// _this.servos.setAngles(new_angle)
		// console.log("set servo Angles",action_angle)
		await this.SetServosAngles(action_angle)
		// console.log("servo Angles setted")
		if (this.use_gyro==true){
			var gyro_state = await this.Gyro();
			
			
			for (var dim in gyro_state){
				// console.log(s,next_state)
				
				next_state.push(Array.from(state[s]));
				next_state_scaled.push(Array.from(state_scaled[s]));
				
				next_state[s] = next_state[s].slice(1)
				next_state_scaled[s] = next_state_scaled[s].slice(1)
				
				var st = gyro_state[dim]
				next_state[s].push(st)
				next_state_scaled[s].push(st/100)
				s = s + 1
			}
		}else{
			var gyro_state = {'x':0,'y':0,'z':0}
		}
		var sonic_state = await this.Sonic();
		// console.log("SONIC",sonic_state - this.initial_distance)
		return  {
			gyro_state : gyro_state,
			distance_change : sonic_state - this.initial_distance,
			distance : sonic_state,
			servos_state : _this.servos.state,
			next_state : next_state,
			next_state_scaled : next_state_scaled
		}
		
	}


	
}


function actor_critic() {
	
	var _this_ac = this;
	// const tf = require('@tensorflow/tfjs-node-gpu');
	let zeros = (w, h, v=0) => Array.from(new Array(h), _ => Array(w).fill(v));
	// tf.enableDebugMode()
	class A2CAgent {
		constructor(inputs_size,depth,actions_size,servos_actions_size) {
			console.log("constructor A2C")
			this.render = false;
			// this.state_size = state_size;
			this.inputs_size = inputs_size; // 4
			this.value_size = 1;

			this.discount_factor = 0.99;
			this.actor_learningr = 0.001;
			this.critic_learningr = 0.005;
			this.depth = depth; // 2
			this.actions_size = actions_size // 12
			this.servos_actions_size = servos_actions_size//3
			
			this.actor = this.build_actor();
			this.critic = this.build_critic();
			

		}
		
		build_actor() {
			
			// console.log("DEPT actore",this.depth,this.inputs_size)
			const model = tf.sequential();
			
			model.add(tf.layers.dense({
				// units: 24,
				units: 24,
				activation: 'relu',
				kernelInitializer:'glorotUniform',
				// inputShape:[this.inputs_size, this.depth], //oneHotShape
				inputShape:[this.actions_size,this.depth], //oneHotShape
			}));
			model.add(tf.layers.flatten());
			// addd by me
			model.add(tf.layers.dense({units: 24, activation: 'relu'}));
			// model.add(tf.layers.flatten());

			model.add(tf.layers.dense({
				units: this.actions_size,
				activation:'softmax',
				kernelInitializer:'glorotUniform',
			}));

			model.summary();

			model.compile({
				optimizer: tf.train.adam(this.actor_learningr),
				loss:tf.losses.softmaxCrossEntropy
			});

			return model;
		}

		build_critic(depth) {
			const model = tf.sequential();
			
			
			model.add(tf.layers.dense({
				units: 24,
				activation: 'relu',
				kernelInitializer:'glorotUniform',
				// inputShape: [9, 12], //oneHot shape
				// inputShape: [1, 1], //oneHot shape
				// inputShape: [3,12], //oneHot shape
				// inputShape: [this.inputs_size * 3, this.depth], //oneHot shape
				inputShape: [this.actions_size,this.depth], //oneHot shape
			}));

			model.add(tf.layers.flatten());

			model.add(tf.layers.dense({
				units: this.value_size,
				// units: 4,
				activation:'linear',
				kernelInitializer:'glorotUniform',
			}));

			model.summary();

			model.compile({
				optimizer: tf.train.adam(this.critic_learningr),
				loss:tf.losses.meanSquaredError,
			});

			return model;
		}

		format_state(state) {
			let copy_state = state.slice();
			for(let i=0; i < state.length; i++) {
				if(Array.isArray(copy_state[i])) {
					copy_state[i] = Math.ceil(state[i][1] / 10);
				}
			}
	
			return copy_state;
	
		}

		get_action(state_scaled,ACTION_INDEX) {
			// var  state_tensor = tf.oneHot(state_scaled, ACTION_INDEX.length / SERVO_WALK.length );
			// var policy = agent.actor.predict(state_tensor.reshape([1,ACTION_INDEX.length,DEPTH]), {batchSize:1});
			// var policy_flat  = policy.dataSync()
			// var action =  ACTION_INDEX[randomChoice(policy_flat)]
			var state_tensor = tf.oneHot(state_scaled, this.servos_actions_size );
			var policy = this.actor.predict(state_tensor.reshape([1,this.actions_size,this.depth]), {batchSize:1});
			var policy_flat  = policy.dataSync()
			console.log(policy_flat)
			return  ACTION_INDEX[randomChoice(policy_flat)]
					
					
			
		}

		async train_model(state, action, reward, next_state, done, chart) {
			// let target = zeros(this.inputs_size, 1);
			let target = zeros(1,this.value_size);
			// let advantages = zeros(1, this.inputs_size);
			let advantages = zeros(1, this.actions_size);
			// var advantages = zeros(1, this.actions_size);
			// console.log("init advantages",advantages)
			// let oneHotState = tf.oneHot(this.format_state(state), 12);
			// let oneHotNextState = tf.oneHot(this.format_state(next_state), 12);
			var oneHotState = tf.oneHot(state,this.servos_actions_size).reshape([1,this.actions_size,this.depth])
			// oneHotState = oneHotState.reshape([1, 8, 5])
			var oneHotNextState = tf.oneHot(next_state,this.servos_actions_size).reshape([1,this.actions_size,this.depth])
			// oneHotNextState = oneHotNextState.reshape([1, 8, 5])
			// var oneHotState = state
			// console.log("TRAIN, oneHotState  1",state_tensor)
			// var oneHotNextState = next_state
			let value = this.critic.predict(oneHotState).flatten().dataSync();
			// console.log(value.data())
			// console.log("CRITIC predict",value)
			// let next_value = this.critic.predict(oneHotNextState).flatten().get(0);
			let next_value = this.critic.predict(oneHotNextState).flatten().dataSync();
			// console.log(action) //Pb nbr d'actions dans advantages
			// if(done) {
				
				// target[0] = reward;
			// } else {
				// console.log("action",action)
				// console.log("ADV CALC",[reward + this.discount_factor * (next_value) - value])
				// console.log("ACTION FOR REWARD",action)
				// advantages[action] = [reward + (1 - done)  * this.discount_factor * (next_value) - value];
				// console.log("advantages",advantages)
				// trying to do my advantages
				
				target[0] = reward + this.discount_factor * next_value;
				// for (var i =0;i< 4 ;i++){ 
					
					// target[0][i] = reward + this.discount_factor * next_value[i];
				// }
				// var advantages = []
				// for (var i =0;i<this.actions_size;i++){
					// advantages.push(reward + (1 - done) * this.discount_factor * (next_value) - value)
					// advantages.push(reward + (1 - done) * this.discount_factor * (next_value) - value)
					// advantages.push(reward + (1 - done) * this.discount_factor * (next_value[Math.floor(i/4)]) - value[Math.floor(i/4)])
				// }
				advantages[action.index] = [reward + (1 - done) * this.discount_factor * (next_value) - value];
				// console.log("advantages",action,advantages)
				// console.log("advantages",tf.tensor(advantages).dataSync())
				// console.log("target",tf.tensor(target).dataSync())
				
			// }
			// console.log("TARGET ACTORE=",advantages)
			// var thisAgent = this;
			// thisAgent.done = false
			// while( thisAgent.done == false){
				// console.log("ok")
				// await this.actor.fit(oneHotState, tf.tensor(advantages).reshape([1,this.actions_size]), {epochs:1,})
				// await this.actor.fit(oneHotState, tf.tensor(advantages).reshape([1,this.actions_size]), {epochs:1,})
				await this.actor.fit(oneHotState, tf.tensor(advantages).reshape([1,this.actions_size]), {epochs:1,})
				// .then(function(i){
					// console.log("fit actore done",i)
				
				await this.critic.fit(oneHotState, tf.tensor(target), {
					epochs:1,
				}).then(function(h){
					// this.lossA = h.history.loss
					// console.log(h)
						chart.addData('reward_loss_chart_periods',{
								'loss':h.history.loss[0],
								'reward':reward
							})
					// console.log("Loss after Epoch : " + h.history.loss[0]);
					// console.log("reward after Epoch : " + reward);
					// thisAgent.done = true
				})
				// console.log(t)
				// });
			// }
			
			
		}
	}

   
	async function init(load=false,use_gyro=false){
		const DEPTH = 2
				
		this.environment = new Environment(DEPTH,use_gyro)
		
		var { AMOUNT_INPUTS, ACTION_INDEX, SERVO_WALK  } = this.environment.getData()
		
		servos_actions_size = 3
		var {gyro_state,state,state_scaled } = await this.environment.init()
		
		this.state = state
		this.state_scaled = state_scaled
		this.ACTION_INDEX = ACTION_INDEX
		this.chart = myCharts()

		console.log("servos_walk",SERVO_WALK)
		
		this.epoch = 0;
		//var period = 0;
		this.period = 0;
		this.agent = new A2CAgent(AMOUNT_INPUTS,DEPTH,ACTION_INDEX.length,servos_actions_size);
		
		this.active = false
		this.reset = false
		this.waspaused = false
		this.started = false
		
		
		if (load==true){
			try {
				
				this.agent.actor = await tf.loadLayersModel(window.location.origin + '/mymodels/actor_model.json');
				this.agent.critic = await tf.loadLayersModel(window.location.origin + '/mymodels/critic_model.json');
				// agent.actor.summary();
				// agent.critic.summary();
				console.log("model loaded")
			} catch(e) {
				log("Actor-critic set")
				// let agent = new A2CAgent(AMOUNT_INPUTS,DEPTH,AMOUNT_ACTIONS);
			}	
		}
		log("actor-critic model set")
			
	}
	
	// var _this_ac = this;
	
	
	async function train(_this_ac) {
		if (!_this_ac){
			_this_ac = this;
		}
		if (_this_ac.started==false){
			log("training started")
			_this_ac.started = true;
		}
		if (_this_ac.waspaused==true){
			log("training resumed")
			_this_ac.waspaused = false;
		}
		console.log("TRAIN FUNCT",_this_ac.active)
		// const DEPTH = 2
				
		// environment = new Environment(DEPTH,use_gyro)
		
		// var { AMOUNT_INPUTS, ACTION_INDEX, SERVO_WALK  } = environment.getData()
		
		// servos_actions_size = 3
		// var {gyro_state,state,state_scaled } = await environment.init()
		
		// var chart = myCharts()

		// console.log("servos_walk",SERVO_WALK)
		
		// var epoch = 0;
		// var period = 0;
		// let agent = new A2CAgent(AMOUNT_INPUTS,DEPTH,ACTION_INDEX.length,servos_actions_size);
		



		// _this_ac.active = false
		// _this_ac.reset = false
		// var this_ac = this
		// var waspaused = false
		
		// var train_job = async function(){
			// console.log("--> training job",this_ac.reset)
			
		// while(true){
			if (_this_ac.reset==true){
				await _this_ac.environment.reset()	
				_this_ac.reset = false;
			}
			
			if (_this_ac.active!=true){
				 _this_ac.waspaused = true
			}else{
				// if (waspaused==true){
					
					
					_this_ac.waspaused = false
				// }
				
					if (_this_ac.period==0){
						_this_ac.chart.cleanData('reward_loss_chart_periods')
					}
					_this_ac.epoch = _this_ac.epoch + 1 
					_this_ac.period = _this_ac.period + 1
					
					
					// var  state_tensor = tf.oneHot(state_scaled, ACTION_INDEX.length / SERVO_WALK.length );
					// var policy = agent.actor.predict(state_tensor.reshape([1,ACTION_INDEX.length,DEPTH]), {batchSize:1});
					// var policy_flat  = policy.dataSync()
					// var action =  ACTION_INDEX[randomChoice(policy_flat)]
					
					action = _this_ac.agent.get_action(_this_ac.state_scaled,_this_ac.ACTION_INDEX)
					var {gyro_state ,distance_change , distance, servos_state, next_state, next_state_scaled } = await _this_ac.environment.step(_this_ac.state,action,_this_ac.state_scaled,false)
						

					// }
					// reward = 1/2 * rewardSonic / 10 + 1/6 - Math.abs(gyro.x) / 100 + 1/6 - Math.abs(gyro.y) / 100 + 1/6 - Math.abs(gyro.z) / 100
					// reward =  1/3 *  (1- Math.abs(gyro.x) / 100 ) + 1/3 * (1 - Math.abs(gyro.y) / 100 ) + 1/3 * (1- Math.abs(gyro.z) / 100)
					// reward = 1/ ( - distance_change / 100)
					reward = - distance_change / 100
					
					// reward = (epoch * ((Math.random() * 5) - 2) ) / 100

					if (_this_ac.period % 200 == 0 || distance<5 || distance>70){
						
						await _this_ac.agent.train_model(_this_ac.state_scaled, action, reward, next_state_scaled, true,_this_ac.chart);
						await _this_ac.environment.reset()
						// agent.actor.save(window.location.origin + '/mymodels')
						// agent.critic.save(window.location.origin + '/mymodels')
						await _this_ac.agent.actor.save(
							tf.io.http(
								window.location.origin + '/mymodels',
								 {requestInit:{ method: 'POST',headers : {'prefix':'actor_' }}}));
								 
						await _this_ac.agent.critic.save(
							tf.io.http(
								window.location.origin + '/mymodels',
								 {requestInit:{ method: 'POST',headers : {'prefix':'critic_' }}}));
						
						if (distance<5){
							_this_ac.active=false
							$("#train_button").removeClass("active")
							log('episode ended at periods ' + _this_ac.period + ' - training paused since too close to wall : ' + distance + 'cm')
							_this_ac.period = 0
							//$('#log').prepend('<div>' + now + ': episode ended since too close to wall :' + distance + ' cm</div>') 
							//$('#log').prepend('<div>' + now + ': episode ended since too close to wall :' + distance + ' cm</div>') 
						}else if(distance>70){
							_this_ac.active=false
							// waspaused = true
							$("#train_button").removeClass("active")
							log(' episode ended at periods ' + _this_ac.period + ' - training paused since too far from wall : ' + distance + 'cm')
							_this_ac.period = 0
							//$('#log').prepend('<div>' + now + ': episode ended since too far from wall :' + distance + ' cm</div>') 
						}else{
							log('episode ended after 200 epoch')
							_this_ac.period = 0
						}
						
						_this_ac.chart.addData('reward_loss_chart_episods',{distance:distance_change})
						
						
					}else{
						
						await _this_ac.agent.train_model(_this_ac.state_scaled, action, reward, next_state_scaled, false, _this_ac.chart);
						
					}
			
					// console.log(state,next_state)
					_this_ac.state = next_state
					_this_ac.state_scaled = next_state_scaled
					
				// console.log("RELAUNCH AGAIN TRAIN")
				await this.train(_this_ac)
			}
			
		// }
		
		// await train_job()
		//,1000)

	}
	
	function log(text){
		var now = new Date().toLocaleTimeString() //.replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3")
		$('#log').prepend('<div>' + now + ': ' + text + '</div>') 	
		
	}
	async function reset_training() {
		// console.log("PAUSE TRAINING")
		
		this.reset = true
		this.active = false
		log("training paused and reset")
		
	}	
	async function pause_training() {
		console.log("PAUSE TRAINING")
		log("training paused")
		this.active = false
	}
	async function stop_training() {
		log("training stopped")
		this.chart.cleanData('reward_loss_chart_periods')
		this.chart.cleanData('reward_loss_chart_episods')
		this.init()
		// this.active = false
		
		// clearInterval(this.trainingJob)
	}
	async function test() {
		// clearInterval(this_ac.trainingJob)
		
	}
	async function buildAgent() {
		
		
	}


	return {
		init : init,
		train: train,
		stop_training : stop_training,
		pause_training : pause_training,
		reset_training : reset_training,
		test:test
		
	}
}
// console.log("hjel")
// module.exports = new actor_critic();

// TODO
// depth = 3
// - nice object
// - laod model
// - stop training
// - test model


$(function(){
	// (async() => {
		// let sars = new actor_critic();
		// console.log("starting a2c main")
		// sars.train();
	// })();
	console.log("INIT LEARN")
	let sars = new actor_critic();
	sars.init();
	console.log()
	// sars.active = false
	
	$("#train_button").on('click',function(){
		// console.log($(this).hasClass("active"))
		if($(this).hasClass("active")){
			// console.log("PAUSE TRAINING")
			$(this).removeClass("active")
			sars.pause_training()
			// sars.active = false
		}else{
			console.log("TRAIN BUTTON",sars)
			$(this).addClass("active")
			sars.active = true
			sars.train()
			$("#reset_button").removeClass('disabled')
			
		}
		
	})
	$("#reset_button").on('click',function(){
		// var $this = this
		if (!$(this).hasClass('disabled')){
			// console.log("CLICK RESET")
			// sars.active = false
			sars.reset_training()
			$("#train_button").removeClass("active")
			// sars.reset = true
		}
	})	
	$("#stop_button").on('click',function(){
		sars.stop_training()
		$("#train_button").removeClass('active')
		$("#reset_button").addClass('disabled')
		
	})	
	
})


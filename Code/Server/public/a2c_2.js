// A2C in node : https://naifmehanna.com/2019-02-01-implementing-a2c-algorithm-using-tensorflow-js/
// some code in github https://github.com/naifmeh/smartbotjs/blob/remotecrawlers/utils/math_utils.js
// tf.js tutorials : https://www.tensorflow.org/js/tutorials
 
 // pi 4 leg : https://sebastianfoerster86.wordpress.com/2016/11/07/robot-controlled-by-artificial-neural-network/ 
 
 
 // https://github.com/naifmeh/smartbotjs/blob/remotecrawlers/algorithm/environment.js
 // actions
 // 0 : do nothing
 // 1 : move front
 // 2 : move back
 // 3 : turn left
 // 4 : turn right
 // 5 : move head up
 // 6 : move head down
 // 7 : flash
 // 8 : sit
 
 
 // reward 
 // emotions +surprised, +happy, -anger, -sad
 // motion centering
 // manual button
 
 // states
 // distance of face from center
 // size diff of face contour compared to reference (1/4 of area?)
 // distance of motion from center
 // head position angle
 // sit/stand
 
 function cartesian(list)
{
  var last, init, keys, product = [];

  if (Array.isArray(list))
  {
    init = [];
    last = list.length - 1;
  }
  else if (typeof list == 'object' && list !== null)
  {
    init = {};
    keys = Object.keys(list);
    last = keys.length - 1;
  }
  else
  {
    throw new TypeError('Expecting an Array or an Object, but `' + (list === null ? 'null' : typeof list) + '` provided.');
  }

  function add(row, i)
  {
    var j, k, r;

    k = keys ? keys[i] : i;

    // either array or not, not expecting objects here
    Array.isArray(list[k]) || (typeof list[k] == 'undefined' ? list[k] = [] : list[k] = [list[k]]);

    for (j=0; j < list[k].length; j++)
    {
      r = clone(row);
      store(r, list[k][j], k);

      if (i >= last)
      {
        product.push(r);
      }
      else
      {
        add(r, i + 1);
      }
    }
  }

  add(init, 0);

  return product;
}


 // function math_utils() {

    function weightedRandomItem(data, prob) {
        /*if(data.length !== prob.length) {
            throw new Error('Data and probability arrays are not of same length');
        }*/

        let rand = Math.random();
        let threshold = 0;
        for(let i=0; i<prob.length; i++) {
			
            threshold += prob[i];
			// console.log("ACT",i,threshold,rand,prob[i])
            if(threshold > rand) {
                return data[i];
            }
        }
    }

    function randomItem(data) {
        let probs = [];
        for(let i=0; i<data.length; i++) {
            probs.push(1/data.length);
        }
        return weightedRandomItem(data, probs);
    }

    function combinations(array, size, output, start=0, initialStuff=[]) {
        if (initialStuff.length >= size) {
            output.push(initialStuff);
        } else {
            let i;
            for (i = start; i < array.length; ++i) {
                combinations(array, size, output, i+1, initialStuff.concat(array[i]));
            }
        }
    }

    function ones(taille) {
        return Array.apply(null, Array(taille)).map(Number.prototype.valueOf, 1);
    }

    function argmax(array) {
        return array.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
    }


function randomChoice(p) {
    let rnd = p.reduce( (a, b) => a + b ) * Math.random();
    return p.findIndex( a => (rnd -= a) < 0 );
}

function randomChoices(p, count) {
    return Array.from(Array(count), randomChoice.bind(null, p));
}

let result = randomChoices([0.1, 0, 0.3, 0.6, 0], 3);
// console.log("TESST RANDMOCHPOSES",result);
    // return {
        // weightedRandomItem: weightedRandomItem,
        // randomItem: randomItem,
        // ones: ones,
        // argmax: argmax,
        // combinations: combinations,
    // }
// }

// module.exports = new Math_utils();
function Environment(depth,use_gyro) {
	// console.log("init Env",depth)
	this.use_gyro = use_gyro
	this.getData = function(){
		return _this.servos.state
		
	}
	
	this.reset = async function(){
		var sonic_state = await this.Sonic();
		this.initial_distance = sonic_state
		console.log("Reset done, new initial distance is",this.initial_distance)
	}
	this.init = async function (servos,servos_actions) {
		// Actions : 90 / 110 / 70
		// this.maxAngle = 110
		// this.maxAngle = servos_actions[servos_actions.length-1]
		// this.minAngle = servos_actions[0]
		// this.scale_a = 1 / (this.maxAngle - this.minAngle)
		// this.scale_b = -  this.minAngle * this.scale_a
	
	
		// var actions_init = {}
		this.servos_actions = servos_actions
		this.servos = servos
		this.servos_object = {}
		var initial_servos_state = {}
		
		for (var s in servos){
			initial_servos_state[servos[s].name] = servos[s]['init']
			if (servos[s]['used']==true){
				this.servos_object[servos[s].name] = {}
				this.servos_object[servos[s].name]['state'] = servos[s]['init']
				this.servos_object[servos[s].name]['step'] = servos[s]['step']
				this.servos_object[servos[s].name]['max'] = servos[s]['max']
				this.servos_object[servos[s].name]['min'] = servos[s]['min']
				// console.log(this.servos_object,servos[s])
				this.servos_object[servos[s].name]['scale_a'] = 1 / (servos[s].max - servos[s].min)
				this.servos_object[servos[s].name]['scale_b'] = - servos[s].min * this.servos_object[servos[s].name]['scale_a']
				
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
			for (var d=0;d<depth;d++){
				statesA[statesA.length-1].push(this.servos_object[s]['state'])
				statesA_scaled[statesA_scaled.length-1].push(this.servos_scale_sate(this.servos_object[s]['state'],s))
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
				for (var d=0;d<depth;d++){
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
		
		return servos_walk
	}




	this.servos_scale_sate = function(state,servo){
		// console.log("servos_scale_sate",state,servo,this.servos_object[servo])
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
		
		for (var servo in action){
			
			
			if (incremental){
				
				var act_angle = action[servo] *  this.servos_object[servo]['step']  + this.servos_object[servo]['state']
				// console.log(servo,act_angle)
				if (act_angle > this.servos_object[servo]['max']){
					act_angle = this.servos_object[servo]['max']
				}
				if (act_angle < this.servos_object[servo]['min']){
					act_angle = this.servos_object[servo]['min']
				}
			}else{
				var act_angle = action[servo]
			}
			
			// console.log(servo,action[servo],this.servos_object[servo]['state'],act_angle)
			action_angle[servo] = act_angle
			this.servos_object[servo]['state'] = act_angle
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
			
			next_state.push(Array.from(state[s]));
			next_state_scaled.push(Array.from(state_scaled[s]));
			
			next_state[s] = next_state[s].slice(1)
			next_state_scaled[s] = next_state_scaled[s].slice(1)
			
			next_state[s].push(act_angle)
			next_state_scaled[s].push(this.servos_scale_sate(act_angle,servo))
			
			// new_angle[servo] = st
			
			s = s +1
		}
		
		
		// console.log("new angles",action_angle,next_state,next_state_scaled)
		// _this.servos.setAngles(new_angle)
		console.log("set servo Angles")
		await this.SetServosAngles(action_angle)
		console.log("servo Angles setted")
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
	// const tf = require('@tensorflow/tfjs-node-gpu');
	let zeros = (w, h, v=0) => Array.from(new Array(h), _ => Array(w).fill(v));
	// tf.enableDebugMode()
	class A2CAgent {
		constructor(inputs_size,depth,actions_size) {
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
			this.actions_item_length = 3
			
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
				inputShape:[12,2], //oneHotShape
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
				inputShape: [12,2], //oneHot shape
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

		get_action(state, actions) {
			// this.actions_size * this.servos_size,
			
			// console.log(this.format_state(state))
			// let oneHotState = tf.oneHot(this.format_state(state), 12);
			let oneHotState = tf.oneHot(this.format_state(state), 2);
			
			let policy = this.actor.predict(oneHotState.reshape([1,2,1]), {
				batchSize:1,
			});
			
			let policy_flat = policy.dataSync();
			
			// return math_utils.weightedRandomItem(actions, policy_flat);
			return actions;
			// should return
			
		}

		async train_model(state, action, reward, next_state, done, chart) {
			// let target = zeros(this.inputs_size, 1);
			let target = zeros(1,this.value_size);
			// let advantages = zeros(1, this.inputs_size);
			// let advantages = zeros(1, this.actions_size);
			var advantages = zeros(1, this.actions_size);
			// console.log("init advantages",advantages)
			// let oneHotState = tf.oneHot(this.format_state(state), 12);
			// let oneHotNextState = tf.oneHot(this.format_state(next_state), 12);
			var oneHotState = tf.oneHot(state,3).reshape([1,12,2])
			// oneHotState = oneHotState.reshape([1, 8, 5])
			var oneHotNextState = tf.oneHot(next_state,3).reshape([1,12,2])
			// oneHotNextState = oneHotNextState.reshape([1, 8, 5])
			// var oneHotState = state
			// console.log("TRAIN, oneHotState  1",state_tensor)
			// var oneHotNextState = next_state
			let value = this.critic.predict(oneHotState).flatten().dataSync();
			// console.log(value.data())
			console.log("CRITIC predict",value)
			// let next_value = this.critic.predict(oneHotNextState).flatten().get(0);
			let next_value = this.critic.predict(oneHotNextState).flatten().dataSync();
			// console.log(action) //Pb nbr d'actions dans advantages
			// if(done) {
				// advantages[action] = [reward - value];
				// target[0] = reward;
			// } else {
				// console.log("action",action)
				// console.log("ADV CALC",[reward + this.discount_factor * (next_value) - value])
				// advantages[action] = [reward + (1 - done)  * this.discount_factor * (next_value) - value];
				// trying to do my advantages
				
				target[0] = reward + this.discount_factor * next_value;
				// for (var i =0;i< 4 ;i++){ 
					
					// target[0][i] = reward + this.discount_factor * next_value[i];
				// }
				var advantages = []
				for (var i =0;i<this.actions_size;i++){
					advantages.push(reward + (1 - done) * this.discount_factor * (next_value) - value)
					// advantages.push(reward + (1 - done) * this.discount_factor * (next_value[Math.floor(i/4)]) - value[Math.floor(i/4)])
				}
				// console.log("advantages",advantages)
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
					chart.addData({
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

	
   

	
	// const environment = require('./environment')().EnvironmentController(1500);
	// const serialiser = require('../utils/serialisation');


	async function main(offline=false,use_gyro=false) {
		
		const DEPTH = 2
		environment = new Environment(DEPTH,use_gyro)
		let episode_done = false;
		// environment.init();

		// var state = environment.getData();
		// var inti = await environment.init()
		
		// console.log(state_scaled)
		// var state = init.state;
		// var state_scaled = init.state_scaled;
		// const AMOUNT_INPUTS = data.actions_index.length;
		
		

		
		const SERVOS = [
			{'name':2,'init':0,'used':false},
			{'name':3,'init':80,'used':true,'min':70,'max':90,'step':10},
			{'name':4,'init':85,'used':false},
			{'name':5,'init':0,'used':false},
			{'name':6,'init':100,'used':true,'min':90,'max':110,'step':10},
			{'name':7,'init':85,'used':false},
			{'name':8,'init':95,'used':false},
			{'name':9,'init':80,'used':true,'min':70,'max':90,'step':10},
			{'name':10,'init':180,'used':false},
			{'name':11,'init':95,'used':false},
			{'name':12,'init':90,'used':true,'min':80,'max':100,'step':10},
			{'name':13,'init':180,'used':false},
			{'name':15,'init':90,'used':false,'label':'head'},
		]
		
		// var actions_index = [70,90,110];
		var actions_index = [-1,0,1];
		var incremental = true;
		// var incremental = false;
		
		var AMOUNT_INPUTS = 0
		
		var servos_walk = [];
		for (var i in SERVOS){
			if (SERVOS[i].used==true){
				servos_walk.push(SERVOS[i])
				AMOUNT_INPUTS = AMOUNT_INPUTS + 1
			}
		}
		
		if (use_gyro==true){
			AMOUNT_INPUTS = AMOUNT_INPUTS + 3 ;
			// var AMOUNT_INPUTS = 11;
		// }else{
			// var AMOUNT_INPUTS = 8;
		}
		
		const AMOUNT_ACTIONS = servos_walk.length * actions_index.length;
		
		// const STATE_SIZE = 3; // 0 -> 120 / step 10
	
		let agent = new A2CAgent(AMOUNT_INPUTS,DEPTH,AMOUNT_ACTIONS);
		let reward_plotting = {};
		let episode_length = 0;
		
		
		var {gyro_state,state,state_scaled} = await environment.init(SERVOS,actions_index)
		
		var chart = myCharts()

		// console.log("servos_walk",servos_walk)
		
		var epoch = 0;
		var batch = 0;
		
		// try {
			// agent.actor = await tf.loadLayersModel('localstorage://actor_model');
			// agent.critic = await tf.loadLayersModel('localstorage://critic_model');
			// agent.actor.summary();
			// agent.critic.summary();
			// console.log("model loaded")
		// } catch(e) {
			// console.log("no model saved, cannot load",e)
		// }	


		setInterval(async function(){
		// while(true){
			if (_this.a2c.reset==true){
				await environment.reset()	
				_this.a2c.reset = false;
			}
			if (_this.a2c.active==true){
					epoch = epoch + 1 
					batch = batch + 1 
					// var init = environment.init()
					// console.log(init)
					// state_scaled = Array.from(init.servo_state_scaled)
					// console.log(state_scaled)
					// state_scaled.push(init.gyro_state_scaled)
					// console.log("state_scaled",state_scaled)
					
					// const state_tensor = tf.tensor(state_scaled).expandDims(0)
					
					var  state_tensor = tf.oneHot(state_scaled, actions_index.length);
					// console.log("ON HOT STATE",oneHotState.dataSync())
					// console.log("TENSOR",state_tensor.dataSync())
					// console.log("TENSOR reshape",state_tensor.dataSync())
					// var action = agent.get_action(xs,[-5,5]);
					// var policy = agent.actor.predict(state_tensor, {batchSize:1	});
					
					var policy = agent.actor.predict(state_tensor.reshape([1,12,2]), {batchSize:1});
					console.log("POLICY",policy.dataSync())
					// let policy = this.actor.predict(oneHotState.reshape([1,9,12]), {
						// batchSize:1,
					// });
					// console.log("OK1")
					var policy_flat  = policy.dataSync()
					var actions = {}
					for (var s in servos_walk){
						servos_walk[s]['policy'] = []
						for (var a in actions_index){

							servos_walk[s]['policy'].push(policy_flat[(s*actions_index.length)+parseInt(a)]*servos_walk.length)
						}
						// servos_walk[s]['action'] = randomChoice(servos_walk[s]['policy');
						var choice = randomChoice(servos_walk[s]['policy'])
						// console.log("distribution",servos_walk[s].name,choice,actions_index[choice])
						actions[servos_walk[s].name] = actions_index[randomChoice(servos_walk[s]['policy'])]
					}

						var {gyro_state ,distance_change , distance, servos_state, next_state, next_state_scaled } = await environment.step(state,actions,state_scaled,incremental)
						

									// }
									// reward = 1/2 * rewardSonic / 10 + 1/6 - Math.abs(gyro.x) / 100 + 1/6 - Math.abs(gyro.y) / 100 + 1/6 - Math.abs(gyro.z) / 100
									// reward =  1/3 *  (1- Math.abs(gyro.x) / 100 ) + 1/3 * (1 - Math.abs(gyro.y) / 100 ) + 1/3 * (1- Math.abs(gyro.z) / 100)
									// reward = 1/ ( - distance_change / 100)
									reward = - distance_change / 100
									
									// reward = (epoch * ((Math.random() * 5) - 2) ) / 100

									if (epoch % 200 == 0){
										await agent.train_model(state_scaled, policy_flat, reward, next_state_scaled, true,chart);
										await environment.reset()
										// agent.actor.save(window.location.origin + '/mymodels')
										// agent.critic.save(window.location.origin + '/mymodels')
										await agent.actor.save(
											tf.io.http(
												window.location.origin + '/mymodels',
												 {requestInit:{ method: 'POST',headers : {'prefix':'actor_' }}}));
												 
										await agent.critic.save(
											tf.io.http(
												window.location.origin + '/mymodels',
												 {requestInit:{ method: 'POST',headers : {'prefix':'critic_' }}}));
									}else{
										// if (batch % 20 == 0){
											await agent.train_model(state_scaled, policy_flat, reward, next_state_scaled, false,chart);
										// }
									}
							
									// console.log(state,next_state)
									state = next_state
									state_scaled = next_state_scaled
								// })
							// })
						// })
					// })

					// agent.actor.save(
						// tf.io.browserHTTPRequest(
						// tf.io.http(
							// window.location.origin + '/mymodels',
							 // {requestInit:{ method: 'POST',headers : {'class':'_actor'  } } }));
							
			
					
					// if (epoch % 10 == 0){
						// console.log("saving model")
						// await agent.actor.save('localstorage://actor_model');
						// await agent.critic.save('localstorage://critic_model');
					// }
					
					
				// })

			}	
		// }
		},1000)

	}



	return {
		main: main,
	}
}
// console.log("hjel")
// module.exports = new actor_critic();
(async() => {
	let sars = new actor_critic();
	console.log("starting a2c main")
	sars.main();
})();
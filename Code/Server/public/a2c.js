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
console.log("TESST RANDMOCHPOSES",result);
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
	console.log("init Env",depth)
	this.use_gyro = use_gyro
	this.getData = function(){
		return _this.servos.state
		
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
		
		console.log("INIT",this.servos_object)
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
		await this.SetServosAngles(action_angle)
		
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
			this.inputs_size = inputs_size;
			this.value_size = 1;

			this.discount_factor = 0.99;
			this.actor_learningr = 0.001;
			this.critic_learningr = 0.005;
			this.depth = depth;
			this.actions_size = actions_size
			
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
				inputShape:[this.inputs_size, this.depth], //oneHotShape
				// inputShape:[1, 1], //oneHotShape
				// inputShape:[1, 2], //oneHotShape
				// inputShape:[5, 5], //oneHotShape
			}));
			
			model.add(tf.layers.flatten());

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
				inputShape: [this.inputs_size, this.depth], //oneHot shape
			}));

			model.add(tf.layers.flatten());

			model.add(tf.layers.dense({
				units: this.value_size,
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
			
			console.log(this.format_state(state))
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

		async train_model(state, action, reward, next_state, done,chart) {
			// let target = zeros(this.inputs_size, 1);
			let target = zeros(1,this.value_size);
			// let advantages = zeros(1, this.inputs_size);
			// let advantages = zeros(1, this.actions_size);
			let advantages = zeros(1, this.actions_size);

			// let oneHotState = tf.oneHot(this.format_state(state), 12);
			// let oneHotNextState = tf.oneHot(this.format_state(next_state), 12);
			// oneHotState = oneHotState.reshape([1, 9, 12])
			// oneHotState = oneHotState.reshape([1, 8, 5])
			// oneHotNextState = oneHotNextState.reshape([1, 9, 12])
			// oneHotNextState = oneHotNextState.reshape([1, 8, 5])
			var oneHotState = state
			var oneHotNextState = next_state
			let value = this.critic.predict(oneHotState).flatten().dataSync();
			// console.log(value.data())
			// console.log(value.dataSync())
			// let next_value = this.critic.predict(oneHotNextState).flatten().get(0);
			let next_value = this.critic.predict(oneHotNextState).flatten().dataSync();
			// console.log(action) //Pb nbr d'actions dans advantages
			if(done) {
				advantages[action] = [reward - value];
				target[0] = reward;
			} else {
				advantages[action] = [reward + this.discount_factor * (next_value) - value];
				target[0] = reward + this.discount_factor * next_value;
			}
			// console.log("TARGET ACTORE=",advantages)
			// var thisAgent = this;
			// thisAgent.done = false
			// while( thisAgent.done == false){
				// console.log("ok")
				await this.actor.fit(oneHotState, tf.tensor(advantages).reshape([1,this.actions_size]), {
					epochs:1,
				})
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
		
		const DEPTH = 3
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

		console.log("servos_walk",servos_walk)
		
		var epoch = 0;
		
		try {
			agent.actor = await tf.loadLayersModel('localstorage://actor_model');
			agent.critic = await tf.loadLayersModel('localstorage://critic_model');
			agent.actor .summary();
			agent.critic .summary();
			console.log("model loaded")
		} catch(e) {
			console.log("no model saved, cannot load",e)
		}	


		setInterval(async function(){
		// while(true){
			if (_this.a2c.active==true){
					epoch = epoch + 1 
					// var init = environment.init()
					// console.log(init)
					// state_scaled = Array.from(init.servo_state_scaled)
					// console.log(state_scaled)
					// state_scaled.push(init.gyro_state_scaled)
					// console.log("state_scaled",state_scaled)
					
					const state_tensor = tf.tensor(state_scaled).expandDims(0)
					
					// var action = agent.get_action(xs,[-5,5]);
					var policy = agent.actor.predict(state_tensor, {
							batchSize:1,
						});
					// console.log("OK1")
					var policy_flat  = policy.dataSync()
					var actions = {}
					for (var s in servos_walk){
						servos_walk[s]['policy'] = []
						for (var a in actions_index){
							// console.log("s=",s)
							// console.log("a=",typeof(a))
							// console.log("action leng=",actions_index.length)
							// console.log(s * actions_index.length + typeof(a))
							// console.log(policy_flat[servos_walk.length)
							servos_walk[s]['policy'].push(policy_flat[(s*actions_index.length)+parseInt(a)]*servos_walk.length)
						}
						// servos_walk[s]['action'] = randomChoice(servos_walk[s]['policy');
						var choice = randomChoice(servos_walk[s]['policy'])
						// console.log("distribution",servos_walk[s].name,choice,actions_index[choice])
						actions[servos_walk[s].name] = actions_index[randomChoice(servos_walk[s]['policy'])]
					}
					// console.log("ACTIONS",servos_walk,actions)
					
					// console.log("OK1")
					// console.log(weightedRandomItem([70,90,100], action))
					// action_rnd = math_utils.weightedRandomItem([0.33,0.66,1], policy_flat);
					// console.log(action_tensor.flatten().dataSync())
					// console.log(action)
					// var dist =JSON.parse(JSON.stringify( _this.sonar.value))
					
		
					// Sonic().then(function(data){
						// sonicBefore = data
						//var distance_change;
						// var step = await environment.step()
						// console.log(step)
						// var {state_scaled, distance_change , gyro_state} = await environment.step()
						var {gyro_state ,distance_change , distance, servos_state, next_state, next_state_scaled } = await environment.step(state,actions,state_scaled,incremental)
						
						// console.log(step)
						// .then(function(step){
							// console.log(gyro_state)
							// var next_state = step.next_state
							// var next_state_scaled = step.next_state_scaled
							// var gyro = step.gyro
							// TODO : remplace par { next_state,next_state_scaled} = environment.step(state,action,state_scaled)
						
						
						
							var next_state_tensor = tf.tensor(next_state_scaled).expandDims(0);
							
							// Sonic().then(function(data){
								// sonicAfter = data
								// AA.
								// gyro().then(function(gyro){
									
									// var rewardSonic = sonicAfter - sonicBefore
									// if (rewardSonic <0){
										// rewardSonic = 0
									// }
									// reward = 1/2 * rewardSonic / 10 + 1/6 - Math.abs(gyro.x) / 100 + 1/6 - Math.abs(gyro.y) / 100 + 1/6 - Math.abs(gyro.z) / 100
									// reward =  1/3 *  (1- Math.abs(gyro.x) / 100 ) + 1/3 * (1 - Math.abs(gyro.y) / 100 ) + 1/3 * (1- Math.abs(gyro.z) / 100)
									reward =  - distance_change / 100
									// console.log(distance_change,distance,reward)
									// if (reward < 0){
										// reward = 0
									// }
									// reward = Math.random()
									// console.log("REWARD",distance_change,reward)
									// reward = 0.5
									
									// agent.train_model(state, action, reward, next_state, done);
									await agent.train_model(state_tensor, policy_flat, reward, next_state_tensor, false,chart);
							
									// console.log(state,next_state)
									state = next_state
									state_scaled = next_state_scaled
								// })
							// })
						// })
					// })
					
					
					if (epoch % 10 == 0){
						console.log("saving model")
						await agent.actor.save('localstorage://actor_model');
						await agent.critic.save('localstorage://critic_model');
					}
					
					
				// })

			}	
		// }
		},500)
		
		// next_state = var state = [
				  // [11, 23, 34, 45, 96],
				  // [12, 23, 43, 56, 23],
				  // [12, 23, 56, 67, 56],
				  // [13, 34, 56, 45, 67],
				  // [12, 23, 54, 56, 78],
				  // [12, 23, 54, 56, 78],
				  // [12, 23, 54, 56, 78],
				  // [12, 23, 54, 56, 78]
				// ]
		// const xs = tf.tensor(state).expandDims(0)
		// this.actor.fit(xs, tf.tensor(advantages).reshape([1,2047]), {
				// epochs:1,
			// });


		// var value = critic.actor.predict(xs, {
				// batchSize:1,
			// }).flatten().get(0)
			
			
			// this.critic.fit(oneHotState, tf.tensor(target), {
				// epochs:1,
			// });
			
			
			
		// https://towardsdatascience.com/how-to-train-a-neural-network-on-chrome-using-tensorflow-js-76dcd1725032
		// var action = agent.actor.predict(tf.tensor2d([10,10,10], [1,3]));
		// var action = agent.actor.predict(tf.tensor2d([1,2,3,4,5,6,7,8,9,10,11,12], [12, 1]));
		
		// agent.actor.save('localstorage://actor_model');
		// agent.critic.save('localstorage://critic_model');
		
		// const model = await tf.loadLayersModel('localstorage://actor_model');
		// console.log(model)
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
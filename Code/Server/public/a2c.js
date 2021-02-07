// A2C in node : https://naifmehanna.com/2019-02-01-implementing-a2c-algorithm-using-tensorflow-js/
// some code in github https://github.com/naifmeh/smartbotjs/blob/remotecrawlers/utils/math_utils.js
// tf.js tutorials : https://www.tensorflow.org/js/tutorials
 
 
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


 function math_utils() {

    function weightedRandomItem(data, prob) {
        /*if(data.length !== prob.length) {
            throw new Error('Data and probability arrays are not of same length');
        }*/

        let rand = Math.random();
        let threshold = 0;
        for(let i=0; i<prob.length; i++) {
            threshold += prob[i];
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



    return {
        weightedRandomItem: weightedRandomItem,
        randomItem: randomItem,
        ones: ones,
        argmax: argmax,
        combinations: combinations,
    }
}

// module.exports = new Math_utils();
function Environment(depth) {
	console.log("init Env",depth)
	this.getData = function(){
		return _this.servos.state
		
	}
	this.init = function () {
		// let utils = require(__dirname+'/utils.js').algo_utils;

		// states = [];

		// for(let key in boolean_states_attributes) {
			// if(boolean_states_attributes[`${key}`] === true) {
				// states.push([true, false]);
			// }
		// }

		// for(let key in numeric_states_attributes) {
			// if(numeric_states_attributes[`${key}`] === true) {
				// let max = 0;
				// if(`${key}` === 'ua_count')
					// max = MAX_UA_USE;
				// else if(`${key}` === 'ip_count')
					// max = MAX_IP_USE;
				// else if(`${key}` === 'domain_count')
					// max = MAX_DOMAIN_COUNT;

				// states.push(utils.generate_step_array(max, Math.ceil(max/10)));
			// }
		// }

		// let cartesian = require('cartesian');
		// states = cartesian(states);
		// N_STATES = states.length;
		// return states;
		console.log("sey angl")
		_this.servos.setAngles({
			'2':90,
			'3':90,
			'5':90,
			'6':90,
			'9':90,
			'10':90,
			'12':90,
			'13':90,
		});
		this.initial_states = {
			'2':90,
			'3':90,
			'5':90,
			'6':90,
			'9':90,
			'9':90,
			'10':90,
			'12':90,
			'13':90,
		}
		
		
		var statesA = []
		for (var s in this.initial_states){
			statesA.push([])
			for (var d=0;d<depth;d++){
				statesA[statesA.length-1].push(90)
			}
			
		}
		
		// console.log("init statesA",statesA)
		return statesA
	}

	this.step = function(state,action){
		console.log(action)
		var l = state[0].length - 1
		// next_state = Array.from(state);
		var next_state = [];
		
		var new_angle = {}
		// for (var s in state){
		var s = 0
		for (var ss in this.initial_states){
			
			next_state.push(Array.from(state[s]));
			
			// var act = parseFloat(action[parseInt(s)]-0.5 * 5)
			
			if (action[parseInt(s)]-0.5>0){
				act = 5
			}
			if (action[parseInt(s)]-0.5<0){
				act = -5
			}
			var st = next_state[s][l] + act
			
			
			if (st > 90 + 20){
				st =  90 + 20
			}
			if (st < 90 - 20){
				st =  90 - 20
			}
			
			next_state[s] = next_state[s].slice(1)
			next_state[s].push(st)
			new_angle[ss] = st
			
			s = s +1
		}
		
		console.log("new angles",new_angle)
		_this.servos.setAngles(new_angle)
		
		console.log("check set angle")
		var done = false
		while (done==false){
			var isdone = true;
			for (s in _this.servos.values){
				if (_this.servos.values[s]!=new_angle[s]){
					isdone = false;
				}
				
			}
			done = isdone;
			
		}
		
		
		console.log("check set angle done")
		// _this.servos.setAngles({
			// '2':action[0],
			// '3':action[1],
			// '6':action[2],
			// '6':action[3],
			// '9':action[4],
			// '10':action[5],
			// '12':action[6],
			// '13':action[7]
		// })
		// wait for angle set on reobot
		// setTimeout(function(){
			return next_state
		// },500)
		
	}

}
function actor_critic() {
	// const tf = require('@tensorflow/tfjs-node-gpu');
	let zeros = (w, h, v=0) => Array.from(new Array(h), _ => Array(w).fill(v));
	// tf.enableDebugMode()
	class A2CAgent {
		constructor(state_size, action_size,depth) {
			console.log("constructor A2C")
			this.render = false;
			this.state_size = state_size;
			this.action_size = action_size;
			this.value_size = 1;

			this.discount_factor = 0.99;
			this.actor_learningr = 0.001;
			this.critic_learningr = 0.005;
			this.depth = depth
			// console.log("Contructu actor",this.depth,depth)
			this.actor = this.build_actor();
			this.critic = this.build_critic();
			

		}
		
		build_actor() {
			
			// console.log("DEPT actore",this.depth)
			const model = tf.sequential();
			
			model.add(tf.layers.dense({
				// units: 24,
				units: 1,
				activation: 'relu',
				kernelInitializer:'glorotUniform',
				inputShape:[8, this.depth], //oneHotShape
				// inputShape:[1, 1], //oneHotShape
				// inputShape:[1, 2], //oneHotShape
				// inputShape:[5, 5], //oneHotShape
			}));
			
			model.add(tf.layers.flatten());

			model.add(tf.layers.dense({
				units: this.action_size,
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
				inputShape: [8, this.depth], //oneHot shape
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
			// const math_utils = require('../utils/math_utils');
			console.log(this.format_state(state))
			// let oneHotState = tf.oneHot(this.format_state(state), 12);
			let oneHotState = tf.oneHot(this.format_state(state), 2);
			
			let policy = this.actor.predict(oneHotState.reshape([1,2,1]), {
				batchSize:1,
			});
			
			let policy_flat = policy.dataSync();
			
			// return math_utils.weightedRandomItem(actions, policy_flat);
			return actions;
		}

		train_model(state, action, reward, next_state, done) {
			let target = zeros(8, 1);
			let advantages = zeros(1, this.action_size);

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
				advantages[action] = [reward +this.discount_factor * (next_value) - value];
				target[0] = reward + this.discount_factor * next_value;
			}

			// var thisAgent = this;
			// thisAgent.done = false
			// while( thisAgent.done == false){
				// console.log(thisAgent.done)
				this.actor.fit(oneHotState, tf.tensor(advantages).reshape([1,8]), {
					epochs:1,
				})
				// .then(function(i){
					// console.log("fit actore done",i)
				this.critic.fit(oneHotState, tf.tensor(target), {
					epochs:1,
				}).then(function(h){
					console.log("Loss after Epoch : " + h.history.loss[0]);
					console.log("reward after Epoch : " + reward);
					// thisAgent.done = true
				})
				// });
			// }
			
			
		}
	}

	
   

	
	// const environment = require('./environment')().EnvironmentController(1500);
	// const serialiser = require('../utils/serialisation');


	async function main(offline=false) {
		
		const DEPTH = 20
		environment = new Environment(DEPTH)
		let episode_done = false;
		// environment.init();

		// var state = environment.getData();
		var state = environment.init();
		// const AMOUNT_ACTIONS = data.actions_index.length;
		const AMOUNT_ACTIONS = 8;
		const STATE_SIZE = 2; // 0 -> 120 / step 10
	
		let agent = new A2CAgent(STATE_SIZE, AMOUNT_ACTIONS,DEPTH);
		let reward_plotting = {};
		let episode_length = 0;
		/*
		for(let i = 0; i < Object.values(data.websites).length; i++) {
			episode_done = false;
			reward_plotting[i] = 0;

			let state = environment.reset(i);
			
			
			while(true) {
				data = environment.getEnvironmentData();
				console.log('Episode '+i+' : '+(data.current_step+1)+'/'+(data.length_episode+1));

				let action = agent.get_action(state, data.actions_index);
				let step_data = await environment.step(action);
				let next_state = step_data.state,
					reward = step_data.reward,
					done = step_data.done;
				
				episode_length = step_data.episode_length;

				reward_plotting[i] += reward < 0 ? 1: 0;
				agent.train_model(state, action, reward, next_state, done);

				if(done) {
					break;
				}

				state = next_state;
			}
			reward_plotting[i] = (reward_plotting[i]/(episode_length+1))*100;
			// await serialiser.serialise({
				// reward_plotting: reward_plotting,
			// }, 'plot_actor_critic.json');
			// if(i%10) {
			// agent.actor.save(__dirname+'/actor_model');
			// agent.critic.save(__dirname+'/critic_model');
			// }
		}

		return Promise.resolve({
			reward_plotting: reward_plotting,
		});
		*/
		// var action = agent.get_action([0],[-5,5]);
		// console.log(action)
		// agent.train_model([0], action, reward, next_state, done);
		
		// var state = [
		  // [11, 23, 34, 45, 96],
		  // [12, 23, 43, 56, 50],
		  // [12, 23, 56, 67, 80],
		  // [13, 34, 56, 45, 70],
		  // [12, 23, 54, 56, 60],
		  // [12, 23, 54, 56, 50],
		  // [12, 23, 54, 56, 100],
		  // [12, 23, 54, 56, 78]
		// ]
		// var AA = {};
		// AA.
		gyro = function(data, timeout = 10000) {
			return new Promise((resolve, reject) => {
				let timer;

				_this.socket.emit('gyro')

				function responseHandler(message) {
					// resolve promise with the value we got
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



		function Sonic(data, timeout = 10000) {
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

						
		setInterval(function(){
		// while(true){
			if (_this.a2c.active==true){
				
				const state_tensor = tf.tensor(state).expandDims(0)

				// var action = agent.get_action(xs,[-5,5]);
				var action_tensor = agent.actor.predict(state_tensor, {
						batchSize:1,
					});
				action = action_tensor.dataSync()
				
				// console.log(action)
				// var dist =JSON.parse(JSON.stringify( _this.sonar.value))
				
	
				Sonic().then(function(data){
					sonicBefore = data
					
					var next_state = environment.step(state,action);
				
				
				
					var next_state_tensor = tf.tensor(state).expandDims(0);
					
					Sonic().then(function(data){
						sonicAfter = data
						// AA.
						gyro().then(function(gyro){
							
							var rewardSonic = sonicAfter - sonicBefore
							if (rewardSonic <0){
								rewardSonic = 0
							}
							// reward = 1/2 * rewardSonic / 10 + 1/6 - Math.abs(gyro.x) / 100 + 1/6 - Math.abs(gyro.y) / 100 + 1/6 - Math.abs(gyro.z) / 100
							reward =  1/3 *  (1- Math.abs(gyro.x) / 100 ) + 1/3 * (1 - Math.abs(gyro.y) / 100 ) + 1/3 * (1- Math.abs(gyro.z) / 100)
							console.log("REWARD",reward)
							// reward = 0.5
							
							// agent.train_model(state, action, reward, next_state, done);
							agent.train_model(state_tensor, action_tensor, reward, next_state_tensor, false);
					
							// console.log(state,next_state)
							state = next_state
						})
					})
					
					
					
					
					
				})

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
// A2C in node : https://naifmehanna.com/2019-02-01-implementing-a2c-algorithm-using-tensorflow-js/
// some code in github https://github.com/naifmeh/smartbotjs/blob/remotecrawlers/utils/math_utils.js
// tf.js tutorials : https://www.tensorflow.org/js/tutorials
 
 
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
function Environment() {
	
	
	function init_states() {
		let utils = require(__dirname+'/utils.js').algo_utils;

		states = [];

		for(let key in boolean_states_attributes) {
			if(boolean_states_attributes[`${key}`] === true) {
				states.push([true, false]);
			}
		}

		for(let key in numeric_states_attributes) {
			if(numeric_states_attributes[`${key}`] === true) {
				let max = 0;
				if(`${key}` === 'ua_count')
					max = MAX_UA_USE;
				else if(`${key}` === 'ip_count')
					max = MAX_IP_USE;
				else if(`${key}` === 'domain_count')
					max = MAX_DOMAIN_COUNT;

				states.push(utils.generate_step_array(max, Math.ceil(max/10)));
			}
		}

		// let cartesian = require('cartesian');
		states = cartesian(states);
		N_STATES = states.length;
		return states;

	}


}
function actor_critic() {
	// const tf = require('@tensorflow/tfjs-node-gpu');
	let zeros = (w, h, v=0) => Array.from(new Array(h), _ => Array(w).fill(v));
	
	class A2CAgent {
		constructor(state_size, action_size) {
			this.render = false;
			this.state_size = state_size;
			this.action_size = action_size;
			this.value_size = 1;

			this.discount_factor = 0.99;
			this.actor_learningr = 0.001;
			this.critic_learningr = 0.005;

			this.actor = this.build_actor();
			this.critic = this.build_critic();
		
		}

		build_actor() {
			const model = tf.sequential();
			
			model.add(tf.layers.dense({
				units: 24,
				activation: 'relu',
				kernelInitializer:'glorotUniform',
				inputShape:[9, 12], //oneHotShape
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

		build_critic() {
			const model = tf.sequential();
			
			
			model.add(tf.layers.dense({
				units: 24,
				activation: 'relu',
				kernelInitializer:'glorotUniform',
				inputShape: [9, 12], //oneHot shape
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
			
			let oneHotState = tf.oneHot(this.format_state(state), 12);
			
			let policy = this.actor.predict(oneHotState.reshape([1,9,12]), {
				batchSize:1,
			});
			
			let policy_flat = policy.dataSync();
			
			return math_utils.weightedRandomItem(actions, policy_flat);
		}

		train_model(state, action, reward, next_state, done) {
			let target = zeros(1, this.value_size);
			let advantages = zeros(1, this.action_size);

			let oneHotState = tf.oneHot(this.format_state(state), 12);
			let oneHotNextState = tf.oneHot(this.format_state(next_state), 12);
			oneHotState = oneHotState.reshape([1, 9, 12])
			oneHotNextState = oneHotNextState.reshape([1, 9, 12])
			let value = this.critic.predict(oneHotState).flatten().get(0);
			let next_value = this.critic.predict(oneHotNextState).flatten().get(0);
			console.log(action) //Pb nbr d'actions dans advantages
			if(done) {
				advantages[action] = [reward - value];
				target[0] = reward;
			} else {
				advantages[action] = [reward +this.discount_factor * (next_value) - value];
				target[0] = reward + this.discount_factor * next_value;
			}

			
			this.actor.fit(oneHotState, tf.tensor(advantages).reshape([1,2047]), {
				epochs:1,
			});

			this.critic.fit(oneHotState, tf.tensor(target), {
				epochs:1,
			});
			
		}
	}

	
   

	
	// const environment = require('./environment')().EnvironmentController(1500);
	// const serialiser = require('../utils/serialisation');


	async function main(offline=false) {
		let episode_done = false;
		if(!offline)
			await environment.init_env();

		let data = environment.getEnvironmentData();
		const AMOUNT_ACTIONS = data.actions_index.length;
		const STATE_SIZE = 12;

		let agent = new A2CAgent(STATE_SIZE, AMOUNT_ACTIONS);
		let reward_plotting = {};
		let episode_length = 0;
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
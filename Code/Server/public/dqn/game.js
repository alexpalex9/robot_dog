// dqn js = https://github.com/prouhard/tfjs-mountaincar/blob/master/src/js/
// robot 4 leg C = https://github.com/Counterfeiter/Q-LearningRobot/blob/master/Src/ann.c
// https://sebastianfoerster86.wordpress.com/2016/11/07/robot-controlled-by-artificial-neural-network/


//used for experience reply
// #define MAX_BATCH_MEM				100	//google deep mind (Atari) -> 1e6
// #define MINI_BATCH_MEM				10	//google deep mind (Atari) -> 32

//FF-ANN train parameter
// #define NUM_TRAIN_EPOCHS			30

// /steps before update the ann copy
// #define ITER_BEFORE_COPY			100

// #define DISTANCE_MEASURE_MEDIAN		5
let g_settings = {
	// mode :"RL_TRAIN",
	// agent:{
		// nSteps : 200,
		depth : 2,
		hiddenLayerSizes:[20,12],
		// maxStepsPerGame : 200,
		maxStepsPerGame : 700,
		max_batch_memory : 100,
		mini_batch_memory : 20,
		// maxStepsPerGame : 5,
		// maxStepsPerGame : 2,
		discountRate : 0.99,
		learning_rate : 0.95,
		gamma : 0.8,
		
		// max_epsilon : 1,
		min_epsilon : 0.1,
		
		servos : [
			{'name':2,'init':0,'used':false},
			// {'name':3,'init':80,'used':true,'min':70,'max':90,'step':10,'actions':[70,80,90]},
			{'name':3,'init':80,'used':true,'min':60,'max':100,'step':25,'actions':[60,100]},
			{'name':4,'init':105,'used':false},
			{'name':5,'init':0,'used':false},
			// {'name':6,'init':87,'used':true,'min':90,'max':110,'step':10,'actions':[77,87,97]},
			{'name':6,'init':87,'used':true,'min':67,'max':107,'step':25,'actions':[67,107]},
			{'name':7,'init':105,'used':false},
			{'name':8,'init':75,'used':false},
			// {'name':9,'init':87,'used':true,'min':77,'max':97,'step':10,'actions':[77,87,97]},
			{'name':9,'init':87,'used':true,'min':67,'max':107,'step':25,'actions':[67,107]},
			{'name':10,'init':180,'used':false},
			{'name':11,'init':75,'used':false},
			// {'name':12,'init':90,'used':true,'min':80,'max':100,'step':10,'actions':[80,90,100]},
			{'name':12,'init':90,'used':true,'min':70,'max':110,'step':25,'actions':[70,110]},
			{'name':13,'init':180,'used':false},
			{'name':15,'init':90,'used':false,'label':'head'},
		]	
	// }

};

class Orchestrator {
   
    constructor(discountRate, maxStepsPerGame) {
		
		this.batchSize = 1
		
        // The main components of the environment
        this.environment = new Environment(g_settings.depth,g_settings.servos);
		// var numActions = this.environment.get_actions_count()
		this.numInputs = this.environment.get_inputs_count()
		this.numActions = this.environment.get_actions_count()
		this.numServos = this.environment.servos_walk.length
		console.log("this.environment.get_actions_index()",this.environment.get_actions_count())
		console.log("numInputs",this.numInputs)
		console.log("numActions",this.numActions)
        this.model = new Model(g_settings.hiddenLayerSizes,this.numInputs,this.numActions,this.environment.servos_walk.length)

		// this.memory = new Memory(200)
		this.batch_mem  = {
			state : [],
			next_state : [],
			reward : [],
			actions : []
		}
		this.train_data = {
			input : [],
			output : []
		}
		this.maxStepsPerGame = g_settings.maxStepsPerGame;
		this.actions_labels = ['1-forward','2-forward','3-forward','4-forward','1-back','2-back','3-back','4-back','1-stop','2-stop','3-stop','4-stop']
    }
	resetModel(){
		this.model = new Model(g_settings.hiddenLayerSizes,this.numInputs,this.numActions)
	}
	async init(){
		console.log("Creating game")
		var load = await this.model.loadModels()
		if (load!=true){
			console.warn("no models loaded, creating one")
			console.log(load)
			this.model.defineModel(this.numInputs,g_settings.hiddenLayerSizes);
		}
		await this.environment.init();
		this.state = this.environment.getState();
		this.chart = new myCharts()
		this.eps = 1;
		this.steps = 0;
		this.batch_pos = 0;
	}
   
    async handleReinforcementLearning() {
		
		console.log('------------- handleReinforcementLearning ---------------',this.state)
        this.steps = this.steps + 1
		// this.environment.init();
        // let state = this.environment.getState();
        // let state_tensor = tf.tensor2d(state, [1, state.length])
        // let totalReward = 0;
        // let step = 0;
		// this.eps = MAX_EPSILON;
		// console.log("STATE (check if changing properly, not pointer",this.state)
		// let state_tensor = tf.tensor2d(this.state, [1, this.state.length])
		var qval = this.model.predict(this.state)
		// console.log("qval",qval.dataSync())
		this.chart.updateData('actions',{
			labels : this.actions_labels,
			actions : qval.dataSync()
		})
		// for (var a=0; a<this.numActions;s++ ){
			// qval[a] = qvql_p[a]
		// }
		// Interaction with the environment
		// const action = this.model.chooseAction(this.state_tensor, this.eps);
		var actions = []
		 if (Math.random() < this.eps) {
		// if (Math.random() < 2 ) {
			// console.log("Random action")
			
			for (var s = 0 ; s<this.numServos;s++){
				actions.push(Math.floor(Math.random() * this.numActions/this.numServos) )
			}
		
		} else {
			for (var s = 0 ; s<this.numServos;s++){
				actions.push(this.model.getMaxQandAction(s,qval.dataSync()).action)
			}
		
		}
		// console.log("action",actions)
		await this.environment.step(actions)
		
		var next_state = this.environment.getState()
		var reward = this.environment.getReward();
		var all_reward = Array.from(new Array(this.numServos), x => reward)
		this.chart.addData('step_reward',{
			label : this.batch_pos,
			reward : reward,
			epsilon : this.eps
		})
		
		//check if batch mem is filled the first time
		// console.log(this.batch_pos,g_settings.max_batch_memory)
		// for tEST
		// g_settings.max_batch_memory = 5
		// console.log(this.batch_pos)
		var done = this.environment.isDone()
		// console.log("IS DONE?",done)
		if (done==false){
			if(this.batch_pos >= g_settings.max_batch_memory){
				//if the list is filled once a time completely
				//we start to set new data at random positions
				//save outputs and inputs
				var batch_rand_pos = Math.floor(Math.random() * g_settings.max_batch_memory)
				this.batch_mem['state'][batch_rand_pos] =  this.state;
				this.batch_mem['next_state'][batch_rand_pos] = next_state;
				this.batch_mem['reward'][batch_rand_pos] =  all_reward;
				this.batch_mem['actions'][batch_rand_pos] =  actions;
				
				// console.log("REWARD",this.batch_mem['reward'][batch_rand_pos])
				/////////////////// experience reply //////////////////////
				//sample a random set of MAX_BATCH_MEM to MIN_BATCH_MEM
				this.train_data = {
					input : [],
					output : []
				}
			
				for(var y = 0; y < g_settings.mini_batch_memory; y++)
				{
					var mini_pos = Math.floor(Math.random() * g_settings.max_batch_memory);

					//run the old copy of the ann with new inputs
					// fann_type *newQ = fann_run(ann, batch_mem[mini_pos].inputs_tp1);
					// console.log("PREDICT Q VALUE",this.batch_mem.next_state[mini_pos])
					
					// var newQ = this.model.predict(this.state).dataSync();
					var newQ = this.model.predict(this.batch_mem.next_state[mini_pos]).dataSync();
					// console.log("newQ",newQ)
					// var newQ = this.model.predict(tensor_state).dataSync();

					//search the maximum in newQ
					
					// fann_type maxQ[NUM_SERVO_MOT];
					// var actions = [];
					var maxQ = []
					for(var x = 0; x < this.numServos; x++){
						// ann_getMaxQandAction(x, newQ, &maxQ[x]);
						var maxQandAction = this.model.getMaxQandAction(x,newQ)
						// actions.push(maxQandAction.action)
						// console.log("maxQandAction",x,maxQandAction)
						maxQ.push(maxQandAction.maxQ)
					}
					// var oldQ = []
					// for (var m in this.batch_mem[mini_pos]{
					// console.log("this.batch_mem.state[mini_pos].state",mini_pos,this.batch_mem.state[mini_pos])
					var oldQ = this.model.predict(this.batch_mem.state[mini_pos]).dataSync()
					// console.log("oldQ",oldQ)
					// }

					//set the old values as train data (output) - use new max in equation
					for(var x = 0; x < this.numServos; x++)
					{
						// console.log("---> X",x)
						// console.log("   pos",this.batch_mem.actions[mini_pos][x] * this.numServos + x)
						// console.log("   rew",this.batch_mem.reward[mini_pos][x])
						// console.log("   gamma",g_settings.gamma)
						// console.log("   maxQ",maxQ[x])
						//act = 2
						// nuServ = 4
						// x = 2
						// => index = 2 * 4 + 2 => 10
						// oldQ[this.batch_mem.actions[mini_pos][x] *  (this.numActions) + x] = (this.batch_mem.reward[mini_pos][x] < 0.1) ? (this.batch_mem.reward[mini_pos][x] + (g_settings.gamma * maxQ[x])) : this.batch_mem.reward[mini_pos][x];
						// oldQ[this.batch_mem.actions[mini_pos][x] +  (this.numActions) * x] = this.batch_mem.reward[mini_pos][x] + (g_settings.gamma * maxQ[x])) ;
						// var index = this.batch_mem.actions[mini_pos][x] +  (this.numActions/this.numServos) * x
						// var index = this.batch_mem.actions[mini_pos][x] +  (this.numActions/this.numServos) * x
						var index = this.batch_mem.actions[mini_pos][x] * this.numServos + x
						var newQofactions = (1 - g_settings.learning_rate)  * oldQ[index] + g_settings.learning_rate * ( this.batch_mem.reward[mini_pos][x] + g_settings.gamma * maxQ[x])
						oldQ[index] = newQofactions
						// console.log("new Q","y=",y,"x=",x,"action=",this.batch_mem.actions[mini_pos][x],"index=",index,"q=",newQofactions)
					}
					// console.log("New oldQ",oldQ)
					//ann_displayVector("Desired Outputs", oldQ, num_outputs);

					//store the data in mini batch fann train file
					// Alex not done here, to be done
					
					
					// memcpy(train_data->input[y], batch_mem[mini_pos].inputs, NUM_INPUTS * sizeof(fann_type));
					// memcpy(train_data->output[y], oldQ, NUM_OUTPUTS * sizeof(fann_type));
					this.train_data.input.push(this.batch_mem.state[mini_pos])
					this.train_data.output.push(oldQ)
					
				}

				//train the data sets
				// ALEX : wrong here
				// console.log("train_data",this.train_data)
				// var history = await this.model.train(this.train_data,qval)
				// console.log(this.train_data)
				var loss = await this.model.train(this.train_data)
				if (loss.history!=undefined){
					loss = loss.history.loss[0]
				}
				// console.log("HISTORY FIT",loss)
				this.chart.addData('episode_loss',{
					label : this.batch_pos,
					// loss : history.history.loss[0],
					loss : loss,
					epsilon : 0
				})
				if (this.batch_pos % 4==0){
					this.model.saveModels()
				}
				// fann_train_on_data(ann, train_data, NUM_TRAIN_EPOCHS, NUM_TRAIN_EPOCHS, 0.001);
			
			
			}else{
				
				// Alex here to continue 
				// memcpy(batch_mem[batch_pos].inputs, old_in_p, NUM_INPUTS * sizeof(fann_type));
				// memcpy(batch_mem[batch_pos].inputs_tp1, new_in_p, NUM_INPUTS * sizeof(fann_type));
				// memcpy(batch_mem[batch_pos].reward, reward, NUM_SERVO_MOT * sizeof(fann_type));
				// memcpy(batch_mem[batch_pos].servo_actions, actions, NUM_SERVO_MOT * sizeof(uint8_t));
				this.batch_mem.state.push(this.state);
				this.batch_mem.next_state.push(next_state);
				this.batch_mem.reward.push(all_reward);
				this.batch_mem.actions.push(actions);

				// this.batch_mem.push({
					// 'state' :  this.state,
					// 'next_state': next_state,
					// 'reward':  reward,
					// 'actions':  actions
				// })

				//this function use always backpropagation algorithm!
				//fann_set_training_algorithm has no effect!
				//or same as fann_set_training_algorithm = incremental and train epoch
				//train ann   , input, desired outputs
				//train only single data -> catastrophic forgetting could happen in the first MAX_BATCH_MEM moves
				var xtensor = tf.tensor(this.state).reshape([1,8])
				// var ytensor = tf.tensor(all_reward).reshape([1,12])
				// should be reward here!!, no qval
				var history = await this.model.network.fit(xtensor,qval)
				
			}
			this.batch_pos++;
			// Exponentially decay the exploration parameter
			if(this.eps > g_settings.min_epsilon) {
				this.eps -= ( 1.0 / g_settings.maxStepsPerGame );
			}
		}else{
		// var done = this.environment.isDone()
		// if (done){
			this.pause_training("out of boundaries")
		}
		this.state = next_state
		// this.log("Training complete")
    }

	
	async play(){
		// console.log("PLAYING")
        // this.environment.init();
        
        // let totalReward = 0;
        // let step = 0;
		// var cnt_rnd_moves  = 0
        // while (step < this.maxStepsPerGame) {
			var state = this.environment.getState();
			var qval = this.model.predict(state)
			this.chart.updateData('actions',{
				labels : this.actions_labels,
				actions : qval.dataSync()
			})
			var actions = []
			for (var s = 0 ; s<this.numServos;s++){
				actions.push(this.model.getMaxQandAction(s,qval.dataSync()).action)
				// move_dist += fabsf(new_inputs[x] - new_inputs[x + NUM_SERVO_MOT]);
			}
			// console.log("actions",actions)
			var hasmoved = await this.environment.step(actions)
			// console.log("hasMoved?",hasmoved,this.cnt_rnd_moves)
		
			// alex to continuer here
			//push the network to move in a loop
			if(hasmoved==false)
			{

				if(this.cnt_rnd_moves++ > 3)
				{
					// this.cnt_rnd_moves = 0;
					
					// var actions = []
					// for(var x = 0; x < this.numServos; x++)
					// {
						// actions.push(Math.floor(Math.random()  * this.numActions/this.numServos))
					// }
					// this.log("Robot stopping! Use random move! " + actions);
					// await this.environment.step(actions)
				}
			}
		// }
	}
	
	log(text){
		var now = new Date().toLocaleTimeString() //.replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3")
		$('#log').prepend('<div>' + now + ': ' + text + '</div>')		
	}
	

	async training(_this_game){
		
		if (!_this_game){
			_this_game = this;
		}
		// console.log(_this_game)
		if (_this_game.servos_start_date==undefined){
			_this_game.servos_start_date = new Date()
		}
		var t = new Date()
		if (t-_this_game.servos_start_date>3 * 60 * 1000){
		// if (t-_this_game.servos_start_date>10 * 1000){
			_this_game.freeze_training()
			setTimeout(function(){
				_this_game.servos_start_date = new Date()
				_this_game.unfreeze_training()
			},1000 * 60)
			// },5000)
		}else{
			_this_game.started = true;
			// console.log(_this_game.active)
			// while (step < this.maxStepsPerGame) {
			if (_this_game.active==true){
				if (this.steps <= this.maxStepsPerGame) {
					await _this_game.handleReinforcementLearning()
					await _this_game.training(_this_game)
				}else{
					// await this.replay()
				}
			}
		}
	}
	
	async play_job(_this_game){
		if (!_this_game){
			_this_game = this;
		}
		
		if (this.cnt_rnd_moves==undefined){
			this.cnt_rnd_moves  = 0	
		}
		if (_this_game.isplay==true){
			await _this_game.play()
			await _this_game.play_job(_this_game)
			
			}
		
	}	
	async reset_training(pause,msg) {
		
		if (pause==true){
			if (this.active!=false){
				this.pause_training(msg)
			}
			this.active = false
		}
		$("#train_button").addClass('disabled')
		await this.environment.init()
		$("#reset_button").removeClass('active')

		$("#train_button").removeClass('disabled')
		$("#play_button").removeClass('disabled')
		if (msg==undefined){
			this.log("training reseted : end of episode")
		}else{
			this.log("training reseted : " + msg)
		}
	}
	async freeze_training() {
		// this.log("dog tired")
		$("#train_button").addClass('disabled')
		$("#reset_button").addClass('disabled')
		this.pause_training("dog tired")
		// $("#reset_button").addClass('disabled')
		// $("#stop_button").addClass('disabled')
	}
	async unfreeze_training() {
		// this.log("dog relieved")
		$("#train_button").removeClass('disabled')
		$("#reset_button").removeClass('disabled')
		this.resume_training("dog relieved")
	}
	async resume_training(msg) {
		// console.log("PAUSE TRAINING")
		
		
		if (this.started==true){
			if (msg){
				this.log("training resumed, " + msg)
			}else{
				this.log("training resumed")	
			}
		}else{
			this.log("training started")
		}
		this.active = true
		$("#train_button").addClass('active')
		$("#reset_button").removeClass('disabled')
		$("#sonar_button").addClass('disabled')
		$("#stop_button").removeClass('disabled')
		$("#play_button").addClass('disabled')
		await this.training()
	}
	async pause_training(msg) {
		// console.log("PAUSE TRAINING")
		if (msg){
			this.log("training paused, " + msg)
		}else{
			this.log("training paused")	
		}
		$("#train_button").removeClass('active')
		this.active = false
	}

	async stop_training() {
		// if (this.active==true){
			this.log("training stopped")
			$("#train_button").removeClass('active')
			$("#train_button").addClass('disabled')
			$("#reset_button").addClass('disabled')
			$("#stop_button").addClass('disabled')
			// $("#play_button").removeClass('active')
			// $("#play_button").removeClass('disabled')
			this.active = false
			this.isplay = false
			// let training finish
			this.started = false
			setTimeout(function(){
				// game = new Orchestrator();
				game.init().then(function(){
					// game.handleReinforcementLearning()
					$("#train_button").removeClass('disabled')
					$("#stop_button").removeClass('disabled')
					$("#play_button").removeClass('disabled')
					// game.play()
				})
			},2000)
		// }
	}
	

	
}



var game;

$(function(){
	// (async() => {
		// let sars = new actor_critic();
		// console.log("starting a2c main")
		// sars.train();
	// })();
	game = new Orchestrator();
	game.init().then(function(){
		// game.handleReinforcementLearning()
		$("#train_button").removeClass('disabled')
		$("#reset_button").removeClass('disabled')
		$("#play_button").removeClass('disabled')
		$("#reset_button").removeClass('active')
		// $("#reset_button").removeClass('disabled')
	})
	// console.log()
	// sars.active = false
	
	$("#train_button").on('click',function(){
			if (!$(this).hasClass('disabled')){
			if($(this).hasClass("active")){
				game.pause_training()
			}else{
				game.resume_training()
			}
		}
		
	})
	$("#reset_button").on('click',function(){
		// var $this = this
		if (!$(this).hasClass('disabled') && !$(this).hasClass('active')){
			// console.log("CLICK RESET")
			// sars.active = false
			game.reset_training(true,"manually reseted")
			// $("#train_button").removeClass("active")
			// sars.reset = true
		}
	})	
	$("#erase_button").on('click',function(){
		// console.log("erase")
		game.resetModel()
	})
	$("#stop_button").on('click',function(){
		if (!$(this).hasClass('disabled')){
			game.stop_training()

		}
		
	})	
	$("#play_button").on('click',function(){
		if (!$(this).hasClass('disabled')){
			if ($(this).hasClass('active')){
				game.isplay = false;
				$(this).removeClass('active')
				$("#train_button").removeClass('disabled')
				$("#reset_button").removeClass('disabled')
				$("#stop_button").removeClass('disabled')
			}else{
				$(this).addClass('disabled')
				game.isplay = true
				// console.log(game)
				game.play_job()
				$(this).addClass('active')
				$(this).removeClass('disabled')
				$("#train_button").addClass('disabled')
				$("#reset_button").addClass('disabled')
				$("#stop_button").addClass('disabled')
			}

		}
		
	})		
})






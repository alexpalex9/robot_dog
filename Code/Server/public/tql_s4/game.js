// dqn js = https://github.com/prouhard/tfjs-mountaincar/blob/master/src/js/
// robot 4 leg C = https://github.com/Counterfeiter/Q-LearningRobot/blob/master/Src/ann.c

const MIN_EPSILON = 0.01;
// const MAX_EPSILON = 0.2;
const MAX_EPSILON = 1;
// const LAMBDA = 0.01;
const LAMBDA = 0.001;

class Orchestrator {
   
    constructor() {
		
		this.batchSize = 1
		
        // The main components of the environment
        this.environment = new Environment(g_settings.agent.depth,g_settings.agent.servos);;
		// var numActions = this.environment.get_actions_count()
		var numInputs = this.environment.get_inputs_count()
		var numServos = this.environment.get_servos_count()
		this.model = []
		console.log("numServos",numServos)
		for (var s = 0; s< numServos; s++){
			this.model.push(new Model(this.environment.get_actions_servos_index(s),this.environment.get_states_index(),s))
			this.model[s].loadModel()
		}
		
     // hiddenLayerSizes, numStates, numActions)
		// this.memory = new Memory(100)
        // The exploration parameter
        this.maxStepsPerGame = g_settings.agent.maxStepsPerGame;
        // this.discountRate = g_settings.agent.discountRate;

        // Keep tracking of the elapsed steps
       

        // Initialization of the rewards and max positions containers
		
        
        // this.maxPositionStore = new Array();
		// this.episode = 0
		
		
    }
	resetModel(){
		this.model = new Model(this.environment.get_actions_index(),this.environment.get_states_index())	
	}
	async init(){
		console.log("Creating game")
		await this.environment.init();
		this.state = this.environment.getState();
		this.totalReward = 0
		this.episode = 0
		this.chart = new myCharts()
		this.rewardStore = new Array();
		 this.eps = MAX_EPSILON;
		  this.steps = 0;
       
		
	}
   
    async handleReinforcementLearning() {
		console.log('------------- handleReinforcementLearning ---------------')
        // this.environment.init();
        // let state = this.environment.getState();
        // let state_tensor = tf.tensor2d(state, [1, state.length])
        // let totalReward = 0;
        // let step = 0;
		// this.eps = MAX_EPSILON;
        
			this.state = this.environment.getState();
			var actions = []
			// var actions_index = []
			for(var m in this.model){
				 //{ actions,actions_index} = 
				// var chosen_action = this.model[m].chooseAction(this.state, this.eps)
				// actions.push(chosen_action.actions)
				actions.push(this.model[m].chooseAction(this.state, this.eps))
				// actions_index.push(chosen_action.angle_scaled)
			}
			// console.log("chosen actions",actions,actions_index)
            await this.environment.step(actions);
            const reward = this.environment.getReward();
			
			var done = this.environment.isDone()
			// await this.environment.step(action)
			if (!done){
				this.chart.addData('step_reward',{
					label : this.steps,
					reward : reward,
					epsilon : this.eps
				})
				let nextState =  this.environment.getState();
				// let nextState_tensor =  tf.tensor2d(nextState, [1, nextState.length])

				// Keep the car on max position if reached
				// if (this.mountainCar.position > maxPosition) maxPosition = this.mountainCar.position;
				if (done) nextState = null;
				for(var m in this.model){
					await this.model[m].train(this.state,reward,actions[m].angle_scaled,nextState)
				}
				
				 // this.memory.addSample([this.state_tensor, action, reward, nextState_tensor]);
				 // console.log('memory',this.memory)
				// }
				this.steps += 1;
				// Exponentially decay the exploration parameter
				this.eps = MIN_EPSILON + (MAX_EPSILON - MIN_EPSILON) * Math.exp(-LAMBDA * this.steps);
				// if(this.eps > 0.1)
				// epsilon -= ( 1.0 / epochs );
		
				// this.state = nextState;
				this.totalReward += reward;
				this.steps += 1;
				
				
					
				
				if (this.steps % 20 ==0){
					for(var m in this.model){
						this.model[m].saveModel()
					}
				}
			}else{
				this.pause_training("out of boundaries : " + this.environment.sonic_state + 'cm')	
			}
			// Keep track of the max position reached and store the total reward
			// if (done || step == this.maxStepsPerGame) {
				// this.rewardStore.push(totalReward);
				// this.rewardStore.push(totalReward);
				// this.maxPositionStore.push(maxPosition);
				// break;
			// }
        // }
        // await this.replay()
    }
	
	async play(){
        // this.environment.init();
        
        // let totalReward = 0;
        let step = 0;
        while (this.isplay!=false) {// && this.environment.isDone()!=true) {
			var state = this.environment.getState();
			var actions = []
			for (var m in this.model){
				actions.push(this.model[m].chooseAction(state, -1))
			}
            await this.environment.step(actions);
            const reward = this.environment.getReward();
			this.chart.addData('step_reward',{
				label : step,
				reward : reward,
				epsilon : this.eps
			})

		
			this.steps += 1;

			
        }		
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
				if (this.steps < this.maxStepsPerGame) {
					await _this_game.handleReinforcementLearning(new Date(),false)
					await _this_game.training(_this_game)
				}else{
					// await this.replay()
				}
			}
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
		
		// console.log("CHECK REWARD EPISODE SUM",this.m_dogInfo)

		await this.environment.init()
		$("#reset_button").removeClass('active')
		// for (var i=0; i<this.m_cartPoleInfo.length;i++){
			// this.m_cartPoleInfo[i].reset(false)
		// }
		// window.reinforcement_info.episode++;
		// window.reinforcement_model.loss = {
			// policy : [],
			// value : [],
			// entropy : [],
			// total:[]
			
		// }
		$("#train_button").removeClass('disabled')
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
	agent:{
		// nSteps : 200,
		depth : 1,
		hiddenLayerSizes:[24,24],
		// maxStepsPerGame : 200,
		maxStepsPerGame : 1200,
		// maxStepsPerGame : 5,
		// maxStepsPerGame : 2,
		discountRate : 0.99,
		servos : [
			{'name':2,'init':0,'used':false},
			// {'name':3,'init':80,'used':true,'min':70,'max':90,'step':10,'actions':[70,80,90]},
			{'name':3,'init':70,'used':true,'min':70,'max':90,'step':10,'actions':[70,90]},
			{'name':4,'init':105,'used':false},
			{'name':5,'init':0,'used':false},
			// {'name':6,'init':87,'used':true,'min':90,'max':110,'step':10,'actions':[77,87,97]},
			{'name':6,'init':77,'used':true,'min':90,'max':110,'step':10,'actions':[77,97]},
			{'name':7,'init':105,'used':false},
			{'name':8,'init':75,'used':false},
			// {'name':9,'init':87,'used':true,'min':77,'max':97,'step':10,'actions':[77,87,97]},
			{'name':9,'init':77,'used':true,'min':77,'max':97,'step':10,'actions':[77,97]},
			{'name':10,'init':180,'used':false},
			{'name':11,'init':75,'used':false},
			// {'name':12,'init':90,'used':true,'min':80,'max':100,'step':10,'actions':[80,90,100]},
			{'name':12,'init':80,'used':true,'min':80,'max':100,'step':10,'actions':[80,100]},
			{'name':13,'init':180,'used':false},
			{'name':15,'init':90,'used':false,'label':'head'},
		]	
	}

};

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
				console.log(game)
				game.play()
				$(this).addClass('active')
				$(this).removeClass('disabled')
				$("#train_button").addClass('disabled')
				$("#reset_button").addClass('disabled')
				$("#stop_button").addClass('disabled')
			}

		}
		
	})		
})






// dqn js = https://github.com/prouhard/tfjs-mountaincar/blob/master/src/js/
// robot 4 leg C = https://github.com/Counterfeiter/Q-LearningRobot/blob/master/Src/ann.c

const MIN_EPSILON = 0.01;
// const MAX_EPSILON = 0.2;
const MAX_EPSILON = 1;
const LAMBDA = 0.01;

class Orchestrator {
   
    constructor(discountRate, maxStepsPerGame) {
		
		this.batchSize = 1
		
        // The main components of the environment
        this.environment = new Environment(g_settings.agent.depth,g_settings.agent.servos);;
		// var numActions = this.environment.get_actions_count()
		var numInputs = this.environment.get_inputs_count()
		// TODO: dyn actions count
		console.log("numInputs",numInputs)
        this.model = new Model(g_settings.agent.hiddenLayerSizes,numInputs,8)
     // hiddenLayerSizes, numStates, numActions)
		this.memory = new Memory(100)
        // The exploration parameter
        this.eps = MAX_EPSILON;

        // Keep tracking of the elapsed steps
        this.steps = 0;
        this.maxStepsPerGame = g_settings.agent.maxStepsPerGame;
        this.discountRate = g_settings.agent.discountRate;

        // Initialization of the rewards and max positions containers
		
        this.rewardStore = new Array();
        // this.maxPositionStore = new Array();
		this.episode = 0
		
		this.chart = new myCharts()
    }

	async create(){
		console.log("Creating game")
		await this.environment.init();
	}
   
    async handleReinforcementLearning() {
		console.log('------------- handleReinforcementLearning ---------------')
        // this.environment.init();
        let state = this.environment.getState();
        let state_tensor = tf.tensor2d(state, [1, state.length])
        let totalReward = 0;
        let step = 0;
        while (step < this.maxStepsPerGame) {
			

            // Interaction with the environment
            const action = this.model.chooseAction(state_tensor, this.eps);
			console.log("action",action)
            await this.environment.step(action);
            const reward = this.environment.getReward();
			this.chart.addData('step_reward',{
				label : step,
				reward : reward,
				epsilon : this.eps
			})
			var done = this.environment.isDone()
			await this.environment.step(action)
			
            let nextState =  this.environment.getState();
            let nextState_tensor =  tf.tensor2d(state, [1, nextState.length])

            // Keep the car on max position if reached
            // if (this.mountainCar.position > maxPosition) maxPosition = this.mountainCar.position;
            if (done) nextState = null;

       
			 this.memory.addSample([state_tensor, action, reward, nextState_tensor]);
			 // console.log('memory',this.memory)
			// }
			this.steps += 1;
			// Exponentially decay the exploration parameter
			this.eps = MIN_EPSILON + (MAX_EPSILON - MIN_EPSILON) * Math.exp(-LAMBDA * this.steps);

			state_tensor = nextState_tensor;
			totalReward += reward;
			step += 1;
			
			// Keep track of the max position reached and store the total reward
			if (done || step == this.maxStepsPerGame) {
				// this.rewardStore.push(totalReward);
				this.rewardStore.push(totalReward);
				// this.maxPositionStore.push(maxPosition);
				break;
			}
        }
        await this.replay()
    }

    async replay() {
		// Sample from memory
        const batch = this.memory.sample(this.batchSize);
		// var batch = this.memory.samples
		
        const states = batch.map(([state, , , ]) => state);
        const nextStates = batch.map(
            ([, , , nextState]) => nextState ? nextState : tf.zeros([this.model.numInputs])
        );
        // Predict the values of each action at each state
        const qsa = states.map((state) => this.model.predict(state));
        // Predict the values of each action at each next state
        const qsad = nextStates.map((nextState) => this.model.predict(nextState));

        let x = new Array();
        let y = new Array();

        // Update the states rewards with the discounted next states rewards
        batch.forEach(
            ([state, action, reward, nextState], index) => {
                const currentQ = qsa[index];
                currentQ[action] = nextState ? reward + this.discountRate * qsad[index].max().dataSync() : reward;
                x.push(state.dataSync());
                y.push(currentQ.dataSync());
            }
        );

        // Clean unused tensors
        qsa.forEach((state) => state.dispose());
        qsad.forEach((state) => state.dispose());

		// console.log("x,y",x,y)
        // Reshape the batches to be fed to the network
        x = tf.tensor2d(x, [x.length, this.model.numInputs])
        y = tf.tensor2d(y, [y.length, this.model.numActions])

        // Learn the Q(s, a) values given associated discounted rewards
        var loss = await this.model.train(x, y);
		this.chart.addData('episode_loss',{
			label : this.episode,
			loss : loss,
			epsilon : this.eps
			
		})
		this.chart.cleanData('step_reward')
		this.episode = this.episode + 1
        x.dispose();
        y.dispose();
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
			if (_this_game.active==true){
				
				await _this_game.handleReinforcementLearning(new Date(),false)
				await _this_game.training(_this_game)
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

		await this.m_reinforcementEnvironment.init()
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
		this.log("training stopped")
		$("#train_button").removeClass('active')
		$("#reset_button").addClass('disabled')
		$("#stop_button").addClass('disabled')
		this.active = false
		this.started = false
		let game = new PlayGame();
		game.create().then(function(){
			// game.handleReinforcementLearning()
			$("#train_button").removeClass('disabled')
			$("#stop_button").removeClass('disabled')
		})
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
		depth : 3,
		hiddenLayerSizes:[24,24],
		// maxStepsPerGame : 200,
		maxStepsPerGame : 100,
		// maxStepsPerGame : 2,
		discountRate : 0.99,
		servos : [
			{'name':2,'init':0,'used':false},
			// {'name':3,'init':80,'used':true,'min':70,'max':90,'step':10,'actions':[70,80,90]},
			{'name':3,'init':70,'used':true,'min':70,'max':90,'step':10,'actions':[70,90]},
			{'name':4,'init':97,'used':false},
			{'name':5,'init':0,'used':false},
			// {'name':6,'init':87,'used':true,'min':90,'max':110,'step':10,'actions':[77,87,97]},
			{'name':6,'init':77,'used':true,'min':90,'max':110,'step':10,'actions':[77,97]},
			{'name':7,'init':97,'used':false},
			{'name':8,'init':85,'used':false},
			// {'name':9,'init':87,'used':true,'min':77,'max':97,'step':10,'actions':[77,87,97]},
			{'name':9,'init':77,'used':true,'min':77,'max':97,'step':10,'actions':[77,97]},
			{'name':10,'init':180,'used':false},
			{'name':11,'init':86,'used':false},
			// {'name':12,'init':90,'used':true,'min':80,'max':100,'step':10,'actions':[80,90,100]},
			{'name':12,'init':80,'used':true,'min':80,'max':100,'step':10,'actions':[80,100]},
			{'name':13,'init':180,'used':false},
			{'name':15,'init':90,'used':false,'label':'head'},
		]	
	}

};



$(function(){
	// (async() => {
		// let sars = new actor_critic();
		// console.log("starting a2c main")
		// sars.train();
	// })();
	let game = new Orchestrator();
	game.create().then(function(){
		// game.handleReinforcementLearning()
		$("#train_button").removeClass('disabled')
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
	$("#stop_button").on('click',function(){
		if (!$(this).hasClass('disabled')){
			game.stop_training()

		}
		
	})	
	
})






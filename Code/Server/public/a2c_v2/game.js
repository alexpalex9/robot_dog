

class PlayGame {

    constructor (params)
    {
        // super({key : 'PlayGame', active : false});

        this.m_mode = "USER";
        this.m_lineGraphic = null;
        this.m_cartGraphics = null;
        this.m_poleGraphics = null;
        this.m_controls = null;
        this.m_cursors = null;
        

        this.m_reinforcementEnvironment = null;

        // create reinforcement learning model
        window.reinforcement_model = null;
        window.aiModeInitialized = false;

        window.reinforcement_info = 
        {
            episode : 0,        // current episode
            allRewards : [],     // list of rewards of all episodes
            tmpNStepReward : 0
        };

        // this.m_visualizationSurface = tfvis.visor().surface({ name: 'Rewards', tab: 'Charts' });
        // this.m_actionSurface = tfvis.visor().surface({ name: 'Actions', tab: 'Charts' });
		
		
		
        this.m_visualizationRewardData = [];
        // this.m_visualizationRewardData_chart = {
			// label : [],
			// reward : []
		// };

        this.m_cartPoleInfo = new EpisodeInfo();

        // this.m_scoreText = null;

        this.m_debugMemory = false;

        this.m_waitRestart = false;
        
    }
     
    // function to be executed when the scene is loading
    preload(){
        //console.log("#####> preload <#####");

        /*
        this.load.image("crate", "crate.png");

        this.load.image("rock_full", "data/rock_full.png");
        this.load.image("rock_left_right", "data/rock_left_right.png");
        this.load.image("rock_left_left", "data/rock_left_left.png");
        this.load.image("rock_right_right", "data/rock_right_right.png");
        this.load.image("rock_right_left", "data/rock_right_left.png");

        this.load.image("rock_tileset", "data/rock_map.png");

        this.load.image("car", "data/car_blue_5.png");
        this.load.image("car2", "data/car_red_5.png");

        this.load.image('road_bkg_center', 'data/road_sand18.png');
        this.load.image('road_bkg_left', 'data/road_sand17.png');
        this.load.image('road_bkg_right', 'data/road_sand19.png');

        this.load.image('road_bkg_arrival_left', 'data/road_sand65.png');
        this.load.image('road_bkg_arrival_center', 'data/road_sand66.png');
        this.load.image('road_bkg_arrival_right', 'data/road_sand67.png');
        //*/
        
    }

    // function to be executed once the scene has been created
    async create(params)
    {
        //console.log("#####> create <#####");

        if (params !== null && typeof params !== 'undefined')
        {
            this.m_mode = params.mode;
        }

        console.log("Scene launched in " + this.m_mode + " mode");
        console.log(tf.memory());
		// Create reinforcement learning environment
        this.m_reinforcementEnvironment = new Environment(g_settings.agent.depth,g_settings.agent.servos);
		await this.m_reinforcementEnvironment.init();
    
    // create reinforcement learning model if required
        window.reinforcement_info.tmpNStepReward = 0;
        let reinforcementModelJustCreated = false;
        if (this.m_mode == "RL_TRAIN" && (window.reinforcement_model === null || typeof window.reinforcement_model === 'undefined'))
        {
            window.reinforcement_model = new PolicyBasedAgent(this.m_reinforcementEnvironment.get_inputs_count() * g_settings.agent.depth,this.m_reinforcementEnvironment.get_actions_count());
            window.reinforcement_info.episode = 0;
            window.reinforcement_info.allRewards = [];
            window.aiModeInitialized = false;
            // this.m_visualizationRewardData = [];
            // this.m_visualizationRewardData_chart = {
				// label : []
				// reward : []
			// }
            reinforcementModelJustCreated = true;
        }
        else if (this.m_mode == "AI" && window.aiModeInitialized == false)
        {
            window.aiModeInitialized = true;
            window.reinforcement_info.episode = 0;
            window.reinforcement_info.allRewards = [];
            // this.m_visualizationRewardData = [];
			// this.m_visualizationRewardData_chart = {
				// label : []
				// reward : []
			// }
        }
        else if (this.m_mode == "USER")
        {
            window.aiModeInitialized = false;
        }

        // reset restart variable
        this.m_waitRestart = false;

		

        
        // reset episode info
        // In Actor Critic n-step we should not reset everything as
        // we may not have a complete n-step
        let resetingDuringNStep = (this.m_mode == "RL_TRAIN" && window.reinforcement_model !== null && window.reinforcement_model.hasNSteps() && !reinforcementModelJustCreated);
        this.m_cartPoleInfo.reset(resetingDuringNStep);
        

        // let world_width = this.m_reinforcementEnvironment.getWorldWidth();
        // let scale = game.config.width / world_width;

        // setting Matter world bounds
        /*
        this.matter.world.setBounds(mazeBoundingBox.startX, 
                                    mazeBoundingBox.startY, 
                                    mazeBoundingBox.endX - mazeBoundingBox.startX, 
                                    mazeBoundingBox.endY - mazeBoundingBox.startY);
        //*/

        // Graphics object used to draw rays
        // this.m_lineGraphic = this.add.graphics();
        // this.m_lineGraphic.lineStyle(1, 0xFF00FF, 0.25); // width, color, alpha

        // this.m_cartGraphics = this.add.graphics();
        // this.m_cartGraphics.fillStyle(0xFF0000, 1.0); // color, alpha
        // this.m_poleGraphics  = this.add.graphics();
        // this.m_poleGraphics.lineStyle(10, 0x0000FF, 1.0); // width, color, alpha

        // Configure the camera
        // const camera = this.cameras.main;
        // Constrain the camera so that it isn't allowed to move outside the maze bounding box
        /*
        camera.setBounds(   mazeBoundingBox.startX,
                            mazeBoundingBox.startY, 
                            mazeBoundingBox.endX - mazeBoundingBox.startX, 
                            mazeBoundingBox.endY - mazeBoundingBox.startY);
        // center the camera
        camera.scrollX = mazeBoundingBox.startX + (mazeBoundingBox.endX - mazeBoundingBox.startX)/2;
        
        camera.setBounds(   cameraBoundingBox.startX,
            cameraBoundingBox.startY, 
            cameraBoundingBox.endX - cameraBoundingBox.startX, 
            cameraBoundingBox.endY - cameraBoundingBox.startY);
        
        
        //camera.setPosition( mazeBoundingBox.startX + (mazeBoundingBox.endX - mazeBoundingBox.startX)/2);
        // Start following ship
        camera.startFollow(this.m_ship.gameobject);
        //*/

        // Set up the arrows to control the cart
        // this.m_cursors = this.input.keyboard.createCursorKeys();


        // Add button to quit training 
        // this.add.existing(new TextButton(this, game.config.width, 30, 'Quit...', g_settings.style.buttonStyles, () => this.endGame())
                                // .setOrigin(1.0)
                                // .setScrollFactor(0));
        
        if (window.reinforcement_info.episode <= 0){
            // this.m_scoreText = this.add.text(10, 10, 'Episode: 0 - Last/Mean Reward: 0 / 0', g_settings.style.textStyle1).setOrigin(0.0);
            // this.log('Episode: 0 - Last/Mean Reward: 0 / 0')
		}
        else
        {
            let meanReward = VectorUtils.mean( window.reinforcement_info.allRewards);
            let lastReward = window.reinforcement_info.allRewards[window.reinforcement_info.allRewards.length - 1];

            // this.m_scoreText = this.add.text(10, 10, 'Episode: ' +  window.reinforcement_info.episode + ' - Last/Mean Reward: ' + lastReward + ' / ' + meanReward,
                 // g_settings.style.textStyle1).setOrigin(0.0);
			// this.log('Episode: ' +  window.reinforcement_info.episode + ' - Last/Mean Reward: ' + lastReward + ' / ' + meanReward)
        }

    }
    
    async handleReinforcementLearning(time, debug)
    {
        // current reward correspond to previous action and state

        // Compute current state
		console.log("---------------NEW handleReinforcementLearning function-------------",this.m_cartPoleInfo)
        let newState = this.m_reinforcementEnvironment.getState();
		// console.log("newState",newState)
        // store reward corresponding to action and state choosen and computed at the previous update()
        //if (this.m_cartPoleInfo.episodeRewards.length > 0)
        //{
        //    this.m_cartPoleInfo.episodeRewards[this.m_cartPoleInfo.episodeRewards.length - 1] = this.m_reinforcementEnvironment.getReward();
        //}
        
        // predict reward with Value model
        if (window.reinforcement_model.hasValueModel())
        {
            this.logMemory("before value model predict");

            let predictedValueReward = tf.tidy(() => {

                const stateTensor = tf.tensor2d(newState, [1, newState.length]);
                let prediction = window.reinforcement_model.m_valueModel.predict(stateTensor).dataSync(); 
                //let prediction = window.reinforcement_model.internalPredict(stateTensor, true).dataSync(); // same result
                return prediction;
            });
            this.m_cartPoleInfo.episodeStateValues.push(predictedValueReward);
        }

        // Check if algorithm works on n-steps (e.g. A2C)
        if (window.reinforcement_model.hasNSteps())
        {
            if (this.m_cartPoleInfo.isEndOfNStep())
            {
                // console.log("###### n-step " + this.m_cartPoleInfo.episodeNStep + " step=" + this.m_cartPoleInfo.episodeUpdateSteps);
                // this.logMemory("before train (n-step)");
				
                // End the line
                // NB: All the info will be cleared for the next n-steps (the same state will be retrieved again)
                this.m_cartPoleInfo.episodeActions.push(0);         // fake action
                this.m_cartPoleInfo.episodeStates.push(newState);   // new state
                this.m_cartPoleInfo.episodeRewards.push(0);         // fake reward
                this.m_cartPoleInfo.episodeDones.push(0.0);           // fake done
                //this.m_cartPoleInfo.episodeStateValues            // Already pushed

                // Train the value and policy models
                // this.m_waitRestart = true;
                await window.reinforcement_model.trainModels(this.m_cartPoleInfo, false, debug)
                .then(
                    onTrainingNStepOverCallback.bind( { game : this, debug : debug})
                );

                // leave function now
				console.log("-> early stop")
                return;
            }
            else
            {
                console.log(">>>> step " + this.m_cartPoleInfo.episodeUpdateSteps);
            }
        }
		console.log("-> continue")
        // this.logMemory("before policy model predict");

        // predict the action to make with Policy model
        //  > compute action probability
        //  > choose action based on probability
        let predictedActionSoftmax = tf.tidy(() => {
            // NB: tf.tidy will clean up all the GPU memory used by tensors inside
            // this function, other than the tensor that is returned.

            const stateTensor = tf.tensor2d(newState, [1, newState.length]);
            let prediction = window.reinforcement_model.m_model.predict(stateTensor).dataSync(); 
            //let prediction = window.reinforcement_model.internalPredict(stateTensor, true).dataSync(); // same result
            return prediction;
        });
        //if (debug)
        //    console.log("RL predicted softmax" + predictedActionSoftmax);

        // this.logMemory("after policy model predict");

        // Compute choice based on action using softmax result as probabilities
        let action = VectorUtils.randomChoice(predictedActionSoftmax);
        this.m_cartPoleInfo.episodeActions.push(action);
        //if (debug)
        //    console.log("RL predicted " + action);

        // Apply the action
		// var t = new Date()
        await this.applyReinforcementAction(time, action);
		// console.log("TIME NEW STEP",new Date() - t)
        // Compute the state
        this.m_cartPoleInfo.episodeStates.push(newState);

        // Push the current reward
        this.m_cartPoleInfo.episodeRewards.push(this.m_reinforcementEnvironment.getReward());

        // Push done state
		
        let episodeDone = (this.m_reinforcementEnvironment.isDone() ||
                            (g_settings.reinforcement.maxSteps > 0 && this.m_cartPoleInfo.episodeUpdateSteps >=  g_settings.reinforcement.maxSteps));
        this.m_cartPoleInfo.episodeDones.push((episodeDone ? 1.0 : 0.0));

		console.log("CHECK EPISODE OVER",episodeDone,this.m_reinforcementEnvironment.isDone(),this.m_cartPoleInfo.episodeUpdateSteps,g_settings.reinforcement.maxSteps)
        // check if the episode should end
        if (episodeDone)
        {
            // episode is over
            // if (debug)
                // console.log("Episode over -- about to learn");

            // this.logMemory("before train");

            if (window.reinforcement_model.hasNSteps())
            {
                // if the algorithm works on n-steps (e.g. A2C) we do not train the models yet.
                // We only restart the game
				// console.log("TRAINING OVER",this.m_reinforcementEnvironment.isDone(),g_settings.reinforcement.maxSteps,this.m_cartPoleInfo.episodeUpdateSteps)
                // this.m_waitRestart = true;
				
                await this.onTrainingOver(debug);
				
            }
            else
            {
                // Train the value and policy models
				// this.m_waitRestart = true;
                await window.reinforcement_model.trainModels(this.m_cartPoleInfo, true, debug)
                .then(
                    await onTrainingOverCallback.bind( { game : this, debug : debug})
                );
            }


        }

    }

    async applyReinforcementAction(time, action)
    {
        // Update environment
        await this.m_reinforcementEnvironment.step(action);
        this.m_cartPoleInfo.onStep();
    }

    logMemory(msg)
    {
        if (this.m_debugMemory)
        {
            console.log(msg);
            // console.log(tf.memory());
        }
    }

    endGame()
    {
        // return to title screen
        this.scene.stop();
        this.scene.start('Title');
    }

    async onTrainingOver(debug)
    {
        // Display histogram with chosen actions
        // tfvis.render.histogram(this.m_actionSurface, this.m_cartPoleInfo.episodeActions, {});
		// this.charts.

        // this.logMemory("after train");

        // Store/display stats
        // compute the episode total reward
        let episodeRewardsSum = VectorUtils.sum(this.m_cartPoleInfo.episodeRewards) 
                                + window.reinforcement_info.tmpNStepReward;

        // Add to the list of epidode rewards
        window.reinforcement_info.allRewards.push(episodeRewardsSum);

        // Compute the mean of all the episode rewards (it should increase)
        let meanReward = VectorUtils.mean( window.reinforcement_info.allRewards);
        let maxReward = VectorUtils.max( window.reinforcement_info.allRewards);

        if (debug)
        {
            console.log("======================");
            console.log("Episode " + window.reinforcement_info.episode);
            console.log("  episode reward : " + episodeRewardsSum);
            console.log("  mean reward    : " + meanReward);
            console.log("  max reward    : " + maxReward);
            console.log("======================");
        }

        // write the score
        //this.m_scoreText.setText('Episode: ' +  window.reinforcement_info.episode + ' - Last/Mean Reward: ' + episodeRewardsSum + ' / ' + meanReward);

        // Add mean reward to visualization
        // this.m_visualizationRewardData.push(
            // { x: 1.0 *  window.reinforcement_info.episode, 
            // y: meanReward 
            // }
        // );
		// this.m_visualizationRewardData_chart.label.push
				// label : []
				// reward : []
			// }
        // let series = { values : [ this.m_visualizationRewardData] , series : ["MeanRewards"]};
        // tfvis.render.linechart(this.m_visualizationSurface, series, {});
		// console.log("REWARD DATA CHART EPISODE",this.m_visualizationRewardData, window.reinforcement_info.episode)
		var value_loss = VectorUtils.mean(window.reinforcement_model.get_loss_value_data())
		var PolicyEntropy = VectorUtils.mean(window.reinforcement_model.get_PolicyEntropy_data())
		window.reinforcement_model.reset_data()
		
		window.reinforcement_model.charts.addData('reward_episodes',{
			label : 1.0 *  window.reinforcement_info.episode,
			reward : meanReward,
			PolicyEntropy: PolicyEntropy,
			value_loss: value_loss
		})
		// window.reinforcement_model.charts.cleanData('reward')
        // move to next episode
        window.reinforcement_info.episode++;
		// console.log("TRAINING OVER")
        // this.scene.restart({ mode : this.m_mode});
		await this.create({ mode : this.m_mode})
           
    }

    onTrainingNStepOver(debug)
    {
        // Display histogram with chosen actions
        //tfvis.render.histogram(this.m_actionSurface, this.m_cartPoleInfo.episodeActions, {});

        this.logMemory("after train n-step");

        // Store/display stats
        // compute the episode total reward
        let episodeRewardsSum = VectorUtils.sum(this.m_cartPoleInfo.episodeRewards);

        // Add to the list of epidode rewards
        window.reinforcement_info.tmpNStepReward += episodeRewardsSum;

        if (debug)
        {
            console.log("------ n-step over with rw=" + episodeRewardsSum + 
                        " (sum =" + window.reinforcement_info.tmpNStepReward+ ") ------");
        }
		// let meanReward = VectorUtils.mean( window.reinforcement_info.allRewards);
        // let maxReward = VectorUtils.max( window.reinforcement_info.allRewards);
		console.log("REWARD CHART STEP",episodeRewardsSum)
		window.reinforcement_model.charts.addData('reward',{
			label : 1.0 *  this.m_cartPoleInfo.globalStep,
			reward : episodeRewardsSum
		})
        // Move to next n-step
        this.m_cartPoleInfo.onNewNStep();

        //this.scene.restart({ mode : this.m_mode});
        this.m_waitRestart = false;
           
    }

    // compute the sum
    sum(values)
    {
        let sum = values.reduce(function(a, b) { return a + b; });
        return sum;
    }

    max(values)
    {
        let max = values.reduce(function(a, b) { return ((a > b)?a : b); });
        return max;
    }

    // Compute the mean of the array
    mean(values)
    {
        if (values.length == 0)
            return 0;
        let sum = values.reduce(function(a, b) { return a + b; });
        let average = sum / values.length;
        return average;
    }
	
	log(text){
		var now = new Date().toLocaleTimeString() //.replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3")
		$('#log').prepend('<div>' + now + ': ' + text + '</div>')		
	}
	
	
	async training(_this_game){
		if (!_this_game){
			_this_game = this;
		}

		_this_game.started = true;

		if (_this_game.active==true){
			await _this_game.handleReinforcementLearning(new Date(),false)
			await _this_game.training(_this_game)
		}
		
	}
	
	
	async reset_training(pause) {
		
		if (pause==true){
			if (this.active!=false){
				this.pause_training()
			}
			this.active = false
		}
		$("#train_button").addClass('disabled')
		
		// console.log("CHECK REWARD EPISODE SUM",this.m_dogInfo)

		await this.m_reinforcementEnvironment.init()
		// this.m_cartPoleInfo.reset(false)
		// window.reinforcement_info.episode++;
		// window.reinforcement_model.loss = {
			// policy : [],
			// value : [],
			// entropy : [],
			// total:[]
			
		// }
		$("#train_button").removeClass('disabled')
		this.log("training reseted")
		
		
		
	}	
	async resume_training() {
		// console.log("PAUSE TRAINING")
		if (this.started==true){			
			this.log("training resumed")
		}else{
			this.log("training started")
		}
		this.active = true
		$("#train_button").addClass('active')
		$("#reset_button").removeClass('disabled')
		$("#sonar_button").addClass('disabled')
		$("#stop_button").removeClass('disabled')
		this.training()
	}
	async pause_training() {
		// console.log("PAUSE TRAINING")
		this.log("training paused")
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
		game.create({
			mode : "RL_TRAIN"
			
		}).then(function(){
			// game.handleReinforcementLearning()
			$("#train_button").removeClass('disabled')
			$("#stop_button").removeClass('disabled')
		})
		
		
	}

}

function arraysIdentical(a, b) {
    var i = a.length;
    if (i != b.length) return false;
    while (i--) {
        if (a[i] !== b[i]) return false;
    }
    return true;
};

async function onTrainingOverCallback()
{
    await this.game.onTrainingOver(this.debug);
}

function onTrainingNStepOverCallback()
{
    this.game.onTrainingNStepOver(this.debug);
}





let g_settings = {
	// mode :"RL_TRAIN",
	agent:{
		algorithm : "A2C", // REINFORCE REINFORCE_BASELINE A2C
		nSteps : 1,
		depth : 4,
		// oneHotShape : 3  // class of action,
		servos : [
			{'name':2,'init':0,'used':false},
			{'name':3,'init':80,'used':true,'min':70,'max':90,'step':10,'actions':[60,80,100]},
			{'name':4,'init':90,'used':false},
			{'name':5,'init':0,'used':false},
			{'name':6,'init':87,'used':true,'min':90,'max':110,'step':10,'actions':[67,87,107]},
			{'name':7,'init':90,'used':false},
			{'name':8,'init':90,'used':false},
			{'name':9,'init':87,'used':true,'min':77,'max':97,'step':10,'actions':[67,87,107]},
			{'name':10,'init':180,'used':false},
			{'name':11,'init':90,'used':false},
			{'name':12,'init':90,'used':true,'min':80,'max':100,'step':10,'actions':[70,90,110]},
			{'name':13,'init':180,'used':false},
			{'name':15,'init':90,'used':false,'label':'head'},
		]
		
	},
	valuemodel:{
		epochs : 1,
		layers : 3,
		units : 24,
		learningRate : 0.01, // 0.005,
		// learningRate : 0.005, // 0.005,
		miniBatchSize : 1
	},
	reinforcement:{
		maxSteps : 50,
		miniBatchSize : 1,
		epochsPerEpisode : 1,
		layers : 3,
		units : 24,
		learningRate : 0.01, // 0.005,
		// learningRate : 0.005,
		gammaDiscountRate : 0.95,
		// gammaDiscountRate : 0.99,

		// normalizeAdvantage : true,
		normalizeAdvantage : true,

		// slotCount : 10
	}

	// type: Phaser.AUTO,
	// width: 800,
	// height: 600,
	// parent: "gameContainer",
	// physics: {
		// default: 'matter',
		// matter: {
			// debug: true,
			// gravity: {
			// x: 0,
			// y: 0}
		// }   
	// },
	// scene: [Title, PlayGame]
};


$(function(){
	// (async() => {
		// let sars = new actor_critic();
		// console.log("starting a2c main")
		// sars.train();
	// })();
	let game = new PlayGame();
	game.create({
		mode : "RL_TRAIN"
	}).then(function(){
		// game.handleReinforcementLearning()
		$("#train_button").removeClass('disabled')
	})
	// console.log()
	// sars.active = false
	
	$("#train_button").on('click',function(){
		if (!$(this).hasClass('disabled')){
			// console.log($(this).hasClass("active"))
			if($(this).hasClass("active")){
				// console.log("PAUSE TRAINING")
				// $(this).removeClass("active")
				game.pause_training()
				// game.handleReinforcementLearning()
				// game.active = false
			}else{
				// console.log("TRAIN BUTTON",sars)
				// $(this).addClass("active")
				// sars.active = true
				// sars.train()
				// game.active = true
				// game.training()
				game.resume_training()
				
				
			}
		}
		
	})
	$("#reset_button").on('click',function(){
		// var $this = this
		if (!$(this).hasClass('disabled') && !$(this).hasClass('active')){
			// console.log("CLICK RESET")
			// sars.active = false
			game.reset_training(true)
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






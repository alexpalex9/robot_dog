class PlayGame{

    constructor ()
    {
        // super({key : 'PlayGame', active : false});

        // this.m_mode = "USER";
        this.m_mode = "RL_TRAIN";
        // this.m_lineGraphic = null;
        // this.m_cartGraphics = null;
        // this.m_poleGraphics = null;
        // this.m_controls = null;
        // this.m_cursors = null;
        

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

        this.m_dogInfo = new EpisodeInfo();

        this.m_scoreText = null;

        this.m_debugMemory = false;

        this.m_waitRestart = false;
        
		this.started = false
		this.active = false;
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
        // console.log(tf.memory());

        // create reinforcement learning model if required
        window.reinforcement_info.tmpNStepReward = 0;
        let reinforcementModelJustCreated = false;
        if (this.m_mode == "RL_TRAIN" && (window.reinforcement_model === null || typeof window.reinforcement_model === 'undefined'))
        {
            window.reinforcement_model = new PolicyBasedAgent();
            window.reinforcement_info.episode = 0;
            window.reinforcement_info.allRewards = [];
            window.aiModeInitialized = false;
            this.m_visualizationRewardData = [];
            reinforcementModelJustCreated = true;
        }
        else if (this.m_mode == "AI" && window.aiModeInitialized == false)
        {
            window.aiModeInitialized = true;
            window.reinforcement_info.episode = 0;
            window.reinforcement_info.allRewards = [];
            this.m_visualizationRewardData = [];
        }
        else if (this.m_mode == "USER")
        {
            window.aiModeInitialized = false;
        }

        // reset restart variable
        // this.m_waitRestart = false;

        // Create the environment

        // Create reinforcement learning environment
        this.m_reinforcementEnvironment = new Environment(g_settings.agent.depth,false);
		console.log("AWAIT INIT")
		await this.m_reinforcementEnvironment.init()
		console.log("AWAIT INIT - end")
        // reset episode info
        // In Actor Critic n-step we should not reset everything as
        // we may not have a complete n-step
        let resetingDuringNStep = (this.m_mode == "RL_TRAIN" && window.reinforcement_model !== null && window.reinforcement_model.hasNSteps() && !reinforcementModelJustCreated);
        this.m_dogInfo.reset(resetingDuringNStep);
        
        
        if (window.reinforcement_info.episode <= 0)
           console.log('Episode: 0 - Last/Mean Reward: 0 / 0')
        else
        {
            let meanReward = VectorUtils.mean( window.reinforcement_info.allRewards);
            let lastReward = window.reinforcement_info.allRewards[window.reinforcement_info.allRewards.length - 1];

            console.log('Episode: ' +  window.reinforcement_info.episode + ' - Last/Mean Reward: ' + lastReward + ' / ' + meanReward)
        }
		this.chart = myCharts()
		
    }
    

    update(delta)
    {
        if (this.m_waitRestart)
            return;

        // Apply the controls to the camera each update tick of the game
        if (this.m_controls !== null)
            this.m_controls.update(delta);
        
        let cursorX = 0.0;
        let cursorY = 0.0;


        // Update vehicle with user control
        if (this.m_mode == "USER" ||
            (this.m_mode == "AI" && g_settings.versus.opponent0 == OPPONENT_USER))
        {
            let action = -1;
            if (this.m_cursors.left.isDown)
            {
                action = 0;
            }
            else if (this.m_cursors.right.isDown)
            {
                action = 1;
            }

            // Update environment
            this.m_reinforcementEnvironment.step(action);

            // Check if game is done
            if (this.m_reinforcementEnvironment.isDone())
            {
                // restart
                this.scene.restart({ mode : this.m_mode});
            }
        }
        else if (this.m_mode == "RL_TRAIN")
        {
            // Handle reinfoircement learning
            // store reward, action, ...
            this.handleReinforcementLearning( true);
        }
        else if (this.m_mode == "AI")
        {
            // Control with stored model
            this.controlWithAI(true);
        }

        // render
    
        // Clear the lines
        //this.m_lineGraphic.clear();
        //this.m_lineGraphic.lineStyle(1, 0xFF00FF, 0.25); // width, color, alpha

        // let world_width = this.m_reinforcementEnvironment.getWorldWidth();
        // let scale = game.config.width / (1.0 * world_width);
        // let poleWidth = 100;
        // let poleY = 500;
        // let poleHeight = 100;

        // let cartRect = {
            // x : game.config.width / 2 + this.m_reinforcementEnvironment.getCartX() * scale - poleWidth/2,
            // y : poleY,
            // width : poleWidth,
            // height : poleHeight
        // }

        // let polePosition = {
            // x1 : game.config.width / 2 + this.m_reinforcementEnvironment.getCartX() * scale,
            // y1: poleY,
            // x2: 0,
            // y2: 0
        // }
        //polePosition.x2 = polePosition.x1 + this.m_reinforcementEnvironment.getPoleLength() * scale * Math.cos(Math.PI/2 + this.m_reinforcementEnvironment.getPoleTheta());
        //polePosition.y2 = polePosition.y1 - this.m_reinforcementEnvironment.getPoleLength() * scale * Math.sin(Math.PI/2 + this.m_reinforcementEnvironment.getPoleTheta());
        // polePosition.x2 = polePosition.x1 + this.m_reinforcementEnvironment.getPoleLength() * scale * Math.cos(-Math.PI/2 + this.m_reinforcementEnvironment.getPoleTheta());
        // polePosition.y2 = polePosition.y1 + this.m_reinforcementEnvironment.getPoleLength() * scale * Math.sin(-Math.PI/2 + this.m_reinforcementEnvironment.getPoleTheta());

        // Draw cart
        // this.m_cartGraphics.clear();
        // this.m_cartGraphics.fillStyle(0xFF0000, 1.0); // color, alpha
        // this.m_cartGraphics.fillRect(cartRect.x, cartRect.y, cartRect.width, cartRect.height);

        // Draw pole
        // this.m_poleGraphics.clear();
        // this.m_poleGraphics.lineStyle(10, 0x0000FF, 1.0); // width, color, alpha
        // this.m_poleGraphics.beginPath();
        // this.m_poleGraphics.moveTo(polePosition.x1, polePosition.y1);
        // this.m_poleGraphics.lineTo(polePosition.x2, polePosition.y2);
        // this.m_poleGraphics.closePath();
        // this.m_poleGraphics.strokePath();

        //console.log(cartRect);

    }


    
    async controlWithAI(debug)
    {
        // retrieve model
        let model = null;
        if (g_settings.versus.opponent0 == OPPONENT_CURRENT_AI)
        {
            if (window.reinforcement_model !== null)
                model = window.reinforcement_model.m_model;
            
            // current model if any
            if (model === null)
            {
                console.log("Error: No current AI !");
            }
        }
        else if (g_settings.versus.opponent0 > OPPONENT_CURRENT_AI)
        {
            // load model from slot
            model = g_settings.versus.storedModels.opponent0;
            if (model === null)
            {
                console.log("Error: No stored AI !");
            }
        }
        
        if (model === null)
            return;

        // Compute current state
        let newState = this.m_reinforcementEnvironment.getState();

        // predict the action to make with Policy model
        //  > compute action probability
        //  > choose action based on probability
        let predictedActionSoftmax = tf.tidy(() => {
            // NB: tf.tidy will clean up all the GPU memory used by tensors inside
            // this function, other than the tensor that is returned.

            const stateTensor = tf.tensor2d(newState, [1, newState.length]);
            let prediction = model.predict(stateTensor).dataSync(); 
            return prediction;
        });
        
        // Compute choice based on action using softmax result as probabilities
        // let action = VectorUtils.randomChoice(predictedActionSoftmax);
        let action = predictedActionSoftmax.indexOf(Math.max(...predictedActionSoftmax));
        this.m_dogInfo.episodeActions.push(action);
        //if (debug)
        //    console.log("RL predicted " + action);

        // Apply the action
        await this.applyReinforcementAction(action);

        // Compute the state
        this.m_dogInfo.episodeStates.push(newState);

        // Temporaly push the current reward
        // this reward will be overwritten by the value computed at the next update()
        //  (corresponding to the result of the choosen action)
        this.m_dogInfo.episodeRewards.push(this.m_reinforcementEnvironment.getReward());

        // check if the episode should end
        if (this.m_reinforcementEnvironment.isDone() || (g_settings.reinforcement.maxSteps > 0 && this.m_dogInfo.episodeUpdateSteps >=  g_settings.reinforcement.maxSteps))
        {
            // episode is over
            if (debug)
                console.log("Episode over");

            tfvis.render.histogram(this.m_actionSurface, this.m_dogInfo.episodeActions, {});
                
            // Store/display stats
            // compute the episode total reward
            let episodeRewardsSum = VectorUtils.sum(this.m_dogInfo.episodeRewards);

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
            this.m_visualizationRewardData.push(
                { x: 1.0 *  window.reinforcement_info.episode, 
                  y: meanReward 
                }
            );
            let series = { values : [ this.m_visualizationRewardData] , series : ["MeanRewards"]};
            tfvis.render.linechart(this.m_visualizationSurface, series, {});

            // move to next episode
            window.reinforcement_info.episode++;

            this.scene.restart({ mode : this.m_mode});
        }
    }

    async handleReinforcementLearning(debug)
    {
		// console.log("handleReinforcementLearning")
        // current reward correspond to previous action and state

        // Compute current state
        let state = this.m_reinforcementEnvironment.getState();
		// console.log("STATE=",state)
        // store reward corresponding to action and state choosen and computed at the previous update()
        //if (this.m_dogInfo.episodeRewards.length > 0)
        //{
        //    this.m_dogInfo.episodeRewards[this.m_dogInfo.episodeRewards.length - 1] = this.m_reinforcementEnvironment.getReward();
        //}
        
        // predict reward with Value model
        if (window.reinforcement_model.hasValueModel())
        {
            // this.logMemory("before value model predict");

            let predictedValueReward = window.reinforcement_model.predict_value(state)
            this.m_dogInfo.episodeStateValues.push(predictedValueReward);
        }

        // Check if algorithm works on n-steps (e.g. A2C)
        if (window.reinforcement_model.hasNSteps())
        {
            if (this.m_dogInfo.isEndOfNStep())
            {
                console.log("###### n-step " + this.m_dogInfo.episodeNStep + " step=" + this.m_dogInfo.episodeUpdateSteps);
                // this.logMemory("before train (n-step)");

                // End the line
                // NB: All the info will be cleared for the next n-steps (the same state will be retrieved again)
                this.m_dogInfo.episodeActions.push(0);         // fake action
                this.m_dogInfo.episodeStates.push(state);   // new state
                this.m_dogInfo.episodeRewards.push(0);         // fake reward
                this.m_dogInfo.episodeDones.push(0.0);           // fake done
                //this.m_dogInfo.episodeStateValues            // Already pushed

                // Train the value and policy models
                // this.m_waitRestart = true;
                await window.reinforcement_model.trainModels(this.m_dogInfo, false, debug)
                .then(
                    onTrainingNStepOverCallback.bind( { game : this, debug : debug})
                );

                // leave function now
                return;
            }
            else
            {
                console.log(">>>> step " + this.m_dogInfo.episodeUpdateSteps);
            }
        }

        // this.logMemory("before policy model predict");

		let predictedActionSoftmax = await window.reinforcement_model.predict_action(state)
		console.log("policy",predictedActionSoftmax )
        // predict the action to make with Policy model
        //  > compute action probability
        //  > choose action based on probability
        // let predictedActionSoftmax = tf.tidy(() => {
            // NB: tf.tidy will clean up all the GPU memory used by tensors inside
            // this function, other than the tensor that is returned.

            // const stateTensor = tf.tensor2d(state, [1, state.length]);
            // const stateTensor = tf.tensor(state, [1, state.length]);
            // let prediction = window.reinforcement_model.m_model.predict(stateTensor).dataSync(); 
            //let prediction = window.reinforcement_model.internalPredict(stateTensor, true).dataSync(); // same result
            // return prediction;
        // });
        //if (debug)
        //    console.log("RL predicted softmax" + predictedActionSoftmax);

        // this.logMemory("after policy model predict");

        // Compute choice based on action using softmax result as probabilities
        let action = VectorUtils.randomChoice(predictedActionSoftmax);
		// console.log("action",action )
        this.m_dogInfo.episodeActions.push(action);
        //if (debug)
        //    console.log("RL predicted " + action);

        // Apply the action
        await this.applyReinforcementAction(action);

        // Compute the state
        this.m_dogInfo.episodeStates.push(state);

        // Push the current reward
        this.m_dogInfo.episodeRewards.push(this.m_reinforcementEnvironment.getReward());

        // Push done state
        let episodeDone = (this.m_reinforcementEnvironment.isDone() ||
                            (g_settings.reinforcement.maxSteps > 0 && this.m_dogInfo.episodeUpdateSteps >=  g_settings.reinforcement.maxSteps));
        this.m_dogInfo.episodeDones.push((episodeDone ? 1.0 : 0.0));

        // check if the episode should end
        if (episodeDone)
        {
            // episode is over
            // if (debug)
                // console.log("Episode over -- about to learn");
				
            // this.logMemory("before train");
			// this.active = false;
			// if (this.m_reinforcementEnvironment.isDone()){
				// this.active = false;
			// }
            if (window.reinforcement_model.hasNSteps())
            {
                // if the algorithm works on n-steps (e.g. A2C) we do not train the models yet.
                // We only restart the game
                // this.m_waitRestart = true;
				// console.log("IS DONE ?",this.m_reinforcementEnvironment.isDone(),this.m_reinforcementEnvironment.sonic_state)
                await this.onTrainingOver(this.m_reinforcementEnvironment.isDone());
            }
            else
            {
                // Train the value and policy models
                // this.m_waitRestart = true;
                await window.reinforcement_model.trainModels(this.m_dogInfo, true, debug)
                .then(
                    onTrainingOverCallback.bind( { game : this, debug : debug})
                );
            }


        }

    }

    async applyReinforcementAction(action)
    {
        // Update environment
        await this.m_reinforcementEnvironment.step(action);
        this.m_dogInfo.onStep();
    }

    // logMemory(msg)
    // {
        // if (this.m_debugMemory)
        // {
            // console.log(msg);
            // console.log(tf.memory());
        // }
    // }

    // endGame()
    // {
        // return to title screen
        // this.scene.stop();
        // this.scene.start('Title');
    // }

    async onTrainingOver(stop_training)
    {
        // Display histogram with chosen actions
        // tfvis.render.histogram(this.m_actionSurface, this.m_dogInfo.episodeActions, {});

        // this.logMemory("after train");

        // Store/display stats
        // compute the episode total reward
        let episodeRewardsSum = VectorUtils.sum(this.m_dogInfo.episodeRewards) 
                                + window.reinforcement_info.tmpNStepReward;

		// console.log(window.reinforcement_model)
		 let episodeTotalLossMean = VectorUtils.mean(window.reinforcement_model.loss.total)
        // Add to the list of epidode rewards
        window.reinforcement_info.allRewards.push(episodeRewardsSum);

        // Compute the mean of all the episode rewards (it should increase)
        let meanReward = VectorUtils.mean( window.reinforcement_info.allRewards);
        let maxReward = VectorUtils.max( window.reinforcement_info.allRewards);

        // if (debug)
        // {
            console.log("======================");
            console.log("Episode " + window.reinforcement_info.episode);
            console.log("  episode reward : " + episodeRewardsSum);
            console.log("  mean reward    : " + meanReward);
            console.log("  max reward    : " + maxReward);
            console.log(window.reinforcement_info);
            console.log("======================");
        // }

        // write the score
        //this.m_scoreText.setText('Episode: ' +  window.reinforcement_info.episode + ' - Last/Mean Reward: ' + episodeRewardsSum + ' / ' + meanReward);

        // Add mean reward to visualization
        // this.m_visualizationRewardData.push(
            // { x: 1.0 *  window.reinforcement_info.episode, 
            // y: meanReward 
            // }
        // );
        // let series = { values : [ this.m_visualizationRewardData] , series : ["MeanRewards"]};
        // tfvis.render.linechart(this.m_visualizationSurface, series, {});

        // move to next episode
        
		
		
		
		
		if (stop_training){
			this.log("episode ended since out of boundaries : " + this.m_reinforcementEnvironment.sonic_state  + 'cm')
			this.pause_training()
			this.active = false
		}else{
			this.log("episode ended after enough steps")
			
			await this.reset_training(stop_training)
		}
	
		
		// reset
        // this.scene.restart({ mode : this.m_mode});
           
    }

    onTrainingNStepOver(debug)
    {
        // Display histogram with chosen actions
        //tfvis.render.histogram(this.m_actionSurface, this.m_dogInfo.episodeActions, {});
		
							
        // this.logMemory("after train n-step");

        // Store/display stats
        // compute the episode total reward
        let episodeRewardsSum = VectorUtils.sum(this.m_dogInfo.episodeRewards);

        // Add to the list of epidode rewards
        window.reinforcement_info.tmpNStepReward += episodeRewardsSum;
		console.log("dofInfo",this.m_dogInfo)
		// console.log("window.reinforcement_info",window.reinforcement_info)
		// console.log("m_visualizationValueModelLossData",this.agent.m_visualizationValueModelLossData)
		// console.log(this.m_dogInfo)
		
		
		// console.log("LOSS",window.reinforcement_model.loss,this.m_dogInfo)
	
		this.chart.addData('reward_loss_chart_periods',{
			'label':this.m_dogInfo.episodeUpdateSteps,
			'loss_total': window.reinforcement_model.loss.total[window.reinforcement_model.loss.total.length-1],
			'loss_value': window.reinforcement_model.loss.value[window.reinforcement_model.loss.value.length-1],
			'reward':episodeRewardsSum
		})
							
							
        if (debug)
        {
            console.log("------ n-step over with rw=" + episodeRewardsSum + 
                        " (sum =" + window.reinforcement_info.tmpNStepReward+ ") ------");
        }

        // Move to next n-step
        this.m_dogInfo.onNewNStep();

        //this.scene.restart({ mode : this.m_mode});
        // this.m_waitRestart = false;
           
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
	
	

	async training(_this_game){
		if (!_this_game){
			_this_game = this;
		}
		if (_this_game.started==false){
			this.log("training started")
			_this_game.started = true;
		}
		// if (_this_game.waspaused==true){
			// this.log("training resumed")
			// _this_game.waspaused = false;
		// }
		// var reseted = false;
	
		// if (_this_game.reset==true){
			// waspaused.reset = false;
			// reseted = true;
			// this.log("environement reseted")
			// this.log('episode ended since reset')
			// waspaused.period = 0
		// }
		// console.log("GAME ACTIVE?",_this_game.active)
		if (_this_game.active==true){
			await _this_game.handleReinforcementLearning(true)
			await _this_game.training(_this_game)
		}
		
	}
	
	async reset_training(pause) {
		
		if (pause==true){
		
			
		
			// this.reset = true
			if (this.active!=false){
				this.log("training paused")	
			}
			this.active = false
			$("#reset_button").addClass('active')
		// }else{
			
		
			// this.active = true;
			// this.training()
		}
		$("#train_button").removeClass("active")
		
		// console.log("PAUSE TRAINING")
		
		// console.log("RESET",this.m_dogInfo,window.reinforcement_info)
		
		
		this.chart.cleanData("reward_loss_chart_periods")
		
		
		this.chart.addData("reward_loss_chart_episods",{
			label:window.reinforcement_info.episode,
			loss_total:VectorUtils.mean(window.reinforcement_model.loss.total),
			loss_value:VectorUtils.mean(window.reinforcement_model.loss.value),
			reward:VectorUtils.sum(this.m_dogInfo.episodeRewards)
		})
		await this.m_reinforcementEnvironment.init()
		this.m_dogInfo.reset(true)
		window.reinforcement_info.episode++;
		window.reinforcement_model.loss = {
			policy : [],
			value : [],
			entropy : [],
			total:[]
			
		}
		
		this.log("training reseted")
		
		
		
	}	
	async resume_training() {
		// console.log("PAUSE TRAINING")
		this.log("training resumed")
		this.active = true
		$("#reset_button").removeClass('disabled')
		$("#sonar_button").addClass('disabled')
		$("#stop_button").removeClass('disabled')
		this.training()
	}
	async pause_training() {
		console.log("PAUSE TRAINING")
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
		// this.chart.cleanData('reward_loss_chart_periods')
		// this.chart.cleanData('reward_loss_chart_episods')
		// this.reset_training(true)
		this.chart.cleanData('reward_loss_chart_periods')
		this.chart.cleanData('reward_loss_chart_episods')
		let game = new PlayGame();
		game.create({
			mode : "RL_TRAIN"
			
		}).then(function(){
			// game.handleReinforcementLearning()
			$("#train_button").removeClass('disabled')
			$("#stop_button").removeClass('disabled')
		})
		
		
	}
	log(text){
		var now = new Date().toLocaleTimeString() //.replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3")
		$('#log').prepend('<div>' + now + ': ' + text + '</div>')		
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

function onTrainingOverCallback()
{
    this.game.onTrainingOver(this.debug);
}

function onTrainingNStepOverCallback()
{
    this.game.onTrainingNStepOver(this.debug);
}




let g_settings = {
	// mode :"RL_TRAIN",
	agent:{
		algorithm : "A2C", // REINFORCE REINFORCE_BASELINE A2C
		nSteps : 4,
		depth : 4,
		oneHotShape : 3  // class of action
	},
	valuemodel:{
		epochs : 1,
		// layers : 5,
		units : 24,
		learningRate : 0.01, // 0.005,
		miniBatchSize : 1
	},
	reinforcement:{
		maxSteps : 200,
		miniBatchSize : 1,
		// epochsPerEpisode : 1,
		// layers : 3,
		units : 24,
		learningRate : 0.01, // 0.005,
		gammaDiscountRate : 0.95,

		normalizeAdvantage : true,
		// normalizeAdvantage : false,

		slotCount : 10
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
		
	})
	$("#reset_button").on('click',function(){
		// var $this = this
		if (!$(this).hasClass('disabled') && !$(this).hasClass('active')){
			// console.log("CLICK RESET")
			// sars.active = false
			game.reset_training()
			// $("#train_button").removeClass("active")
			// sars.reset = true
		}
	})	
	$("#stop_button").on('click',function(){
		if (!(this).hasClass('disabled')){
			game.stop_training()

		}
		
	})	
	
})




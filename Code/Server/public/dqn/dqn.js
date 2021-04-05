// https://sebastianfoerster86.wordpress.com/2016/11/07/robot-controlled-by-artificial-neural-network/

// ann_start_qlearning(700, 0.8, 1.0, 50);
// epoch = 700
// gamma = 0.8
// epsilon = 1.0
// step = 50


// fann_set_learning_momentum(ann, 0.95); 	//google deep mind (Atari) -> 0.95
// fann_set_learning_rate(ann, 0.1);

class Model {


    constructor(hiddenLayerSizes, numInputs, numActions, numServos) {
      this.numInputs = numInputs;
      this.numActions = numActions;
	  this.numServos = numServos
	  this.hiddenLayerSizes = hiddenLayerSizes
      // this.batchSize = batchSize;

      // if (hiddenLayerSizesOrModel instanceof tf.LayersModel) {
        // this.network = hiddenLayerSizesOrModel;
        // this.network.summary();
        // this.network.compile({optimizer: 'adam', loss: 'meanSquaredError'});
     // } else {
		
		
      // }
    }

    defineModel() {
		console.log("Building network")
		
        if (!Array.isArray(this.hiddenLayerSizes)) {
            this.hiddenLayerSizes = [this.hiddenLayerSizes];
        }
        this.network = tf.sequential();
        this.hiddenLayerSizes.forEach((hiddenLayerSize, i) => {
			// console.log("hiddenLayerSizes",this.hiddenLayerSizes,hiddenLayerSize, i)
        this.network.add(tf.layers.dense({
            units: hiddenLayerSize,
            activation: 'sigmoid',
            // `inputShape` is required only for the first layer.
            // inputShape: i === 0 ? [this.numStates] : undefined
            inputShape: i === 0 ? [this.numInputs] : undefined
            }));
        });
        this.network.add(tf.layers.dense({units: this.numActions}));

        this.network.summary();
        this.network.compile({optimizer: 'adam', loss: 'meanSquaredError'});
    }

  
    predict(states) {
		var tensor_state = tf.tensor(states).reshape([1,this.numInputs])
        return tf.tidy(() => this.network.predict(tensor_state));
    }

    async train(train_data){
		var xtensor = tf.tensor(train_data.input).reshape([train_data.input.length,this.numInputs])
		var ytensor = tf.tensor(train_data.output).reshape([train_data.output.length,this.numActions])	
		return await this.network.fit(xtensor,ytensor,{
			batchSize: 30,
			epochs: 30
		})
		// return await this.network.trainOnBatch(xtensor,ytensor)

		// return this.network.trainOnBatch(xtensor,ytensor)
	}
	
   	async saveModels(){
		// console.log("SAVING models")
		this.network.save("localstorage://network")
	
	}
	
	async loadModels(){
		try{
			this.network = await tf.loadLayersModel('localstorage://network');	
			// this.m_valueModel = await tf.loadLayersModel('localstorage://critic' + this.index);	
			this.network.compile({optimizer: 'adam', loss: 'meanSquaredError'});
			// this.m_valueModel.compile({loss: 'meanSquaredError', optimizer: this.valueOptimizer});
			return true
		}catch(e){
			// console.log(e)
			return e
		}
		
	}

	getMaxQandAction(servo_mot, Qvalue_vector){
		var forward = servo_mot;
		var backward = servo_mot + this.numServos;
		var stop = servo_mot + 2 * this.numServos;
		// console.log(servo_mot," -- " ,forward,backward,stop)
		var action;
		var maxQ;
		//printf("Servo decision: F: %f   B: %f   S: %f\n", Qvalue_vector[forward], Qvalue_vector[backward], ann_output_vec[stop]);

		if(Qvalue_vector[forward] > Qvalue_vector[backward] && Qvalue_vector[forward] > Qvalue_vector[stop])
		{
			// if(maxQ != undefined){
				maxQ =  Qvalue_vector[forward];
			// }
			// forward
			action = 0;
		} else if(Qvalue_vector[stop] > Qvalue_vector[backward] && Qvalue_vector[stop] > Qvalue_vector[forward]){
			// if(maxQ!=undefined) {
				maxQ =  Qvalue_vector[stop];
			// }
			//stop
			action = 2 ;
		} else{
			//backward
			maxQ =  Qvalue_vector[backward];
			action = 1
		}
		
		return {
			action : action,
			maxQ: maxQ
		}
	}

	
	indexOfMax(arr) {
		if (arr.length === 0) {
			return -1;
		}

		var max = arr[0];
		var maxIndex = 0;

		for (var i = 1; i < arr.length; i++) {
			if (arr[i] > max) {
				maxIndex = i;
				max = arr[i];
			}
		}

		return maxIndex;
	}


}
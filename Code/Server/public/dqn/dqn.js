class Model {


    constructor(hiddenLayerSizes, numInputs, numActions, numServos) {
      this.numInputs = numInputs;
      this.numActions = numActions;
	  this.numServos = 4
      // this.batchSize = batchSize;

      // if (hiddenLayerSizesOrModel instanceof tf.LayersModel) {
        // this.network = hiddenLayerSizesOrModel;
        // this.network.summary();
        // this.network.compile({optimizer: 'adam', loss: 'meanSquaredError'});
     // } else {
        this.defineModel(numInputs,hiddenLayerSizes);
      // }
    }

    defineModel(numInputs,hiddenLayerSizes) {
		console.log("Building network")
		
        if (!Array.isArray(hiddenLayerSizes)) {
            hiddenLayerSizes = [hiddenLayerSizes];
        }
        this.network = tf.sequential();
        hiddenLayerSizes.forEach((hiddenLayerSize, i) => {
			console.log("hiddenLayerSizes",hiddenLayerSizes,hiddenLayerSize, i)
        this.network.add(tf.layers.dense({
            units: hiddenLayerSize,
            activation: 'relu',
            // `inputShape` is required only for the first layer.
            // inputShape: i === 0 ? [this.numStates] : undefined
            inputShape: i === 0 ? [numInputs] : undefined
            }));
        });
        this.network.add(tf.layers.dense({units: this.numActions}));

        this.network.summary();
        this.network.compile({optimizer: 'adam', loss: 'meanSquaredError'});
    }

  
    predict(states) {
        return tf.tidy(() => this.network.predict(states));
    }

    
    async train(xBatch, yBatch) {
        var history = await this.network.fit(xBatch, yBatch);
		return history.history.loss[0];
    }

    chooseAction(state, eps) {
		console.log("ACTION ? ",eps)
        if (Math.random() < eps) {
			// console.log("Random action")
			var actions = []
			for (var s = 0 ; s<this.numServos;s++){
				actions.push(Math.floor(Math.random() * this.numActions/this.numServos) )
			}
			console.log(actions)
			return actions
		
        } else {
			// console.log("policy action")
            return tf.tidy(() => {
                const logits = this.network.predict(state).dataSync();
				console.log("logits",logits)
				// var logits = [1, 2, 3, 4, 5, 6, 7, 8]
				var actions = []
				for (var s = 0 ; s<this.numServos;s++){
					var start = s*this.numActions/this.numServos
					var end  = s*this.numActions/this.numServos + this.numActions/this.numServos
					// console.log("slice",start,end)
					var slicedLogits = logits.slice(start,end)
					// console.log("slicedLogits",slicedLogits)
					var action = this.indexOfMax(slicedLogits)
					// console.log('action',action)
					actions.push(action)
					
				}
				// console.log("logits",logits.dataSync())
                // const sigmoid = tf.sigmoid(logits);
				// console.log("sigmoid",sigmoid.dataSync())
                // const probs = tf.div(sigmoid, tf.sum(sigmoid));
				// console.log("probs",probs.dataSync())
                // return tf.multinomial(probs, 4).dataSync()[0] - 1;
				console.log(actions)
				return actions
            });
			
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
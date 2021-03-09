// https://sebastianfoerster86.wordpress.com/2016/11/07/robot-controlled-by-artificial-neural-network/

// ann_start_qlearning(700, 0.8, 1.0, 50);
// epoch = 700
// gamma = 0.8
// epsilon = 1.0
// step = 50


// fann_set_learning_momentum(ann, 0.95); 	//google deep mind (Atari) -> 0.95
// fann_set_learning_rate(ann, 0.1);

class Model {


    constructor(servoActions_index,servoStates_index,save) {
		console.log("model input - action",servoActions_index)
		console.log("model input - state",servoStates_index)
		// this.numInputs = numInputs;
		// this.numActions = numActionsServo;
		// this.actions = []
		// for (var s in servoActions_index){
			// this.actions.push([])
			// for (var a in servoActions_index[s].actions_index){
				// this.actions[s].push( a * 1.0)
			// }
		// }
		// console.log(this.actions)
		// this.actions = [[0,1],[0,1],[0,1],[0,1]]
		// this.actionsColumns_size = Math.pow(servoActions_index.length,this.numActions)
		this.actions_index = combineArrays(servoActions_index)
		this.states_index = combineArrays(servoStates_index)
		console.log("ACTIONS INdEX = ",this.actions_index)
		console.log("STATE INdEX = ",this.states_index)
	
		this.table = {}
		
		// build html table
		var html = '<table>'
		html = html + '<tr>'
		
		html = html + '<th>' + 'states\\actions' + '</th>'
		for (var a in this.actions_index){
			
			html = html + '<th id=' + this.actions_index[a].join('-') + '>' + this.actions_index[a] + '</th>'
			
		}
		html = html + '</tr>'
		
		for (var s in this.states_index){
			html = html + '<tr>'
			html = html + '<td  id=' + this.states_index[s].join('-') + '>' + this.states_index[s] + '</td>'
			for (var a in this.actions_index){
				html = html + '<td class="blackcolor" id=' + this.states_index[s].join('-') + '¤' + this.actions_index[a].join('-') + '>x</td>'
			}
			html = html + '</tr>'
		}
		
		var html = html + '</table>'
		// console.log("HTML table",html)
		$('#table_container').html(html)
		if (save){
			this.saveModel()
		}
    }

  
    predict(states) {
        return tf.tidy(() => this.network.predict(states));
    }

    saveModel(){
		try{
			var fake = localStorage.getItem('table');
			localStorage.setItem('table', JSON.stringify(this.table));
		}
		catch(e)
		{
			console.warn("error while saving model",e)
		}
	}
	loadModel(){
		try{
			this.table = JSON.parse(localStorage.getItem('table'));
			for (var state in this.table){
				for (var action in this.table[state]){
					this.updateHtmlTable(state,this.actions_index[action])
				}
			}
		}
		catch(e)
		{
			console.warn("error while loading model",e)
			this.table = {}
		}
	}
    async train(state, reward,action_index, nextState) {
		// console.log("TRAIN",reward)
		// state = [0,0,0,1]
		var lr  = 0.95; // or alpha, learning rate
		var gamma  = 0.9 // actualisation factor  0.8 to 0.99.
		// nextState = [0,0,1,1]
		
		// reward = 1
		// console.log("train input",state, reward,action_index, nextState)
        var state_join = state.join('-')
        
		if (this.table[state_join]==undefined){
			// console.log("this.actionsColumns_size",this.actionsColumns_size)
			this.table[state_join] = new Array(this.actions_index.length).fill(0)
			this.table[state_join][action_index] = reward
		}else{
			var future_reward = 0
			if (nextState!==null){
				var nextState_join = nextState.join('-')
				// var lr  = 0.95; // or alpha, learning rate
				
				var future_rewards =  this.table[nextState_join] // max qvalue of array
				// console.log("future_rewards----------------------")
				// console.log("future_rewards",future_rewards)
				if (future_rewards!=undefined){
					var future_reward = Math.max(...future_rewards)
					// console.log("max reward",future_reward)
					// if (!isNaN(future_rewards)){
						
						// if (future_reward!=0){
						// console.log("2. UPDATED Training table for action",action_index,"and state_join",state_join,this.table[state_join][action_index])	
					// }else{
						// this.table[state_join][action_index] = (1 - lr)  * this.table[state_join][action_index] + lr * reward
					// }
				// }else{
					// console.log("future_reward undefined",this.table[state_join][action_index])
					// this.table[state_join][action_index] = (1 - lr)  * this.table[state_join][action_index] + lr * reward
				}
			// }else{
				// console.log("next state undefined",this.table[state_join][action_index])
				// this.table[state_join][action_index] = (1 - lr)  * this.table[state_join][action_index] + lr * reward
			}
			this.table[state_join][action_index] = (1 - lr)  * this.table[state_join][action_index] + lr * ( reward + gamma * future_reward)
		}
		
		// console.log("adding new value",this.table[state_join][action_index])
		// $('#' + state_join + '¤' + this.actions_index[action_index].join('-')).html(parseInt(this.table[state_join][action_index]*10)/10)
		// $('#' + state_join + '¤' + this.actions_index[action_index].join('-')).css('backgroundColor',getColorForPercentage(this.table[state_join][action_index]/2))
		// console.log("training table",this.table)
		this.updateHtmlTable(state,action_index)
		
    }
	updateHtmlTable(state,action_index){
		var id = '#' + state.join('-') + '¤' + this.actions_index[action_index].join('-')
		console.log("id to fill",id)
		$(id).html(parseInt(this.table[state.join('-')][action_index]*10)/10)
		$(id).css('backgroundColor',getColorForPercentage(this.table[state.join('-')][action_index]/2))
	}
	flashStateAction(state,action_index){
		var id = '#' + state.join('-') + '¤' + this.actions_index[action_index].join('-')
		var stateId = 	'#' + state.join('-')
		var actionId = 	'#' +  this.actions_index[action_index].join('-')
		
	}
    chooseAction(state, eps) {
		// console.log("ACTION ? ",eps)
		// state = [0,0,0,1]
		var state_join = state.join('-')
		// eps = -1 
        if (Math.random() < eps || this.table[state_join]==undefined) {
        // if (Math.random() < 2 ) {
			// console.log("Random action")
			// var actions = []
			// for (var s = 0 ; s<this.numServos;s++){
				var actions_index = Math.floor(Math.random() * this.actions_index.length) 
				// console.log("actioin
				// return this.actions_index[actions_index]
				return { actions : this.actions_index[actions_index], actions_index : actions_index}

        } else {

			const logits = this.table[state.join('-')];
			console.log("logitis",logits)
			var action_index = this.indexOfMax(logits)

			return { actions : this.actions_index[action_index], actions_index : action_index}

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


function combineArrays( array_of_arrays ){

    // First, handle some degenerate cases...

    if( ! array_of_arrays ){
        // Or maybe we should toss an exception...?
        return [];
    }

    if( ! Array.isArray( array_of_arrays ) ){
        // Or maybe we should toss an exception...?
        return [];
    }

    if( array_of_arrays.length == 0 ){
        return [];
    }

    for( let i = 0 ; i < array_of_arrays.length; i++ ){
        if( ! Array.isArray(array_of_arrays[i]) || array_of_arrays[i].length == 0 ){
            // If any of the arrays in array_of_arrays are not arrays or zero-length, return an empty array...
            return [];
        }
    }

    // Done with degenerate cases...

    // Start "odometer" with a 0 for each array in array_of_arrays.
    let odometer = new Array( array_of_arrays.length );
    odometer.fill( 0 ); 

    let output = [];

    let newCombination = formCombination( odometer, array_of_arrays );

    output.push( newCombination );

    while ( odometer_increment( odometer, array_of_arrays ) ){
        newCombination = formCombination( odometer, array_of_arrays );
        output.push( newCombination );
    }

    return output;
}/* combineArrays() */


// Translate "odometer" to combinations from array_of_arrays
 function formCombination( odometer, array_of_arrays ){
    // In Imperative Programmingese (i.e., English):
    // let s_output = "";
    let s_output = [];
    for( let i=0; i < odometer.length; i++ ){
       // s_output += "" + array_of_arrays[i][odometer[i]]; 
       s_output.push(array_of_arrays[i][odometer[i]]); 
    }
    return s_output;

    // In Functional Programmingese (Henny Youngman one-liner):
    // return odometer.reduce(
      // function(accumulator, odometer_value, odometer_index){
        // return accumulator.push(array_of_arrays[odometer_index][odometer_value]);
      // },
      // ""
    // );
}/* formCombination() */

 function odometer_increment( odometer, array_of_arrays ){

    // Basically, work you way from the rightmost digit of the "odometer"...
    // if you're able to increment without cycling that digit back to zero,
    // you're all done, otherwise, cycle that digit to zero and go one digit to the
    // left, and begin again until you're able to increment a digit
    // without cycling it...simple, huh...?

    for( let i_odometer_digit = odometer.length-1; i_odometer_digit >=0; i_odometer_digit-- ){ 

        let maxee = array_of_arrays[i_odometer_digit].length - 1;         

        if( odometer[i_odometer_digit] + 1 <= maxee ){
            // increment, and you're done...
            odometer[i_odometer_digit]++;
            return true;
        }
        else{
            if( i_odometer_digit - 1 < 0 ){
                // No more digits left to increment, end of the line...
                return false;
            }
            else{
                // Can't increment this digit, cycle it to zero and continue
                // the loop to go over to the next digit...
                odometer[i_odometer_digit]=0;
                continue;
            }
        }
    }/* for( let odometer_digit = odometer.length-1; odometer_digit >=0; odometer_digit-- ) */

}/* odometer_increment() */

var percentColors = [
    { pct: -1.0, color: { r: 0xff, g: 0x00, b: 0 } },
    { pct: 0, color: { r: 0xff, g: 0xff, b: 0 } },
    { pct: 1.0, color: { r: 0x00, g: 0xff, b: 0 } } ];

var getColorForPercentage = function(pct) {
    for (var i = 1; i < percentColors.length - 1; i++) {
        if (pct < percentColors[i].pct) {
            break;
        }
    }
    var lower = percentColors[i - 1];
    var upper = percentColors[i];
    var range = upper.pct - lower.pct;
    var rangePct = (pct - lower.pct) / range;
    var pctLower = 1 - rangePct;
    var pctUpper = rangePct;
    var color = {
        r: Math.floor(lower.color.r * pctLower + upper.color.r * pctUpper),
        g: Math.floor(lower.color.g * pctLower + upper.color.g * pctUpper),
        b: Math.floor(lower.color.b * pctLower + upper.color.b * pctUpper)
    };
    return 'rgb(' + [color.r, color.g, color.b].join(',') + ')';
    // or output as hex if preferred
};

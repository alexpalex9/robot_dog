var myCharts = function(){
	
	var twoaxis_options = {
		animation: {
			duration: 0
		},
		layout: {
			padding: {
				left: 10,
				right: 10,
				top: 10,
				bottom: 0
			}
		},
		legend: {
			display: true
		},
		tooltips: {
			mode: 'label'
		},
		maintainAspectRatio : false,
		scales: {
			yAxes: [{
				stacked:true,
				id : "left",
				position:"left",
				ticks: {
					beginAtZero: false,
					display: true
				},
				gridLines: {
					display: true,
					drawBorder: true,
					color: "rgb(130,130,130)",
					zeroLineColor: "rgb(130,130,130)"
				}
			},
			{
				position:"right",
				id : "right",
				ticks: {
					beginAtZero: false,
					display: true
				},
				gridLines: {
					display: true,
					drawBorder: true,
					color: "rgb(130,130,130)",
					zeroLineColor: "rgb(130,130,130)"
				}
			}],
			xAxes: [{
				ticks:{
					maxRotation: 90,
					minRotation: 90
				},
				gridLines: {
					display:false
				}
			}]
		}
	}	
	
	var oneaxis_options = {
		animation: {
			duration: 0
		},
		layout: {
			padding: {
				left: 10,
				right: 10,
				top: 10,
				bottom: 0
			}
		},
		legend: {
			display: true
		},
		tooltips: {
			mode: 'label'
		},
		maintainAspectRatio : false,
		scales: {
			yAxes: [{
				stacked:true,
				id : "left",
				position:"left",
				ticks: {
					beginAtZero: false,
					display: true
				},
				gridLines: {
					display: true,
					drawBorder: true,
					color: "rgb(130,130,130)",
					zeroLineColor: "rgb(130,130,130)"
				}
			}],
			xAxes: [{
				ticks:{
					maxRotation: 90,
					minRotation: 90
				},
				gridLines: {
					display:false
				}
			}]
		}
	}

	
	servos_options = {
		animation: {
			duration: 0
		},
		layout: {
			padding: {
				left: 10,
				right: 0,
				top: 10,
				bottom: 0
			}
		},
		legend: {
			display: true
		},
		tooltips: {
			mode: 'label'
		},
		maintainAspectRatio : false,
		scales: {
			yAxes: [{
				id : "left",
				position:"left",
				ticks: {
					beginAtZero: false,
					display: true
				},
				gridLines: {
					display: true,
					drawBorder: true,
					color: "rgb(130,130,130)",
					zeroLineColor: "rgb(130,130,130)"
				}
			},
			{
				position:"right",
				id : "right",
				ticks: {
					beginAtZero: false,
					display: true
				},
				gridLines: {
					display: false,
					drawBorder: true,
					color: "rgb(130,130,130)",
					zeroLineColor: "rgb(130,130,130)"
				}
			}],
			xAxes: [{
				ticks:{
					maxRotation: 90,
					minRotation: 90
				},
				gridLines: {
					display:false
				}
			}]
		}
	}
	var reward_template_left = {
		data : [],
		borderWidth : 1,
		borderColor: 'rgba(197, 216, 156, 1)',
		pointBorderWidth : 0,
		pointRadius: 0,
		lineTension : 0,
		pointHitRadius: 5,
		// type:'line',
		pointBorderColor : 'rgba(197, 216, 156, 1)',
		pointBackgroundColor : 'rgba(197, 216, 156, 1)',
		fill: false,
		spanGaps: true,
		label: "reward",
		type:'line',
		yAxisID:"left"
	}
	var reward_template_right = {
		data : [],
		borderWidth : 1,
		borderColor: 'rgba(197, 216, 156, 1)',
		pointBorderWidth : 0,
		pointRadius: 0,
		lineTension : 0,
		pointHitRadius: 5,
		// type:'line',
		pointBorderColor : 'rgba(197, 216, 156, 1)',
		pointBackgroundColor : 'rgba(197, 216, 156, 1)',
		fill: false,
		spanGaps: true,
		label: "reward",
		type:'line',
		yAxisID:"right"
	}
	var distance_template = {
		data : [],
		borderWidth : 1,
		borderColor: 'rgba(197, 216, 156, 1)',
		pointBorderWidth : 0,
		pointRadius: 0,
		lineTension : 0,
		pointHitRadius: 5,
		// type:'line',
		pointBorderColor : 'rgba(197, 216, 156, 1)',
		pointBackgroundColor : 'rgba(197, 216, 156, 1)',
		fill: false,
		spanGaps: true,
		label: "distance",
		type:'line',
		yAxisID:"right"
	}
	var loss_value_template = {
		data : [],
		borderWidth : 1,
		borderColor: 'rgba(221, 151, 149, 1)',
		pointBorderWidth : 0,
		pointRadius: 0,
		lineTension : 0,
		pointHitRadius: 5,
		// type:'line',
		pointBorderColor : 'rgba(221, 151, 149, 1)',
		pointBackgroundColor : 'rgba(221, 151, 149, 1)',
		fill: false,
		spanGaps: true,
		label: "value_loss",
		yAxisID:"left",
		type:'line'
	}

	var PolicyEntropy_template = {
		data : [],
		borderWidth : 1,
		borderColor: 'rgba(149, 151, 221, 1)',
		pointBorderWidth : 0,
		pointRadius: 0,
		lineTension : 0,
		pointHitRadius: 5,
		// type:'line',
		pointBorderColor : 'rgba(149, 151, 221, 1)',
		pointBackgroundColor : 'rgba(149, 151, 221, 1)',
		fill: false,
		spanGaps: true,
		label: "PolicyEntropy",
		yAxisID:"left",
		type:'line'
	}
	var inventory_template = {
		data : [],
		borderWidth : 3,
		borderColor: 'rgba(147, 183, 221, 1)',
		pointBorderWidth : 0,
		pointRadius: 0,
		lineTension : 0,
		pointHitRadius: 5,
		pointBorderColor : 'rgba(147, 183, 221, 1)',
		pointBackgroundColor : 'rgba(147, 183, 221, 1)',
		fill: false,
		spanGaps: true,
		label: "inventory",
		yAxisID : "left",
		type:"line"
	}
	var stockouts_template = {
		data : [],
		borderWidth : 1,
		borderColor: 'rgba(221, 151, 149, 1)',
		pointBorderWidth : 0,
		pointRadius: 0,
		lineTension : 0,
		pointHitRadius: 5,
		// type:'line',
		pointBorderColor : 'rgba(221, 151, 149, 1)',
		pointBackgroundColor : 'rgba(221, 151, 149, 1)',
		fill: false,
		spanGaps: true,
		label: "stockouts",
		yAxisID:"right",
		type:'bar'
	}
	costs_template = {
		data : [],
		borderWidth : 1,
		borderColor: 'rgba(221, 151, 149, 1)',
		pointBorderWidth : 0,
		pointRadius: 0,
		lineTension : 0,
		pointHitRadius: 5,
		// type:'line',
		pointBorderColor : 'rgba(221, 151, 149, 1)',
		pointBackgroundColor : 'rgba(221, 151, 149, 1)',
		fill: false,
		spanGaps: true,
		label: "costs",
		yAxisID:"left",
		type:'bar'
	}
	actions_template = {
		data : [],
		borderWidth : 1,
		borderColor: 'rgba(147, 183, 221, 1)',
		pointBorderWidth : 0,
		pointRadius: 0,
		lineTension : 0,
		pointHitRadius: 5,
		// type:'line',
		pointBorderColor : 'rgba(147, 183, 221, 1)',
		backgroundColor : 'rgba(147, 183, 221, 0.7)',
		pointBackgroundColor : 'rgba(147, 183, 221, 1)',
		fill: true,
		spanGaps: true,
		label: "actions",
		yAxisID:"left",
		type:'bar'
	}
	
	// for (wh in infos.holding_cost){
		// data_loss = JSON.stringify(loss_template)
	// }
	
	Chart.defaults.global.defaultFontColor = '#FFFFFF';
	
	var configSet_reward = {
		type: 'bar',
		data : {
			labels: [],
			datasets : [
				JSON.parse(JSON.stringify(reward_template_left))
			]
		},
		options: JSON.parse(JSON.stringify(oneaxis_options))
	}
	var configSet_loss_value = {
		type: 'bar',
		data : {
			labels: [],
			datasets : [
				JSON.parse(JSON.stringify(loss_value_template))
			]
		},
		options: JSON.parse(JSON.stringify(oneaxis_options))
	}
	var configSet_PolicyEntropy = {
		type: 'bar',
		data : {
			labels: [],
			datasets : [
				JSON.parse(JSON.stringify(PolicyEntropy_template))
			]
		},
		options: JSON.parse(JSON.stringify(oneaxis_options))
	}
	
	// var configSet_reward_loss_periods = {
		// type: 'bar',
		// data : {
			// labels: [],
			// datasets : [
				// JSON.parse(JSON.stringify(loss_value_template)),
				// JSON.parse(JSON.stringify(loss_total_template)),
				// JSON.parse(JSON.stringify(reward_template))
			// ]
		// },
		// options: JSON.parse(JSON.stringify(reward_loss_options))
	// }
	var configSet_reward_loss_episods = {
		type: 'line',
		data : {
			labels: [],
			datasets : [
				JSON.parse(JSON.stringify(loss_value_template)),
				JSON.parse(JSON.stringify(PolicyEntropy_template)),
				JSON.parse(JSON.stringify(reward_template_right))
			]
		},
		options: JSON.parse(JSON.stringify(twoaxis_options))
	}
	
	var configSet_actions = {
		type: 'bar',
		data : {
			labels: [],
			datasets : [
				JSON.parse(JSON.stringify(actions_template))
			]
		},
		options: JSON.parse(JSON.stringify(oneaxis_options))
	}
	configSet_actions.options.scales.yAxes[0].ticks = {
		beginAtZero: true,
		// steps: 10,
		// stepValue: 5,
		max: 1
	}
	
	// _this.reward_loss_chart_episods  = new Chart(document.getElementById("loss_reward_chart_episodes").getContext("2d"),configSet_reward_loss_episods);
	// _this.reward_loss_chart_periods = new Chart(document.getElementById("loss_reward_chart_periods").getContext("2d"),configSet_reward_loss_periods);
	_this.value_loss = new Chart(document.getElementById("value_loss").getContext("2d"),configSet_loss_value);
	_this.PolicyEntropy = new Chart(document.getElementById("PolicyEntropy").getContext("2d"),configSet_PolicyEntropy);
	_this.reward = new Chart(document.getElementById("reward").getContext("2d"),configSet_reward);
	_this.reward_episodes = new Chart(document.getElementById("reward_episodes").getContext("2d"),configSet_reward_loss_episods);
	_this.actions = new Chart(document.getElementById("actions").getContext("2d"),configSet_actions);

	_this.cleanData = function(chart_name){
		_this[chart_name].config.data.labels = []
		for (var c in _this[chart_name].config.data.datasets){
			_this[chart_name].config.data.datasets[c].data = []
		}
		_this[chart_name].update()
	}
	
	_this.updateData = function(chart_name,data){
		// console.log("UPDATE DATA CHART",chart_name,data)
		_this[chart_name].config.data.labels = data.labels
		for (var d in data){
			for (var c in _this[chart_name].config.data.datasets){
				if (_this[chart_name].config.data.datasets[c].label==d){
					_this[chart_name].config.data.datasets[c].data = data[d]
				}
			}
		}
		
		_this[chart_name].update()
		
	}
	_this.addData = function(chart_name,data){
		
		// console.log("ADD DATA CHART",chart_name,data)
		// var max= 200
		// if (chart_name=="reward_episodes"){
			// max = 
		// }
		
		if (_this[chart_name].config.data.labels.length>100){
			_this[chart_name].config.data.labels = _this[chart_name].config.data.labels.slice(1)
			for (var c in _this[chart_name].config.data.datasets){
				_this[chart_name].config.data.datasets[c].data = _this[chart_name].config.data.datasets[c].data.slice(1)
			}
		}
		// if (_this[chart_name].config.data.labels.length== 0){
			// _this[chart_name].config.data.labels = [0]
		// }else{
			// _this[chart_name].config.data.labels.push(_this[chart_name].config.data.labels[_this[chart_name].config.data.labels.length-1]+1)
			// if (data.label!==undefined){
				// console.log("pushing chart label",data.label)
				_this[chart_name].config.data.labels.push(data.label)
			// }else{
				
			// }
		// }
		for (var d in data){
			for (var c in _this[chart_name].config.data.datasets){
				if (_this[chart_name].config.data.datasets[c].label==d){
					_this[chart_name].config.data.datasets[c].data.push(data[d])
				}
			}

		}
			
			// _this.chartEpisodes1.config.data.datasets[1].data.push(data.loss);
			_this[chart_name].update()

	}
	return _this
}
// initChart()
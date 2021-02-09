var myCharts = function(parent){
	
	reward_loss_options = {
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
	reward_template = {
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
	distance_template = {
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
	loss_template = {
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
		label: "loss",
		yAxisID:"left",
		type:'line'
	}

	inventory_template = {
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
	stockouts_template = {
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

	
	// for (wh in infos.holding_cost){
		// data_loss = JSON.stringify(loss_template)
	// }
	
	Chart.defaults.global.defaultFontColor = '#FFFFFF';
	
	
	
	var configSet_reward_loss = {
		type: 'bar',
		data : {
			labels: [],
			datasets : [
				JSON.parse(JSON.stringify(loss_template)),
				JSON.parse(JSON.stringify(reward_template))
			]
		},
		options: JSON.parse(JSON.stringify(reward_loss_options))
	}
	
	_this.reward_loss_chart  = new Chart(document.getElementById("loss_reward_chart").getContext("2d"),configSet_reward_loss);

	_this.addData = function(data){
		if (_this.reward_loss_chart.config.data.labels.length>200){
			_this.reward_loss_chart.config.data.labels = _this.reward_loss_chart.config.data.labels.slice(1)
			for (var c in _this.reward_loss_chart.config.data.datasets){
				_this.reward_loss_chart.config.data.datasets[c].data = _this.reward_loss_chart.config.data.datasets[c].data.slice(1)
			}
		}
		if (_this.reward_loss_chart.config.data.labels.length== 0){
			_this.reward_loss_chart.config.data.labels = [0]
		}else{
			_this.reward_loss_chart.config.data.labels.push(_this.reward_loss_chart.config.data.labels[_this.reward_loss_chart.config.data.labels.length-1]+1)
		}
		for (var d in data){
			for (var c in _this.reward_loss_chart.config.data.datasets){
				if (_this.reward_loss_chart.config.data.datasets[c].label==d){
					_this.reward_loss_chart.config.data.datasets[c].data.push(data[d])
				}
			}

		}
			
			// _this.chartEpisodes1.config.data.datasets[1].data.push(data.loss);
			_this.reward_loss_chart.update()

	}
	return _this
}
// initChart()
$(
	$('html').on('click','.cmd',function(){
		$.ajax({
			url : '/',
			type : 'GET',
			dataType : 'json', //'html',
			data : $(this).data('value'),
			cache: false,             // To unable request pages to be cached
			processData:false,        // To send DOMDocument or non processed data file it is set to false
			contentType: false,
			timeout : 50000,		
			success : function (data, status) {
				concole.log("success",data)
			},
			error: function(error) {
				console.log("error in ajax request",error)
			},
			complete:function(){
			}
		});
		
		
	})



)
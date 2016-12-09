$(document).ready(function(){
$("#list").parents('.row').hide();

$(".productTracker").on('click',function(){
	$("#board").show();
	$("#list").parents('.row').hide();
});
$(".listAll").on('click', function(e){
	e.preventDefault();
	//Get All elements
	$("#list").html("Loading...");
	$.ajax({
		method:'POST',
		url:'/listall',
		data:{uid:Cookies.get('uid')},
		success:function(data){
			$("#board").hide();
			$("#list").html(data);
			$("#list").parents('.row').show();
			//Create requests
			$(".new-request").on('click', function(e){
				e.preventDefault();
				$(".new-request").button('loading');
				var $this = $(this);
				var pid = $this.parents('tr').attr('id');
				var url = $this.parents('tr').find('.product-link').attr('href');
				if(url){
					$.ajax({
						method:'POST',
						url:'/update',
						data:{pid:pid, url:url},
						success:function(data){
							$(".new-request").button('reset');
							if(data.success){
								$this.parents('tr').find('.product-price').val(data.actualPrice);
								$this.parents('tr').find('.product-update').val(data.lastUpdate);
								$this.parents('tr').addClass('success');
							}else{
								$this.parents('tr').addClass('danger');
								alertModal('danger',JSON.stringify(error),'Error!');
								console.log(error);
							}
						},
						error: function(error){
							console.log(error);
							$this.parents('tr').addClass('danger');
							alertModal('danger','Error during update Request!',"Request Fail!");
							$(".new-request").button('reset');
						}
					});
				}
			});
			//Charts
			$(".graph-open").on('click', function(event){
		        var pid = $(this).data('id');
		        var chartPromise = generateGraph(pid, false, "#graphModal");
		        chartPromise.then(function(chart){
		          chart.on('draw', function(data) {
		            if(data.type === 'line' || data.type === 'area') {
		              data.element.animate({
		                d: {
		                  begin: 2000 * data.index,
		                  dur: 2000,
		                  from: data.path.clone().scale(1, 0).translate(0, data.chartRect.height()).stringify(),
		                  to: data.path.clone().stringify(),
		                  easing: Chartist.Svg.Easing.easeOutQuint
		                }
		              });
		            }
		          });
		          chart.update();
		        }).catch(function(error){
		          setTimeout(function(){
		           $("#graphModal").modal('hide');
		           alertModal("danger","Could not open graph.","Error!");
		         },200); 
		        });
		      });
		},
		error: function(error){
			alertModal('danger','Unable to list products.','Error');
			console.log(error);
		}
	});
});


});
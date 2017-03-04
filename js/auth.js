//Profile Events
$(document).ready(function(){
  $(".addonModal").on('shown.bs.modal', function(){
    $("#links-collapse").collapse('hide');
  });

  /**
    *** Load trackers
  **/
  var noProducts="";
  noProducts += "<i><p>No products to show. <a href=\"#\" data-toggle=\"modal\" data-target=\"#addModal\">Click here<\/a> and start monitoring prices on <a target=\"_blank\" href=\"http:\/\/www.souq.com\/\" >Souq.com<\/a><\/p><\/i>";
    // var myChart = new Chartist.Line('.ct-chart', {
    //     labels: weekDay(-1),
    //     series: []
    //   }, {
    //     low: 0,
    //     showArea: true
    //   });

  var uid = Cookies.get('uid');
  //progressBarAnimate("#products", 10);
  $.ajax({
    method: "GET",
    url:"/track",
    data: {uid:uid},
    success:function(data){
      if(data.success){
        $("#products").html(data.html);
        //Generate Graph Event
        $(".graph-open").on('click', function(event){
          var pid = $(this).data('id');
          var dateObj = timestamp2dateObj($(this).data('original'));
          var chartPromise = generateGraph(pid, dateObj, "#graphModal");
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
        /** Remove Product **/
        //Reset modal on hide
        $("#removeModal").on("hidden.bs.modal", function(e){
          resetModal("#removeModal");
        });
        //Add id to the modal on show
        $("#removeModal").on("show.bs.modal", function(e){
          $("#itemToRemoveImage").attr('src',$(this).data('src'));
          $("#itemToRemoveImage").closest('a').attr('href',$(this).data('url'));
          
        });

        $('.btn-remove-track').on('click',function(e){
          var productId = $(this).data('id');
          var productURL = $(this).closest('a').attr('href');
          var src = $(this).closest('img').attr('src');

          $("#removeModal").data('pid',productId);
          $("#removeModal").data('src', src);
          $("#removeModal").data('url', productURL);
          $("#removeModal").modal('show');
        });

        $('#removeTrack').on('click',function(e){
          e.preventDefault();
          loading();
          var timeout = setTimeout(function(){
            hideLoading();
          },5000);
          var productId = $("#removeModal").data('pid');
          $.ajax({
            method:"GET",
            url:"/remove",
            data:{pid:productId, uid:firebase.auth().currentUser.uid},
            success: function(data){
              clearTimeout(timeout);hideLoading();
              if(data.success == true){
                alertSend('Item removed successfully', '#removeModal .modal-content .modal-body .container-fluid','success');
                setTimeout(function(){
                  location.reload();
                },2000);
              }else{
                alertSend('Not able to access DB. Try again later...', '#removeModal .modal-content .modal-body .container-fluid','danger');
                console.log(data.error);
              }
            },
            error:function(error){
              console.log(error);
              alertSend('Error during request. Check console for more information.', '#removeModal .modal-content .modal-body .container-fluid','danger');
            }
          });
        });

      }
      else{
        $("#products").html(noProducts);
      }
    },
    error:function(error){
      console.log(error);
      alertModal('alert-danger','Error during request...','Error');
    }
  });

  /**
    *** Adding products and trackers
  **/
  $('#addTrack').on('click', function(e){
    e.preventDefault();
    var url = JSON.parse(JSON.stringify($("#addproduct").val()));
    var validate = validateURL(url);

    if(!url){
      alertSend("Empty URL. Please, check.", "#addModal .modal-body");
      $("#addproduct").closest('.form-group').addClass('has-error');
    }
    else if(validate != true){
      alertSend(validate, "#addModal .modal-body","danger","Invalid URL!");
      $("#addproduct").closest('.form-group').addClass('has-error'); 
    }
    else{
       var progress = progressBarAnimate("#addModal .modal-body",10);
      loading();
      var timeout = setTimeout(function(){
        hideLoading();
      },20000);
      $.ajax(
        {
          url: '/add',
          method: "POST",
          data:{url:url, uid: firebase.auth().currentUser.uid}, //
          success:function(data, textStatus, jqXHR){
              $("#addModal .modal-body .progress-bar").css('width','100%');
              $("#addModal .modal-body .progress").remove();
              $("#addModal .modal-body .prepend").remove();
            if(data.success){
              resetModal("#addModal");
              alertSend("You have "+data.remaining+" tracks remaining.", "#addModal .modal-body", "success","Product saved!"); 
              $("#addproduct").closest('.form-group').addClass('has-success');
              setTimeout(function(){
                location.reload();
              },2000);
            }
            else{
              alertSend(data.error.message, "#addModal .modal-body","danger","Error!");
              console.log(data.error);
            }
            clearTimeout(timeout);hideLoading();
          },
          error: function(jqXHR, textStatus, errorThrown){
            alertSend("Error while processing request. Please, check again later.", "#addModal .modal-body","danger",errorThrown);
            console.log(errorThrown);
            clearTimeout(timeout);hideLoading();
          }
        }
      );
    }
  });

  $("#addModal").on("hidden.bs.modal", function(e){
    resetModal("#addModal");
  });

  $('.signoutBtn').on('click', function(e){
    ga('send', 'event','click', 'btn', 'SignOut');
    loading();
    setTimeout(function(){
      hideLoading();
    },5000);
    signOut();  
  });
  hideLoading();
});





/**
**    Functions
**/

//Sign Out
function signOut(){
  Cookies.remove('uid');
  firebase.auth().signOut().then(function() {
    window.location.pathname = "/";
  }, function(error) {
    var errorMessage = error.message;
    console.log(error);
    alertModal('danger',errorMessage);
    hideLoading();
  });
}



function validateURL(url){
if(url.indexOf("uae.souq.com") == -1){
      return "Please check if the link is the one from souq: 'http://uae.souq.com...'";
    }
    else{
      return true;      
    }
}

function progressBarAnimate(selector,time){
  var bar="";
  bar += "<div class=\"progress\">";
  bar += "  <div class=\"progress-bar progress-bar-info\" role=\"progressbar\" aria-valuenow=\"40\" aria-valuemin=\"0\" aria-valuemax=\"100\" style=\"width: 0%\">";
  bar += "  <\/div>";
  bar += "<\/div>";
  $(selector).prepend(bar);
  var maxWidth = $(selector+" .progress").width();
  $(selector+" .progress").parent().prepend("<div class='prepend'>Please wait...</div>");
  var $bar = $(selector+" .progress-bar");
  var step = maxWidth/15;
  var progress = setInterval(function() {
      if($bar.width() < maxWidth){
        $bar.width($bar.width()+step);
      }
      else{
        $(selector+" .progress-bar").addClass('progress-bar-striped active');
      }
  }, 300+Math.floor((Math.random() * 100) + 1));
  return progress;
}

//Convert DB timestamp to dataOBJ

function timestamp2dateObj(timestamp){
  var dateString = timestamp.slice(0,-2).split('/');
  var date = new Date(parseInt(dateString[2]),parseInt(dateString[1])-1,parseInt(dateString[0]));
  var dateObj ={
    day:parseInt(dateString[0]),
    month: parseInt(dateString[1]),
    year: parseInt(dateString[2]),
    hour: parseInt(timestamp.slice(-2).replace("_","")),
    date: date,
    weekDay: weekDay(date.getDay())
  };
  return dateObj;
}

//Generate Graph
function generateGraph(pid, obj, selector){
  return new Promise(function(resolve,reject){
    var container = $(selector).find('.ct-chart');
      $(container).html('');
      var containerID = $(container).attr('id');
      $.ajax({
        method: "POST",
        url: "/logs",
        data: {pid:pid},
        success: function(data){
            if(data.success){
              var timestamps = [];
              var prices = [];
              var datesArray = [];
              data.stamps.forEach(function(ele,i){
                var date = timestamp2dateObj(ele.timestamp);
                if(datesArray.length > 0){
                  if(!containsObject({day:date.day,month:date.month,year:date.year},datesArray)){
                      prices.push(ele.price);
                      timestamps.push(date.day+"/"+date.month+"<br>("+ele.price+")");    
                      datesArray.push({day:date.day, month:date.month, year:date.year});
                  }
                }else{
                  prices.push(ele.price);
                  timestamps.push(date.day+"/"+date.month+"<br>("+ele.price+")");    
                  datesArray.push({day:date.day, month:date.month, year:date.year});
                }
              });
              //var dataSetup = makeGraphData(prices, timestamps);
              //Create graph.
              var chart = new Chartist.Line("#"+containerID, {
                labels: timestamps,
                series: [prices]
              },{
                low:0,
                showArea: true
              });
              resolve(chart);
            }
            else{
              console.log(data.error);
              resolve(false);
            }
        },
        error: function(error){
          console.log(error);
          resolve(false);
        }
      });
      // TODO Mark the day you started tracking this shit
      if(obj){}//TODO
  });
}

function containsObject(obj, list) {
    for (var i = 0; i < list.length; i++) {
        if (JSON.stringify(list[i]) === JSON.stringify(obj)) {
            return true;
        }
    }
    return false;
}

//TODO
/* 
**  Basically, this  function needs to check for "holes" in the weekly graph and fill (or not) them with 
**  possible prices for that day. This is for a case in which there is prices for day X, day X+2 but none
**  for day X+1. Therefore there is a 'hole' in that graph.
**
**
function makeGraphData(prices, days){
  var day;
  //Get last 5 days
  var lastWeek = [];
  for(var i = 0; i<5; i++){
    day = moment().subtract(i,'days');
    lastWeek.push({timestamp:day.format("D/M/YYYY"), week:weekDays(day.format('d'))});
  }
}
*/

//Return WeekDay
function weekDay(n){
  if(n>=7)
    return false

  var weekDays = [];
  var mode = $("#isSmartphone").css('display') === 'none' ? 'sm':'md';
  switch(mode){
    case 'lg':
      weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      break;
    case 'md':
     weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
     break;
    case 'sm':
      weekDays = ["S", "M", "T", "W", "T", "F", "S"];
      break;
    default:
      weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  }
  if(n === -1)
      return weekDays;

}
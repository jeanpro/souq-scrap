//Profile Events


function alertSend( msg, selector, type,strong){
  if(!type){
    var type = "danger";
  }
  if(!strong){
    if(type=="danger"){
      var strong = "Error!";
    }
    else{
      var strong = "";
    }
  }
  var alertHTML="";
  alertHTML += "<div class=\"alert alert-"+type+" alert-dismissible\" role=\"alert\">";
  alertHTML += "            <button type=\"button\" class=\"close\" data-dismiss=\"alert\" aria-label=\"Close\"><span aria-hidden=\"true\">&times;<\/span><\/button>";
  alertHTML += "            <strong>"+strong+"<\/strong> "+ msg;
  alertHTML += "          <\/div>";

  var alerts = $(selector).find('.alert');

  if($(alerts).length){
    alerts.each(function(i,ele){
      $(ele).remove();
    });  
  }

  $(selector).prepend(alertHTML);
  }


$(document).ready(function(){
  $(".addonModal").on('shown.bs.modal', function(){
    $("#links-collapse").collapse('hide');
  });

$('#addTrack').on('click', function(e){
  e.preventDefault();
  var url = $("#addproduct").val();
  if(!url){
    alertSend("Empty URL. Please, check.", "#addModal .modal-body");
    $("#addproduct").closest('.form-group').addClass('has-error');
  }
  else if(!validadeURL(url)){
    alertSend("Invalid URL. Please, check.", "#addModal .modal-body");
    $("#addproduct").closest('.form-group').addClass('has-error'); 
  }
  else{
    alertSend("Loading...","#addModal .modal-body","info");
    $.ajax(
      {
        url: '/add',
        method: "POST",
        data:{url:url},
        success:function(data, textStatus, jqXHR){
          if(data.success){
            resetModal("#addModal");
            alertSend("You have "+data.remaining+" tracks remaining.", "#addModal .modal-body", "success","Product saved!"); 
            $("#addproduct").closest('.form-group').addClass('has-success');
            console.log(data);
            console.log("TextStatus:");
            console.log(textStatus);
            console.log("jqXHR:");
            console.log(jqXHR);
          }
          else{
            alertSend("Invalid Request. Please, check.", "#addModal .modal-body");
            console.log(data);
            console.log("TextStatus:");
            console.log(textStatus);
            console.log("jqXHR:");
            console.log(jqXHR);
          }
        },
        error: function(jqXHR, textStatus, errorThrown){
          alertSend("Error while processing request. Please, check again later.", "#addModal .modal-body","danger",errorThrown);
          console.log(errorThrown);
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
  $("#loading").show();
  $.get('/signout',function(data){
    if(data.success){
      signOut();    
    }
    else{
      alertModal('danger',data.message,"Error");
    }
  })
  
});

hideLoading();
});
//Sign Out
function signOut(){
  firebase.auth().signOut().then(function() {
    location.reload();
  }, function(error) {
    var errorMessage = error.message;
    console.log(error);
    alertModal('danger',errorMessage);
  });
}

function resetModal(selector){
    //Reset modal
  var modalBody = $(selector+" .modal-body");
  var alerts = $(modalBody).find(".alert");
  if($(alerts).length){
    alerts.each(function(i,ele){
      $(ele).remove();
    });  
  }
  $(modalBody).find('.form-group').each(function(i, ele){
    $(ele).removeClass('has-error');
    $(ele).removeClass('has-success');
    $(ele).find("input").val('');
  });
}

function validadeURL(url){
if(url.indexOf("uae.souq.com") == -1){
      return false;
    }
    else{
      return true;
    }
}


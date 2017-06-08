  // Initialize Firebase
  var config = {
    apiKey: "",
    authDomain: "souqscrap.firebaseapp.com",
    databaseURL: "https://souqscrap.firebaseio.com",
    storageBucket: "souqscrap.appspot.com",
    messagingSenderId: ""
  };
  firebase.initializeApp(config);

function alertModal(type, msg, title){
  if(!title){
    var title = "Hey!";
  }
  var alert="";
  alert += "<div class=\"alert alert-"+type+" alert-dismissible\" role=\"alert\">";
  alert += msg;
  alert += "<\/div>";

  $("#alertModalTitle").html(title);
  $("#alertModalBody").html(alert);
  $("#alertModal").modal('show');
}
loading();
$(document).ready(function(){
  $('#privacyPolicy').on('shown.bs.modal', function (e) {
    $('#privacyBody').load('privacy_template.html');
  });

  $('#termsAndConditions').on('shown.bs.modal', function (e) {
    $('#termsBody').load('terms_template.html');
  });

  $('#alertModal').on('hidden.bs.modal', function (e) {
    $('#alertModalBody').html('');
  });

  //Privacy Policy and Terms page
  $('#privacyTemplate').load('privacy_template.html');
  $('#termsTemplate').load('terms_template.html');
});

function loading(){
  $("#loading").show();
  $('*').css('pointer-events','none');
}
function hideLoading(){
  $("#loading").hide();
  $('*').css('pointer-events','auto');
}

function alertSend( msg, selector, type,strong){
  var strong = strong || false;
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

function resetModal(selector,obj){
  var modalBody;

  if(!selector){
    modalBody = $(obj).find('.modal-body');
  }
  else{
    modalBody = $(selector+" .modal-body");  
  }

  // Remove prepends
  var prepends = $(modalBody).find(".prepend");
  if($(prepends).length){
    prepends.each(function(i,ele){
      $(ele).remove();
    });
  }

  //remove alerts
  var alerts = $(modalBody).find(".alert");
  if($(alerts).length){
    alerts.each(function(i,ele){
      $(ele).remove();
    });  
  }
  //remove bars
  var bars = $(modalBody).find(".progress");
  if($(bars).length){
    bars.each(function(i,ele){
      $(ele).remove();
    });  
  }

  //remove messages
  var msgs = $(modalBody).find('.help-block').find("ul");
  if($(msgs).length){
    msgs.each(function(i,ele){
      $(ele).remove();
    });
  }
  //reset form
  $(modalBody).find('.form-group').each(function(i, ele){
    $(ele).removeClass('has-error');
    $(ele).removeClass('has-success');
    $(ele).find("input").val('');
  });
}
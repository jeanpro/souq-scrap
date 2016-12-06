  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyAejbIcHE2XvotoO-26jVSdnhhNOd4kOZU",
    authDomain: "souqbusq.firebaseapp.com",
    databaseURL: "https://souqbusq.firebaseio.com",
    storageBucket: "souqbusq.appspot.com",
    messagingSenderId: "732260061095"
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
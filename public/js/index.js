$(document).ready(function(){

  /**
  ** Events
  **/

  $(".signInFB").on('click',function(event){
    event.preventDefault();
    console.log("Click");
  });

  $(".signInG").on('click',function(event){
    event.preventDefault();
    console.log("Click");
  });

//Sign In Button
$('.signinBtn').on('click', function(e){
  ga('send', 'event','click', 'btn', 'SignIn');
  var status = $('#signinBtn').data('status');
  if(!status){
    $("#loginModal").modal('show');
  }
  else{
    $('#signupForm').trigger("reset");
  }
});

//Sign In Form
$(".signinForm").on("submit", function(event){
        event.preventDefault(); // prevent default submit behaviour
        loading();
        // get values from FORM
        var email = $("input#email").val();
        var password = $("input#password").val();
        toggleSignIn(email,password);
      });

/**
*   Sign Up Form Validation
**/
$("#signUpModal").on("shown.bs.modal", function(){
  $(".signupForm").on("submit",function(event){
        event.preventDefault(); // prevent default submit behaviour
        loading();
        if(!$(this).find('button[type="submit"]').hasClass('disabled')){
          ga('send', 'event','click', 'submitForm', 'ValidationSignUp');
          // get values from FORM
          var formid = $(this).attr('id');
          var name = $('#'+formid).find('input#name').val();
          var email = $('#'+formid).find('input#email').val();
          var password = $('#'+formid).find('input#password').val();
          var userAuth = handleSignUp(name,email,password);
          userAuth.then(function(user){
              // Add information from user in DB
              user.then(function(user){
                  // console.log(user);
                  alertModal('success','Thank you for registering!', "Yay!");
                   var usersInfoRef = firebase.database().ref('usersInfo');
                   var newUser = usersInfoRef.push();
                    newUser.set({
                          provider: user.providerData[0].providerId,
                          name: name,
                          email: user.providerData[0].email,
                          photo: user.providerData[0].photoURL
                    });
              var email = sendEmailVerification();
              email.then(function(){
                  alertModal('success','Sign Up complete! You will receive an email shortly.', "Yay!");
              });
              ga('send', 'event','click', 'submitForm', 'signUp');   
              });
          }).catch(function(error){
              $('input').val('');
          });
        }
  })
});

// Sign In with Facebook
$(".signInFB").on('click',function(event){
    event.preventDefault();
    var provider = new firebase.auth.FacebookAuthProvider();
    provider.addScope('email');
    // provider.setCustomParameters({
    //   'display': 'popup'
    // });
    signInWithRedirect(provider);
});

// Sign In with Google
$(".signInG").on('click',function(event){
    event.preventDefault();
    var provider = new firebase.auth.GoogleAuthProvider();
    signInWithRedirect(provider);
});  

initApp();
});



/**
 * Handles the sign in button press.
 */
function toggleSignIn(email, password) {
  if (firebase.auth().currentUser) {
    firebase.auth().signOut();
  } else {
    firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
      var errorCode = error.code;
      var errorMessage = error.message;
      console.log(error);
      alertModal('danger',errorMessage,'Sign In fail!');
    });
  }
}


// Sign Up Form Scripts

// Get a reference to the database service
var database = firebase.database();

/**
 * Handles the sign up button press.
 */
function handleSignUp(name, email, password) {
    var firstName = name; // For Success/Failure Message
    // Check for white space in name for Success/Fail message
    if (firstName.indexOf(' ') >= 0) {
        firstName = name.split(' ').slice(0, -1).join(' ');
    }
  // Sign in with email and pass.
  // [START createwithemail]
  var user = firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    alertModal('danger',errorMessage);
    console.log(error);
    return false;
  });
  // [END createwithemail]
  return user;
  
}

/**
 * Sends an email verification to the user.
 */
function sendEmailVerification() {
  return firebase.auth().currentUser.sendEmailVerification();
}


/**
 * SignIn with Facebook workflow.
 */

function signInWithRedirect(provider){
    var auth = firebase.auth();
    // Sign in with redirect:
    auth.signInWithRedirect(provider);
    // Then redirected back to the app, where we check the redirect result:
    auth.getRedirectResult().then(function(result) {
      // The firebase.User instance:
      // The signed-in user info.
      var user = result.user;
    }, function(error) {
        var errorMessage = error.message;
        console.log(error);
        alertModal('danger', errorMessage,"Sign Up fail!");
      // In case of auth/account-exists-with-different-credential error,
      // you can fetch the providers using this:
      if (error.code === 'auth/account-exists-with-different-credential') {
        auth.fetchProvidersForEmail(email).then(function(providers) {
          //TODO Need to adjust here!
        });
      }
    });
}

  


/**
 * initApp handles setting up UI event listeners and registering Firebase auth listeners:
 *  - firebase.auth().onAuthStateChanged: This listener is called when the user is signed in or
 *    out, and that is where we update the UI.
 */
function initApp() {
  // Get a reference to the database service
  var database = firebase.database();
  // Listening for auth state changes.
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) { 
       $('#signinBtn').data('status',true);
      firebase.database().ref('usersInfo/'+user.uid).update({
            provider: user.providerData[0].providerId,
            name: user.providerData[0].displayName,
            email: user.providerData[0].email,
            photo: user.providerData[0].photoURL
      }).then(function(){
        ga('set', 'userId', user.uid); // Set the user ID using signed-in user_id.
        if(window.location.pathname === "/"){
          loading();
          $.post('/login', {uid:user.uid}, function(data){
            location.reload();
            setTimeout(function() {
              hideLoading();
            }, 1000);
          });
        }
      });
    } else {
      console.log("No user logged in");
      hideLoading();
    }
    
  });
}


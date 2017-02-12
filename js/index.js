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
        if(!$('.signinForm').find('.btn').hasClass('disabled')){
          loading();
          // get values from FORM
          alertSend(" ","#successSignIn","info","Loading...");
          var email = $("input#email").val();
          var password = $("input#password").val();
          toggleSignIn(email,password);
        }
      });

/**
*   Sign Up Form Validation
**/
$(".modal").on('hide.bs.modal',function(e){
  resetModal(false,this);
});

$("#signUpModal button").on('click',function(event){
  if($(this).hasClass('disabled')){
    event.preventDefault();
  }
});
$("#signUpModal").on("shown.bs.modal", function(){
  $(".signupForm").on("submit",function(event){
        event.preventDefault(); // prevent default submit behaviour
        loading();
        var timeout = setTimeout(function(){
          hideLoading();
        },5000);
        if(!$(this).find('button[type="submit"]').hasClass('disabled')){
          ga('send', 'event','click', 'submitForm', 'ValidationSignUp');
          // get values from FORM
          var formid = $(this).attr('id');
          var name = $('#'+formid).find('input#name').val();
          var email = $('#'+formid).find('input#email').val();
          var password = $('#'+formid).find('input#cpassword').val();
          alertSend(" ","#successSignUp","info","Loading...");
          var userAuth = handleSignUp(name,email,password);
          if(userAuth){
            userAuth.then(function(user){
              // Add information from user in DB
             var usersInfoRef = firebase.database().ref('usersInfo');
             var newUser = usersInfoRef.push();
              newUser.set({
                    provider: user.providerData[0].providerId,
                    name: name,
                    email: user.providerData[0].email,
                    photo: user.providerData[0].photoURL
              });
              ga('send', 'event','click', 'submitForm', 'signUp');
            }).catch(function(error){
              alertSend(error.message,"#succesSignUp","danger","Error!");
              console.log(error);
              clearTimeout(timeout);hideLoading();
            });
          }
          else{
            alertSend("Password and/or email not valid.","#succesSignUp","danger","Error!");  
            clearTimeout(timeout);hideLoading();  
          }
          
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
      var errorMessage = error.message;
      alertSend(errorMessage,'#loginModal .modal-body','danger','Sign In fail!');
      hideLoading();
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
  if(!password || !email ){
    alertSend("Password and/or email invalid","#succesSignUp","danger","Error!");
    hideLoading();
    return false;
  }
  // Sign in with email and pass.
  return firebase.auth().createUserWithEmailAndPassword(email, password);
  
}

/**
*** Sends an email verification to the user.
*/

/* TODO Need to implement sendEmail verification
*
  var email = sendEmailVerification();
  email.then(function(){
      alertSend('Sign Up complete! You will receive an email shortly.','#succesSignUp', 'success',"Yay!");
      clearTimeout(timeout);hideLoading();
  }).catch(function(error){
    alertSend(error.message,"#succesSignUp","danger","Error!");
    console.log(error);  
  });
*
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
      Cookies.set('uid', user.uid);
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
          window.location.pathname = "auth/"+user.uid;
        }
      });
    } else {
      console.log("No user logged in");
      hideLoading();
    }
    
  });
}

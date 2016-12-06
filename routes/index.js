var express = require('express');
var router = express.Router();
var request = require('request');
//debugger
var debugRequest = require('request-debug')(request);
var cheerio = require('cheerio');

// Import Firebase Admin SDK
var admin = require("firebase-admin");

// Get a database reference to our posts
var db = admin.database();


/* GET home page. */
router.get('/', function(req, res, next) {
	if(!req.session.souquid){
  		// res.render('pages/index');
  		res.render('pages/auth',{name:"Jean Phelippe"});
	}
	else{
		res.redirect('/auth');
	}
});


router.get('/auth',function(req,res){
	if(!req.session.souquid){
		res.redirect('/');
	}
	else{
		var uid = req.session.souquid;
		var ref = db.ref("usersInfo/"+uid);
		ref.once("value", function(snapshot) {
			var name = snapshot.val().name ? snapshot.val().name:"Anonymous";
			return res.render('pages/auth',{name:name});
		}, function (errorObject) {
		  console.log("The read failed: " + errorObject.code);
		  res.next(errorObject);
		});
	}
});


router.post('/login', function(req, res, next) {
	if(!req.body.uid){
		res.redirect('/');
	}
	else{
		req.session.souquid = req.body.uid;
		return res.redirect('/auth');	
	}
});

router.get('/signout',function(req,res,next){
	req.session.souquid = null;
	res.send({success: true, message:'...'});
});

//Add Product

router.post('/add', function(req,res){
	var url = req.body.url;

	request('http://uae.souq.com/ae-en/romoss-solo-3-6000-mah-powerbank-white-6322513/i/', function (error, response, body) {
		  if (!error && response.statusCode == 200) {
		    console.log(body) // Show the HTML for the Google homepage.
		    res.send({success: true, remaining:123, body:body});
		  }
		  else{
		  	res.send({success: false, remaining:123, body:error});
		  }

	});
	 
		  
	 // request(url, function(error, response, html){
  //       if(!error && response.statusCode == 200){
  //           var $ = cheerio.load(html);
  //           var title, release, rating;
  //           var json = { title : "", release : "", rating : ""};
  //           res.send({success: true, remaining:123});
  //       }
  //       else{
  //       	console.log(error);
  //       	console.log(response.statusCode);
		// 	res.send({success: false, remaining:-1, error:error, status:response.statusCode});        	
  //       }
  //   });

	
});

module.exports = router;

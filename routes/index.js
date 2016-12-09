var express = require('express');
var router = express.Router();
var request = require('postman-request');
var cheerio = require('cheerio');
var fs = require('fs');
var ejs = require('ejs');

// Import Firebase Admin SDK
var admin = require("firebase-admin");

// Get a database reference to our posts
var db = admin.database();
var adminKey = "tTga6qjzLjMmlLmKv90qH0dlrq23";
//Max products t o track per user
var maxProducts = 10;

/* GET home page. */
router.get('/', function(req, res, next) {
  		res.render('pages/index');
  		
});

router.get('/auth/:uid',function(req,res){
	if(!req.params.uid){
		res.redirect('/');
	}
	else{
		if(req.params.uid === adminKey){
			var uid = req.params.uid;
			var ref = db.ref("usersInfo/"+uid);
			ref.once("value", function(snapshot) {
				var name = snapshot.val().name ? snapshot.val().name:"Anonymous";
				res.redirect('/admin');
			}, function (errorObject) {
			  console.log("The read failed: " + errorObject.code);
			  res.next(errorObject);
			});
		}
		else{
			var uid = req.params.uid;
			var ref = db.ref("usersInfo/"+uid);
			ref.once("value", function(snapshot) {
				var name = snapshot.val().name ? snapshot.val().name:"Anonymous";
				res.redirect('/user');
			}, function (errorObject) {
			  console.log("The read failed: " + errorObject.code);
			  res.next(errorObject);
			});
		}
	}
});

router.get('/user',function(req,res){
	res.render('pages/auth');
});

router.get('/admin',function(req,res){
	res.render('pages/admin');
});

router.post('/listall',function(req,res){
	var uid = req.body.uid;
	if(uid != adminKey){
		res.redirect('/');
	}
	var templateString = fs.readFileSync('./views/partials/table.ejs', 'utf-8');
	var prodRef = db.ref('products');
	prodRef.once('value',function(snapshot){
		var dataArray = [];
		if(snapshot.exists()){
			var data = snapshot.val();
			var pids = Object.keys(data);
			pids.forEach(function(pid){
				dataArray.push({
					pid:pid, 
					title:data[pid].title,
					url:data[pid].url,
					actualPrice:data[pid].actualPrice,
					lastUpdate:data[pid].lastUpdate.split('_')[0]+" "+data[pid].lastUpdate.split('_')[1]+"h00"
				});
			});
			var html = compileHTML(templateString,{data:dataArray});
			res.send(html);
		}
	});
});


//Add Product
router.post('/add', function(req,res){
	var url = checkURL(req.body.url);
	var uid = req.body.uid;
	var remainingProducts = -1;
	checkRemaining(uid).then(function(data){
		remainingProducts = parseInt(data);
		if(url && remainingProducts > 0){
			request(url, function(error, response, body){
		        if(!error && response.statusCode == 200){
		        	//console.log("Request successful! Loading body...");
		            var $ = cheerio.load(body);
		            //Get info from website
		            var params = $('#productTrackingParams');
		            var priceTotal = parseFloat(params.attr('data-price'));
		            var quantity = parseInt(params.attr('data-quantity'));
		            var price = priceTotal/quantity;
		            var img = $('.vip-item-img-container').find('img').attr('src');

		            var data = {
		            	price: price,
		            	url: url,
		            	img: img,
		            	title: params.attr('data-title'),
		            	variant: params.attr('data-variant')
		            };
					
					addStamp(data).then(function(pid){
						//console.log("Stamp added!Adding to user...");
						addProductToUser(pid, data.price, uid,res);
					}).catch(function(error){
						//console.log("Error man...");
						send(res,error);
					});	            
		        }
		        else{
					res.send({success: false, remaining:-1, body:null, error:error, res:response});      	
		        }
		    });
		}
		else if(!url){
			res.send({success:false, remaining:-1,body: null, error:{message:'Invalid URL'}, res:null});
		}
		else{
			res.send({success:false, error:{message:"Limit exceed."}});
		}
	}).catch(function(error){
		send(res,error);
	});
});

router.get('/track',function(req,res){
	var uid = req.query.uid;
	var templateString = fs.readFileSync('./views/partials/track.ejs', 'utf-8');
	// Get trackers and dates
	userRef = db.ref('usersInfo/'+uid);
	userRef.once('value',function(snapshot){
		if(snapshot.exists()){
			var d = snapshot.val();
			var remaining = d.remaining;
			var trackers = d.track;
			var html; 
			var trackInfo = {
				pid:[],
				products:[]
			};
			var products = [];
			// get all information
			if(!trackers){
				res.send({success:false, html:null});
			}
			var trackerKeys = Object.keys(trackers);
			trackerKeys.forEach(function(key){
				trackInfo.pid.push(trackers[key].pid); //array of PIDs
				trackInfo.products.push({pid:trackers[key].pid, timestamp:trackers[key].timestamp, originalPrice:trackers[key].originalPrice});
			});

			//return promise for snap of the product info (title, img, url, variant)
			var getTrackers = function trackersInformation(pid){	
				var productRef = db.ref('products/'+pid);
				return productRef.once('value',function(snap){
					products.push({img:snap.val().img, title:snap.val().title, url:snap.val().url, actualPrice:snap.val().actualPrice});
				});
			};
			//return promise for snap of the log of the products (price,timestamp)
			var promiseTrackers = trackInfo.pid.map(getTrackers);

			var results = Promise.all(promiseTrackers);
			results.then(function(data){
				var dataArray = [];

				if(trackInfo.products.length != products.length){ // error in requesting
					res.send({success:false, error:{message:"Database not available. Try again later."}})
				}

				trackInfo.products.forEach(function(ele,i){
					dataArray.push(Object.assign(trackInfo.products[i], products[i]));
				});

				var html = '';
				dataArray.forEach(function(ele,i){
					html += compileHTML(templateString,ele);
				});
				res.send({success:true, html:html});
			});
		}
		else{
			res.send({success:false, error:{message:"No user found."}});
		}
	});

});

router.post('/logs',function(req,res){
	var pid = req.body.pid;
	var templateString = fs.readFileSync('./views/partials/graph.ejs', 'utf-8');

	var productLogs = [];
	var logsRef = db.ref('logs/'+pid);
	logsRef.orderByKey().limitToFirst(5).once('value', function(snap){
			if(!snap.exists()){
				res.send({success:false, error:{message:"Product not found"}, stamps:null});
			}
			var keys = Object.keys(snap.val());
			keys.forEach(function(key){
				productLogs.push({price:snap.val()[key].price, timestamp:snap.val()[key].timestamp});
			});
			res.send({success:true, stamps:productLogs});
	});
});

//Update Product

router.post('/update',function(req,res){
	var pid = req.body.pid;
	var url = req.body.url;
	if(!pid || !url){
		res.send({success:false, error:"No PID and/or URL..."});
	}
	request(url, function(error, response, body){
        if(!error && response.statusCode == 200){
        	//console.log("Request successful! Loading body...");
            var $ = cheerio.load(body);
            //Get info from website
            var params = $('#productTrackingParams');
            var priceTotal = parseFloat(params.attr('data-price'));
            var quantity = parseInt(params.attr('data-quantity'));
            var price = priceTotal/quantity;
            var img = $('.vip-item-img-container').find('img').attr('src');
            var timestamp = now.getDate()+"/"+(parseInt(now.getMonth())+1)+"/"+now.getFullYear()+"_"+now.getHours();
            var data = {
            	price: price,
            	url: url,
            	img: img,
            	title: params.attr('data-title'),
            	variant: params.attr('data-variant')
            };
			
			addStamp(data).then(function(pid){
				checkStatus(pid).then(function(data){
					res.send({success:true, actualPrice:price, lastUpdate:timestamp, status:data});
				}).catch(function(error){
					res.send({success:false, error:error});
				});
			}).catch(function(error){
				res.send({success: false, error:error});
			});	            
        }
        else{
			res.send({success: false, error:error});      	
        }
    });

});

/***
	****** Functions
**/

//Track

// Compile template using EJS and return HTML ready to be appended
function compileHTML(string, data){
	var template = ejs.compile(string);
	return template(data);
}


//Add
function send(res, error){
	res.send({success:false, error:error});
}

function checkRemaining(uid){
	var promise = new Promise(function(resolve, reject){
		var userRef = db.ref('/usersInfo/'+uid);
		userRef.once("value",function(snapshot){
			var actual = snapshot.val().remaining;
			if(actual){
				resolve(actual); 
			}
			else{
				userRef.update({
					remaining:maxProducts,
					track:{}
				}).then(function(){
					resolve(maxProducts);
				}).catch(function(error){
					reject(error);
				});
			}
		},function(errorObject){
			reject(errorObject);
		});
	});
	return promise;
}


function addStamp(data){
	/** Push element to DB **/
	//Check product
	var ref = db.ref("products");
	var pid;
	var promise = new Promise(function(resolve, reject){
		var now = new Date();
		var timestamp = now.getDate()+"/"+(parseInt(now.getMonth())+1)+"/"+now.getFullYear()+"_"+now.getHours();
		ref.orderByChild('title').equalTo(data.title).once('value',function(snapshot){
			if(snapshot.exists()){ //If product exists then add timestamp
				pid = Object.keys(snapshot.val())[0]; //get pid		
				//Check if there is entry for this time.
				var stampRef = db.ref('logs').child(pid).orderByChild('timestamp').equalTo(timestamp).once('value', function(stampsnap){
					if(stampsnap.exists()){ //timestamp already exists
						db.ref('products/'+pid).update({actualPrice:data.price, lastUpdate:timestamp},function(error){ //update actual price.
								resolve(pid);
						});
					}
					else{ // Otherwise add the fuckin price!
						var newStampRef = db.ref('logs/'+pid).push();
						newStampRef.set({
							price: data.price,
							timestamp: timestamp
						}).then(function(){
							db.ref('products/'+pid).update({actualPrice:data.price, lastUpdate:timestamp},function(error){ //update actual price.
								resolve(pid);
							});
						}).catch(function(error){
							reject(error);
						});
					}
				});
			}else{ //if not then add the product
				var newEntryRef = ref.push();
				pid = newEntryRef.key;
				newEntryRef.set({
					title: data.title,
					url:data.url,
					img:data.img,
					variant: data.variant,
					actualPrice: data.price,
					lastUpdate:timestamp
				}).then(function(){
					var newStampRef = db.ref('logs/'+pid).push();
					newStampRef.set({
						price: data.price,
						timestamp: timestamp
					}).then(function(){
						resolve(pid);
					}).catch(function(error){
						console.log(error);
						reject(error);
					});
				}).catch(function(error){
					reject(error);
				});
			}
		}, function(objectError){
			//Couldn't get the snap.
			reject(objectError);
		});
	});
	return promise;
}


function addProductToUser(pid, price, uid, res){
	var userRef = db.ref('/usersInfo/'+uid);
	var remaining;
	var now = new Date();
	var timestamp = now.getDate()+'/'+(now.getMonth()+1)+'/'+now.getFullYear()+"_"+now.getHours();

	userRef.child("track").orderByChild('pid').equalTo(pid).once("value", function(snapshot){
		if(!snapshot.exists()){
			 // Add tracker
			 var newTracker = userRef.child("track").push();
			 newTracker.set({pid:pid, timestamp:timestamp, originalPrice:price});
		}
		checkRemaining(uid).then(function(data){
			remaining = parseInt(data)-1;
			userRef.update({
				remaining:remaining
			}).then(function(){
				res.send({success:true, remaining:remaining});
			}).catch(function(error){
				send(res,error);
			});
		}).catch(function(error){
			send(res,error);
		});
	});
	
}

function checkURL(url){
	var urlChecked;
	if(url.indexOf('http://') == -1 && url.indexOf('https://') == -1){
      urlChecked = 'https://'+url;
  	}
  	else if(url.indexOf('http://') != -1 && url.indexOf('https://') == -1){
  	  urlChecked = url.replace("http","https");
  	}
  	else{
  		urlChecked = url;
  	}
  	return urlChecked;
}

//Check price status
function checkStatus(pid){
	return new Promise(function(resolve,reject){
		if(!pid){
			reject("No PID");
		}
		db.ref('products').orderByKey().equalTo(pid).limitToFirst(2).once('value',function(snap){
			if(snap.exists()){
				var keys = Object.keys(snap.val());
				if(keys.length < 2){
					resolve(null);
				}
				else{
					if(snap.val()[keys[0]].price > snap.val()[keys[1]].price){
						resolve(1);
					}
					else if(snap.val()[keys[0]].price == snap.val()[keys[1]].price){
						resolve(0);
					}
					else{
						resolve(-1);
					}
				}
			}
			else{
				resolve('No information...');
			}
		});
	});
}


module.exports = router;

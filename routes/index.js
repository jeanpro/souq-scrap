var express = require('express');
var router = express.Router();
var request = require('postman-request');
var cheerio = require('cheerio');
var fs = require('fs');
var ejs = require('ejs');
var _ = require('lodash');
var schedule = require('node-schedule');
 

// Import Firebase Admin SDK
var admin = require("firebase-admin");

// Get a database reference to our posts
var db = admin.database();
var adminKey = ["k8uWMfck2FVxRMLCuwTaDckjwjm2","tTga6qjzLjMmlLmKv90qH0dlrq23"];
//Max products t o track per user
var maxProducts = 10;


/*** NODE SCHEDULE ***/
//Every day at 2am

//TODO make it better scalable
var rule = new schedule.RecurrenceRule();
rule.hour = 3;
rule.minute = 06;
var mainJob = schedule.scheduleJob(rule, function(){
	console.log('Starting MainJob - ',new Date());
	console.log('Updating all products in DB...');
	var pidsUpdated = db.ref('updated').remove(); //Clean all updated products
	var productArray = []; // [{pid:'XAQdasxc...', url:'http://...'},{pid:...}]
	var pidArray = [];
	//Get All Pids
  	db.ref('products').once('value',function(snapshot){
  		if(snapshot.exists()){
  			console.log('Getting all pids!');
  			productArray = _.map(snapshot.val(),function(el,key){
	  			if(el.status != 'linkBroken'){
	  				return {pid:key,url:el.url};
	  			}else{
	  				return {pid:key, url:null};
	  			}
	  		});
  		}else{
  			return;
  		}
  		//Create pid array
  		pidArray = _.map(productArray,'pid');
  		if(!_.isEmpty(pidArray)){
  			//Create a job to update each product inside 'pidArray' at 2 min interval
  			console.log('Scheduling job (each 2min)');
  			var job = schedule.scheduleJob(' */1 * * * *',function(){
  				var pidsToUpdate = [];
  				db.ref('updated').once('value',function(snap){
  					//Check which pids left to update
  					if(snap.exists()){
  						var updatedArray = _.values(snap.val()); //get array of obj [{pid:''},{pid:''},...]
  						updatedArray = _.map(updatedArray, 'pid'); //get all pids ['','','',...]
  						pidsToUpdate = _.difference(pidArray,updatedArray);
  					}else{ //update ALL
  						pidsToUpdate = pidArray;
  					}
  					if(_.isEmpty(pidsToUpdate)){ //5alas done
  						console.log('Finished, now back to sleep ;)');
  						job.cancel();
  						return;
  					}
  					else{ //Still left...
  						//Update product
	  					var pid = pidsToUpdate[0]; //first of the list
	  					var url = _.find(productArray,_.matchesProperty('pid',pid)).url; //get url
	  					if(url != null){
		  					updatePrice(pid,url).then(function(data){
		  						if(data.success){ //Product Updated! 
		  							//Add to the updated list
		  							console.log('Product Updated! - PID:',pid);
		  						}else if(data.status === -1){
		  							db.ref('products').child(pid).update({status:'linkBroken'});
		  							var log = '------------\r\n';
		  							log += new Date().toString();
			  						log += 'Error during update of PID: '+pid+'\r\n';
			  						log += 'LINK BROKEN!!!';
			  						log += '------------\r\n';
			  						fs.appendFile('log.txt', log, (err) => {
									  if (err) throw err;
									  console.log('Error Logged!');
									});
		  						}else{
		  							var log = '------------\r\n';
		  							log += new Date().toString();
			  						log += 'Error during update of PID: '+pid+'\r\n';
			  						log += 'Data DUMP: '+JSON.stringify(data);
			  						log += '------------\r\n';
			  						fs.appendFile('log.txt', log, (err) => {
									  if (err) console.log(err);
									  console.log('Error Logged!');
									});
		  						}
		  						var newEntry = db.ref('updated').push();
		  							newEntry.set({
		  								pid:pid
		  							});
		  					}).catch(function(err){
		  						var log = '------------\r\n';
		  						log += new Date().toString();
		  						log += 'Error during update of PID: '+pid+'\r\n';
		  						log += 'Error msg: '+JSON.stringify(err);
		  						log += '------------\r\n';
		  						fs.appendFile('log.txt', log, (err) => {
								  if (err) console.log(err);
								  console.log('Error Logged!');
								});
		  					});
	  					}else{
	  						var newEntry = db.ref('updated').push();
		  							newEntry.set({
		  								pid:pid
		  							});
	  					}
  					}
  				});
  			});
  		}
  	});
});



/* GET home page. */
router.get('/', function(req, res, next) {
  		res.render('pages/index');
});

router.get('/auth/:uid',function(req,res){
	if(!req.params.uid){
		res.redirect('/');
	}
	else{
		var uid = req.params.uid;
		req.session.uid = uid;
		var ref = db.ref("usersInfo/"+uid);
		ref.once("value", function(snapshot) {
				var name = snapshot.val().name ? snapshot.val().name:"Anonymous";
				if(_.includes(adminKey,uid)){
					 res.redirect('/admin');
				}
				else{
					res.redirect('/user');	
				}
			}, function (errorObject) {
			  console.log("The read failed: " + errorObject.code);
			  res.next(errorObject);
			});
	}
});

router.get('/user',function(req,res){
	res.render('pages/auth');
});

router.get('/admin',function(req,res){
	var isAdmin = _.includes(adminKey,req.cookies.uid);
	if(!isAdmin){
		res.redirect('/user');
	}else{
		res.render('pages/admin');	
	}
	
});

router.post('/listall',function(req,res){
	var uid = req.body.uid;
	if(!_.includes(adminKey,req.cookies.uid)){
		res.redirect('/');
	}else{
		listAll(res);
	}

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
			if(_.isEmpty(trackers)){
				res.send({success:false, html:null});
			}
			else{
				var trackerKeys = Object.keys(trackers) || [];
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
		}
		else{
			res.send({success:false, error:{message:"No user found."}});
		}
	});

});

router.post('/logs',function(req,res){
	var pid = req.body.pid;
	productLog(pid,res);
});

//Update Product
router.post('/update',function(req,res){
	var pid = req.body.pid;
	var url = req.body.url;
	if(!pid || !url){
		res.send({success:false, error:"No PID and/or URL..."});
	}
	updatePrice(pid, url, res);

});



/***
	****** Functions
**/

//Price log of the product

function productLog(pid,response){
	var res = response || false;
	var templateString = fs.readFileSync('./views/partials/graph.ejs', 'utf-8');
	var productLogs = [];
	var priceChange = 0;
	var logsRef = db.ref('logs/'+pid);
	logsRef.orderByKey().limitToLast(10).once('value', function(snap){
			if(!snap.exists()){
				if(res){
					res.send({success:false, error:{message:"Product not found"}, stamps:null});
				}else{
					return {success:false, error:{message:"Product not found"}, stamps:null};
				}
			}
			var keys = Object.keys(snap.val());
			keys.forEach(function(key){
				productLogs.push({price:snap.val()[key].price, timestamp:snap.val()[key].timestamp});
			});
			if(productLogs.length >= 2){
				if(productLogs[0].price > productLogs[1].price){
					priceChange = 1;
				}
				else if(productLogs[0].price < productLogs[1].price){
					priceChange = -1;
				}
			}
			if(res){
				res.send({success:true, stamps:productLogs, status:priceChange});	
			}
			else{
				return {success:true, stamps:productLogs, status:priceChange};
			}
	});
}

// List all products
function listAll(response){
	var res = response || false;
	var templateString = fs.readFileSync('./views/partials/table.ejs', 'utf-8');
	var prodRef = db.ref('products');
	var promises = [];
	prodRef.once('value',function(snapshot){
		var dataArray = [];
		if(snapshot.exists()){
			var data = snapshot.val();
			var pids = Object.keys(data) || [];
			pids.forEach(function(pid){
				var request = checkStatus(pid).then(function(checkData){
					dataArray.push({
						pid:pid, 
						title:data[pid].title,
						url:data[pid].url,
						actualPrice:data[pid].actualPrice,
						lastUpdate:data[pid].lastUpdate.split('_')[0]+" "+data[pid].lastUpdate.split('_')[1]+"h00",
						status:checkData
					});
				}).catch(function(err){
					console.log(err);
					dataArray.push({
						pid:pid, 
						title:data[pid].title,
						url:data[pid].url,
						actualPrice:data[pid].actualPrice,
						lastUpdate:data[pid].lastUpdate.split('_')[0]+" "+data[pid].lastUpdate.split('_')[1]+"h00"
					});
				});
				promises.push(request);
			});
			Promise.all(promises).then(function(dataNull){
				var html = compileHTML(templateString,{data:dataArray});
				if(res){
					res.send(html);	
				}else{
					return html;
				}	
			});
		}
	});
}

function listAllPids(){
	var promise = new Promise(function(resolve,reject){
		var prodRef = db.ref('products');
		prodRef.once('value',function(snapshot){
			var dataArray = [];
			if(snapshot.exists()){
				var data = snapshot.val();
				var pids = Object.keys(data) || [];
				pids.forEach(function(pid){
					dataArray.push(pid);
				});
				resolve(dataArray);
			}
		});	
	});
	return promise;
}


// Update

//Update Price of a single product by PID
function updatePrice(pid, url, response){
	var res = response || false;
	var promise = new Promise(function(resolve,reject){
		request(url, function(error, response, body){
	        if(!error && response.statusCode == 200){
	        	//console.log("Request successful! Loading body...");
	            var $ = cheerio.load(body);
	            var now = new Date();
	            //Get info from website
	            var params = $('#productTrackingParams');
	            if(_.isEmpty(params)){//product out
	            	if(res){
	            		res.send({success:false, status:-1, error:"Product out of website..."});
	            	}else{
	            		resolve({success:false, status:-1, error:"Product out of website..."});
	            	}
	            }
	            else{
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
							if(res){
								res.send({success:true, actualPrice:price, lastUpdate:timestamp, status:data});
							}else{
								resolve({success:true, actualPrice:price, lastUpdate:timestamp, status:data});
							}
							
						}).catch(function(error){
							if(res){
								res.send({success:false, error:error});
							}else{
								reject({success:false, error:error});
							}
						});
					}).catch(function(error){
						if(res){
							res.send({success:false, error:error});
						}else{
							reject({success:false, error:error});
						}
					});	 
	            }
	        }
	        else{
				if(res){
					res.send({success:false, error:error});
				}else{
					reject({success:false, error:error});
				}
	        }
	    });
	});
	if(!res){
		return promise;
	}
}



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
		var lastPrice;
		var originalPrice;
		if(!pid){
			reject("No PID");
		}
		var logsRef = db.ref('logs/'+pid);
		var request1= logsRef.orderByKey().limitToFirst(1).once('value',function(snap){
			if(snap.exists()){
				var keys = Object.keys(snap.val());
				originalPrice = snap.val()[keys[0]].price;
			}
			else{
				reject('No information...');
			}
		});
		var request2 = logsRef.orderByKey().limitToLast(1).once('value',function(snap){
			if(snap.exists()){
				var keys = Object.keys(snap.val());
				lastPrice = snap.val()[keys[0]].price;
			}
			else{
				reject('No information...');
			}
		});
		Promise.all([request1,request2]).then(function(data){
			//Compare
			if(lastPrice > originalPrice){
				resolve(1);
			}
			else if(lastPrice < originalPrice){
				resolve(-1);
			}
			else{
				resolve(0);
			}
		});
	});
}


module.exports = router;

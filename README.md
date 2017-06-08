# SouqScrap #

A application to monitor prices on Souq.com, the "Amazon" of the UAE. You can check for price's drop and it can send you a message when it's the best time to buy.

### What is this repository for? ###
This repository contains the last version of the code developed by Jean Phelippe Ramos de Oliveira.
Learning how to develop a full-stack website using `Firebase` and `Twitter's Bootstrap`

*Version 1.0.0*
*June 2017*


### Is it Live? ###
Yep:
http://souqscrap.cf

### How do I get set up? ###

##### Quick Setup
	1. You'll need an account on [ Firebase ](https://firebase.google.com/)
	2. Setup Firebase accordingly, check `firebase.json` and `database.rules.json` and how to setup this shit on Firebase.
	3. Also, check `.firebaserc` file for project name adjustments


##### Configuration

* Configure Firebase on `/js/init.js`
* Add the `adminkey.json` in the root

##### Dependencies

	    body-parser: ~1.15.2,
	    cheerio: ^0.22.0,
	    connect-flash: ^0.1.1,
	    cookie-parser: ~1.4.3,
	    debug: ~2.2.0,
	    ejs: ~2.5.2,
	    express: ~4.14.0,
	    express-session: ^1.14.2,
    	firebase-admin: ^4.0.3,
	    gulp-util: ^3.0.8,
    	lodash: ^4.17.4,
    	morgan: ~1.7.0,
    	node-schedule: ^1.2.0,
    	postman-request: ^2.79.1-postman.1,
    	request: ^2.79.0,
    	serve-favicon: ~2.3.0

##### Database configuration
Firebase FTW!


##### Deployment instructions
I deployed on Amazon EC2, follow some tutorials, but basically you'll need NodeJS installed and a program to control the App running non-stop.

### Contribution guidelines ###

Contribute! :)
I am using `Gulp`

### Log

 `log.txt` is a log for the `node-schedule` thing that update the price of the products automatically every day at 2am.

More info contact me. 

### Who do I talk to? ###

##### Repo owner or admin

Jean Phelippe Ramos de Oliveira
jean.phelippe92@gmail.com

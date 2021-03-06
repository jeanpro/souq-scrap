/*!
 * JavaScript Cookie v2.1.3
 * https://github.com/js-cookie/js-cookie
 *
 * Copyright 2006, 2015 Klaus Hartl & Fagner Brack
 * Released under the MIT license
 */
;(function (factory) {
	var registeredInModuleLoader = false;
	if (typeof define === 'function' && define.amd) {
		define(factory);
		registeredInModuleLoader = true;
	}
	if (typeof exports === 'object') {
		module.exports = factory();
		registeredInModuleLoader = true;
	}
	if (!registeredInModuleLoader) {
		var OldCookies = window.Cookies;
		var api = window.Cookies = factory();
		api.noConflict = function () {
			window.Cookies = OldCookies;
			return api;
		};
	}
}(function () {
	function extend () {
		var i = 0;
		var result = {};
		for (; i < arguments.length; i++) {
			var attributes = arguments[ i ];
			for (var key in attributes) {
				result[key] = attributes[key];
			}
		}
		return result;
	}

	function init (converter) {
		function api (key, value, attributes) {
			var result;
			if (typeof document === 'undefined') {
				return;
			}

			// Write

			if (arguments.length > 1) {
				attributes = extend({
					path: '/'
				}, api.defaults, attributes);

				if (typeof attributes.expires === 'number') {
					var expires = new Date();
					expires.setMilliseconds(expires.getMilliseconds() + attributes.expires * 864e+5);
					attributes.expires = expires;
				}

				try {
					result = JSON.stringify(value);
					if (/^[\{\[]/.test(result)) {
						value = result;
					}
				} catch (e) {}

				if (!converter.write) {
					value = encodeURIComponent(String(value))
						.replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g, decodeURIComponent);
				} else {
					value = converter.write(value, key);
				}

				key = encodeURIComponent(String(key));
				key = key.replace(/%(23|24|26|2B|5E|60|7C)/g, decodeURIComponent);
				key = key.replace(/[\(\)]/g, escape);

				return (document.cookie = [
					key, '=', value,
					attributes.expires ? '; expires=' + attributes.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
					attributes.path ? '; path=' + attributes.path : '',
					attributes.domain ? '; domain=' + attributes.domain : '',
					attributes.secure ? '; secure' : ''
				].join(''));
			}

			// Read

			if (!key) {
				result = {};
			}

			// To prevent the for loop in the first place assign an empty array
			// in case there are no cookies at all. Also prevents odd result when
			// calling "get()"
			var cookies = document.cookie ? document.cookie.split('; ') : [];
			var rdecode = /(%[0-9A-Z]{2})+/g;
			var i = 0;

			for (; i < cookies.length; i++) {
				var parts = cookies[i].split('=');
				var cookie = parts.slice(1).join('=');

				if (cookie.charAt(0) === '"') {
					cookie = cookie.slice(1, -1);
				}

				try {
					var name = parts[0].replace(rdecode, decodeURIComponent);
					cookie = converter.read ?
						converter.read(cookie, name) : converter(cookie, name) ||
						cookie.replace(rdecode, decodeURIComponent);

					if (this.json) {
						try {
							cookie = JSON.parse(cookie);
						} catch (e) {}
					}

					if (key === name) {
						result = cookie;
						break;
					}

					if (!key) {
						result[name] = cookie;
					}
				} catch (e) {}
			}

			return result;
		}

		api.set = api;
		api.get = function (key) {
			return api.call(api, key);
		};
		api.getJSON = function () {
			return api.apply({
				json: true
			}, [].slice.call(arguments));
		};
		api.defaults = {};

		api.remove = function (key, attributes) {
			api(key, '', extend(attributes, {
				expires: -1
			}));
		};

		api.withConverter = init;

		return api;
	}

	return init(function () {});
}));
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
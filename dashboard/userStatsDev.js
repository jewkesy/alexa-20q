"use strict";

var request = require('request');
var url = "https://api.mongolab.com/api/1/databases/";
var db = process.argv[2];
var QCollection = process.argv[3];      // "stats";
var apiKey = process.argv[4]; 
var userId =  process.argv[5]; 

exports.handler = function (event, context) {
  init();
};

init();

function init() {

	var mongoURL = url + db  +  "/collections/" + QCollection + "?q={%22userId%22:%22" + userId + "%22}&f={%22userId%22:0,%22_id%22:0}&apiKey=" + apiKey;

	console.log(mongoURL)
	request(mongoURL, function(err, response){
		var playr = JSON.parse(response.body);
		 getIntro(playr);
	});
}

function getIntro(playr) {
	// find category fav

	// find win vs lose

	// find same words

	// find last time played

}
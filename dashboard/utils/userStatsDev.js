"use strict";

var request = require('request');
var url = "https://api.mongolab.com/api/1/databases/";
var db = process.argv[2];
var QCollection = process.argv[3];      // "stats";
var apiKey = process.argv[4]; 
var userId =  process.argv[5];
var console = require('tracer').colorConsole();

exports.handler = function (event, context) {
  init();
};

init();

function init() {

	var mongoURL = url + db + "/collections/" + QCollection + "?q={%22userId%22:%22" + userId + "%22}&f={%22userId%22:0,%22_id%22:0}&apiKey=" + apiKey;

	console.log(mongoURL)
	request(mongoURL, function(err, response){
		var playr = JSON.parse(response.body);
		 getIntro(playr);
	});
}

function getIntro(playr) {
	var cats = [];
	var words = [];
	var wins = 0;
	var loses = 0;
	var fails = 0;

	for (var i = 0; i < playr.length; i++) {
		switch(playr[i].type) {
			case "Animal":
			case "Vegetable":
			case "Mineral":
			case "Other":
			case "Unknown":
				upsertArray(playr[i].type, cats);
				break;
			default:
				break;

		}
	    upsertArray(playr[i].word, words);
	    if (playr[i].win == true) {
	    	wins++;
	    } else {
	    	if (playr[i].num == 30) {
	    		fails++;
	    	} else {
	    		loses++;
	    	}
	    }
	}

	// find same words
	words.sort(sortByCount);

	// find category fav
	cats.sort(sortByCount);

	console.log(words);
	console.log(cats);

	// find last time played
	console.log(playr[playr.length-1]);
	
	var lastPlayed = diff_minutes(new Date(playr[playr.length-1].timestamp), new Date());

	console.log(lastPlayed);

	console.log(wins);
    console.log(loses);
    console.log(fails);

	// find win vs lose

}

function diff_minutes(dt2, dt1) {
	// console.log(dt2, dt1)
	var diff =(dt2.getTime() - dt1.getTime()) / 1000;
	diff /= 60;
	return Math.abs(Math.round(diff));
}

function sortByCount(a,b) {
  if (a.count < b.count)
    return 1;
  if (a.count > b.count)
    return -1;
  return 0;
}

function upsertArray(key, array) {
  var position = keyExists(key, array);
  if (position > -1) {
    array[position].count++;
  } else {
    array.push({key: key, count: 1});
  }
}

function keyExists(name, arr) {
  for(var i = 0, len = arr.length; i < len; i++) {
    if( arr[ i ].key === name ) return i;
  }
  return -1;
}
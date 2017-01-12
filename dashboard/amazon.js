"use strict";

var request = require('request');
var cheerio = require('cheerio');
var console = require('tracer').colorConsole();
var async = require('async');

const urlUK = "https://www.amazon.co.uk/Daryl-Jewkes-twenty-questions/dp/B01N6I0G8D";
const urlUS =   "https://www.amazon.com/Daryl-Jewkes-twenty-questions/dp/B01N6I0G8D";

getRatings();

function getRatings() {


	async.parallel({
	    uk: function(callback) {
		    request(urlUK, function(err, response, html){
		    	if (err) return callback(err);

		    	var $ = cheerio.load(html, {ignoreWhitespace : true})

		    	var reviews = parseInt($('.a2s-review-star-count').text());
		    	var score = $('.a-icon-star-small').attr().class.split(' ')[2];
		    	score = score.replace("a-star-small-", "");
		    	score = parseFloat(score.replace("-", "."));

		    	return callback(null, {
		    		score: score,
					reviews: reviews
				});
		    });
	    },
	    us: function(callback) {
	        request(urlUS, function(err, response, html){
		    	if (err) return callback(err);
		    	var $ = cheerio.load(html, {ignoreWhitespace : true})
		    	console.log(html)
		    	var reviews = parseInt($('.a2s-review-star-count').text());
		    	
		    	console.log($('.a2s-pdd-reviews').html())



		    	// var score = $('.a-icon-star-small').attr().class.split(' ')[2];
		    	score = score.replace("a-star-small-", "");
		    	score = parseFloat(score.replace("-", "."));

		    	return callback(null, {
		    		score: score,
					reviews: reviews
				});
		    });
	    }
	}, function(err, results) {
		console.log(results)
	    // results is now equals to: {one: 1, two: 2}
	});


}

function getScoreParts(html) {
	console.log(html);

	var score = 0;
	var reviews = 0;
	var top = "";

	return {
		score: score,
		reviews: reviews,
		top: top
	}
}
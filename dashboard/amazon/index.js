"use strict";

var request = require('request');
var cheerio = require('cheerio');
var console = require('tracer').colorConsole();
var async = require('async');
var MongoClient = require('mongodb').MongoClient, assert = require('assert');

const urlUK = "https://www.amazon.co.uk/Daryl-Jewkes-twenty-questions/dp/B01N6I0G8D";
const urlUS =   "https://www.amazon.com/Daryl-Jewkes-twenty-questions/dp/B01N6I0G8D";
// var url = process.env.mongoURI;
var url = process.argv[2];

exports.handler = function (event, context) {
  getRatings();
};

getRatings();

function getRatings() {
	async.parallel({
	    uk: function(callback) {
		    request(urlUK, function(err, response, html){
		    	if (err) return callback(err);
		    	// console.log(html)
		    	var $ = cheerio.load(html, {ignoreWhitespace : true})
		    	var robot = $('title').text();
		    	if (robot == 'Robot Check') return callback(null, {});

		    	var reviews = parseInt($('.a2s-review-star-count').text());
		    	var score = $('.a-icon-star-small').attr().class.split(' ')[2];
		    	score = score.replace("a-star-small-", "");
		    	score = parseFloat(score.replace("-", "."));

		    	return callback(null, {
		    		score: score,
					reviews: reviews,
					url: urlUK
				});
		    });
	    },
	    us: function(callback) {
	        request(urlUS, function(err, response, html){
		    	if (err) return callback(err);
		    	// return callback(null, {});
		    	var $ = cheerio.load(html, {ignoreWhitespace : true})
		    	var robot = $('title').text();
		    	if (robot == 'Robot Check') return callback(null, {});

		    	var reviews = parseInt($('.a2s-review-star-count').text());
		    	var score = $('.a-icon-star-small').attr().class.split(' ')[2];
		    	score = score.replace("a-star-small-", "");
		    	score = parseFloat(score.replace("-", "."));

		    	return callback(null, {
		    		score: score,
					reviews: reviews,
					url: urlUS
				});
		    });
	    }
	}, function(err, results) {
		console.log(results)
		MongoClient.connect(url, function(err, db) {
			if (err) {return console.log(err)}
			var collection = db.collection('amazon');

			collection.drop(function() {
				results.dateTime = new Date();
				collection.insertOne(results, function(err, result) {
				    assert.equal(err, null);
				    // callback(result);
				    assert.equal(1, result.result.n);
				    // console.log("Updated the document", newDoc);
				    // callback(result);
				}); 
			});
		});
	});
}
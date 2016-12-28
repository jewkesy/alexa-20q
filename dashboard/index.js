"use strict";
var console = require('tracer').colorConsole();
var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');


// Connection URL
var url = process.argv[2];

// Use connect method to connect to the server
MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  console.log("Connected successfully to server");

	findDocuments(db, function(docs) {
		getUniqueUsers(docs);
		getWinStats(docs);
		getLoseStats(docs);
		getTopTenWords(docs)
		db.close();
	});
});

var findDocuments = function(db, callback) {
  // Get the documents collection
  var collection = db.collection('stats');
  // Find some documents
  collection.find({}).toArray(function(err, docs) {
    assert.equal(err, null);
    console.log("No. records:", docs.length);
    // console.log(docs)
    callback(docs);
  });
}

function getUniqueUsers(docs) {
	console.log(docs.length)
}

function getWinStats(docs) {
	console.log(docs.length)
}

function getLoseStats(docs) {
	console.log(docs.length)
}

function getTopTenWords(docs) {
	console.log(docs.length)
}
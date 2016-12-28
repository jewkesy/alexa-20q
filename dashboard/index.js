"use strict";
var console = require('tracer').colorConsole();
var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');


// Connection URL
var url = process.argv[2];
var dbCollection = process.argv[3];

// Use connect method to connect to the server
MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  console.log("Connected successfully to server");

	findDocuments(db, function(docs) {
		// console.log(docs[0]);
		getStats(docs);

		db.close();
	});
});

var findDocuments = function(db, callback) {
  // Get the documents collection
  var collection = db.collection(dbCollection);
  // Find some documents
  collection.find({}).limit(0).toArray(function(err, docs) {
    assert.equal(err, null);
    // console.log(docs)
    callback(docs);
  });
}

function getStats(docs) {

	var users = [];
	var words = [];
	var quickest = 30;
	var win = 0;
	var lose = 0;
	var end = 0;

	for (var i = 0; i < docs.length; i++) {
		upsertArray(docs[i].userId, users);
		upsertArray(docs[i].word, words);
		if (docs[i].num < quickest) quickest = docs[i].num;
		if (docs[i].num == 30) end++;
		if (docs[i].win) win++; else lose++;
	}
	users.sort(sortByCount);
	var topUsers = users.slice(0, 10);
	console.log(topUsers);

	words.sort(sortByCount);	
	var topWords = words.slice(0, 10);

	console.log(topWords);

	console.log("Fastest: " + quickest, "Wins: " + win, "Loses: " + lose, "Failed: " + end, "No. records: " + docs.length);
}

function sortByCount(a,b) {
  if (a.count < b.count)
    return 1;
  if (a.count > b.count)
    return -1;
  return 0;
}

function upsertArray(key, array) {
  var position = keyExists(key, array) 
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
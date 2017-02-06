"use strict";
var console = require('tracer').colorConsole();
var MongoClient = require('mongodb').MongoClient, assert = require('assert');
var async = require('async');

// Connection URL
// var url = process.argv[2];  // process.env.mongoURI;
// var QCollection = process.argv[3];      // "stats";
// var StatsCollection = process.argv[4];  // "summary";


var dbs = {
  0: 35069,
  1: 35089,
  2: 35069,
  3: 35029,
  4: 35049,
  5: 35029,
  6: 35069,
  7: 35069,
  8: 35069,
  9: 35069,
  a: 35089,
  b: 35049,
  c: 35039,
  d: 35039,
  e: 35049,
  f: 35029,
  g: 35089,
  h: 35089,
  i: 35039,
  j: 35089,
  k: 35029,
  l: 35089,
  m: 35029,
  n: 35039,
  o: 35089,
  p: 35049,
  q: 35089,
  r: 35049,
  s: 35039,
  t: 35049,
  u: 35039,
  v: 35089,
  w: 35029,
  x: 45009,
  y: 35069,
  z: 35029
}



exports.handler = function (event, context) {
  init();
};

init();

function init() {

  var urls = buildUrls();

  async.forEachOf(urls, function (value, key, callback) {

    console.log(value, key)

    MongoClient.connect(value, function(err, db) {

      if (err) {console.log(db);  return callback(err)}

      console.log("Connected successfully to server", db.databaseName);

      indexCollection({timestamp: 1}, "stats", db, function () {
        indexCollection({userId: 1}, "stats", db, function () {
          return callback();
        });
      });

      

    });
  }, function (err) {
    if (err) console.error(err.message);
    // configs is now a map of JSON data
    // doSomethingWith(configs);
  });



  // return console.log(urls);

}

function buildUrls() {
  var urls = []
  var user = process.argv[2];
  var pwd = process.argv[3]

  for (var j in dbs) {
      // console.log(j);
      var idx = dbs[j];

      urls.push("mongodb://" + user +  ":" + pwd + "@ds1" + idx + ".mlab.com:" + idx + "/twentyquestions_" + j  )
  }

  return urls
}

var findDocuments = function(db, coll, filter, proj, sort, callback) {
  // Get the documents collection
  var collection = db.collection(coll);
  // Find some documents
  collection.find(filter, proj, sort).limit(0).toArray(function(err, docs) {
    assert.equal(err, null);
    // console.log(docs)
    callback(docs);
  });
};

var updateDocument = function(coll, db, newDoc, callback) {
  // Get the documents collection
  var collection = db.collection(coll);
  // Update document where a is 2, set b equal to 1

  collection.update({ gameCollection : 'stats' }, newDoc, {upsert: true, multi: false} , function(err, result) {
    assert.equal(err, null);
    assert.equal(1, result.result.n);
    // console.log("Updated the document", newDoc);
    callback(result);
  });
};

var indexCollection = function(field, coll, db, callback) {
  db.collection(coll).createIndex(
    field,
      null,
      function(err, results) {
        console.log(results);
        callback();
    }
  );
};

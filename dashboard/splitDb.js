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
  c: 35059,
  d: 35039,
  e: 35049,
  f: 35029,
  g: 35089,
  h: 35089,
  i: 35039,
  j: 35059,
  k: 35029,
  l: 35089,
  // m: ,
  // n: ,
  // o: ,
  // p: ,
  // q: ,
  // r: ,
  // s: ,
  // t: ,
  // u: ,
  // v: ,
  // w: ,
  // x: ,
  // y: ,
  // z:
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

      if (err) {console.log(value);  return callback(err)}

      console.log("Connected successfully to server");
      return callback();

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

var updateDocument = function(db, newDoc, callback) {
  // Get the documents collection
  var collection = db.collection(StatsCollection);
  // Update document where a is 2, set b equal to 1

  collection.update({ gameCollection : 'stats' }, newDoc, {upsert: true, multi: false} , function(err, result) {
    assert.equal(err, null);
    assert.equal(1, result.result.n);
    // console.log("Updated the document", newDoc);
    callback(result);
  });
};

var indexCollection = function(db, callback) {
  db.collection(QCollection).createIndex(
    { "timestamp": 1 },
      null,
      function(err, results) {
        console.log(results);
        callback();
    }
  );
};

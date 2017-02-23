"use strict";
var console = require('tracer').colorConsole();
var MongoClient = require('mongodb').MongoClient, assert = require('assert');
var async = require('async');

var QCollection = "stats";
var StatsCollection = "summary";
var USER = process.argv[2];
var PWD = process.argv[3];
var MONGODB_URI = process.argv[4];
var MONGOAPIKEY = process.argv[5];
// var USER = process.env.mongoUser;
// var PWD = process.env.mongoPwd;
// var MONGODB_URI = process.env.mongoURI;
// var MONGOAPIKEY = process.env.mongoAPIKey;

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
};

exports.handler = function (event, context) {
  buildStats(function (err, result) {
    // console.log(err, result);
  });
};

buildStats(function (err, result) {
  console.log(err, result);
});

function buildStats(callback) {
  console.log('Starting', new Date());
  var urls = buildUrls();
  urls.push(MONGODB_URI);
  // console.log(urls)

  var combStats = {};

  async.forEachOf(urls, function (value, key, cb) {

    MongoClient.connect(value, function(err, db) {

      if (err) {console.log(err, value);  return callback(err)}

      var proj = {_id:0,userId:0,datetime:0,word:0,num:0,win:0,type:0};
      var filter = {};
      var sort = {};

      findDocuments(db, 'stats', filter, proj, sort, 10, function(docs) {
        // db.close();
        if (err) {
          console.log('mongodb find err', err);
          return cb(err);
        }
        combStats[db.databaseName] = docs;
        return cb(null);
      });

    });
  }, function (err) {
    if (err) return callback(err);

    // return callback(null, 'early exit');

    var newStats = mergeStats(combStats);


    buildDays(newStats);



    return callback(null, 'early exit');
    // console.log(newStats)
    // console.log('updating combined db')
    MongoClient.connect(MONGODB_URI, function(err, db) {

      if (err) {console.log(err);  return callback(err)}

      updateDocument('times', 'times', db, newStats, function (result) {
        if (err) {console.log(err);  return callback(err)}
         console.log('updated combined db')
        // console.log(result)
        return callback(null, result.result);
      });

    });

  });
}

function buildDays(timestamps) {
  // for each timestamp upsert a counter per day

  var days = []
  var hours = []

  for (var i = 0; i < timestamps.length; i++) {
    var d = new Date(timestamps[i]);

    // get hour of day
    var hr = d.getHour();
    upsertArray(hr, hours, 1);

    // get hits per day since release
    d.setHours(0,0,0,0);
    upsertArray(d, days, 1);

  }

  console.log(days);

}

function mergeStats(arrStats) {
  var fullStats = [];

  Object.keys(arrStats).forEach(function(key) {
    var x = arrStats[key];

    for(var idx in x) {
      fullStats.push(x[idx].timestamp)
    }
  });
  console.log(fullStats.length)
  return fullStats;
}


function buildUrls() {
  var urls = [];

  for (var j in dbs) {
      // console.log(j);
      var idx = dbs[j];

      urls.push("mongodb://" + USER +  ":" + PWD + "@ds1" + idx + ".mlab.com:" + idx + "/twentyquestions_" + j  );
  }

  return urls;
}

var findDocuments = function(db, coll, filter, proj, sort, limit, callback) {
  // Get the documents collection
  var collection = db.collection(coll);
  // Find some documents
  collection.find(filter, proj, sort).limit(limit).toArray(function(err, docs) {
    assert.equal(err, null);
    // console.log(docs)
    callback(docs);
  });
};

var updateDocument = function(coll, gameCol, db, newDoc, callback) {
  // Get the documents collection
  var collection = db.collection(coll);
  // Update document where a is 2, set b equal to 1

  collection.updateOne({ gameCollection : gameCol }, newDoc, {upsert: true, multi: false} , function(err, result) {
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

function getGamesPerHour(startTimeStamp, endTimeStamp, totalGames) {
  var startDate = new Date(startTimeStamp);
  var endDate = new Date(endTimeStamp);

  var hours = Math.abs(startDate - endDate) / 36e5;
  var gPerHr = Math.ceil(totalGames/Math.ceil(hours));
  return gPerHr;
}

function sortByCount(a,b) {
  if (a.count < b.count)
    return 1;
  if (a.count > b.count)
    return -1;
  return 0;
}

function upsertArray(key, array, val) {
  var position = keyExists(key, array);
  if (position > -1) {
    array[position].count = array[position].count + val;
  } else {
    array.push({key: key, count: val});
  }
}

function keyExists(name, arr) {
  for(var i = 0, len = arr.length; i < len; i++) {
    if( arr[ i ].key === name ) return i;
  }
  return -1;
}

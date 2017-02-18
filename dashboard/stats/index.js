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

      findDocuments(db, 'summary', {}, {}, {}, function(docs) {
        // db.close();
        if (err) {
          console.log('mongodb find err', err);
          return cb(err);
        }
        // console.log(db.databaseName, docs.length)
        if (docs.length > 0) combStats[db.databaseName] = docs[0];
        if (db.databaseName == 'twentyquestions') {
          combStats[db.databaseName+'_combined'] = docs[1];
          return cb(null);
        }

        var filter = {};

        var users = [];
        var words = [];
        var cats = [];

        var totalUsers = 0;
        var quickest = 30;
        var quickestObj = "";
        var win = 0;
        var lose = 0;
        var end = 0;
        var totalGames = 0;
        var startTimeStamp = 0;

        if (docs.length > 0) {
          if (typeof docs[0].last_id == 'undefined') filter = {};
          else filter = {_id: {$gt: docs[0].last_id}};

          users = [];
          words = docs[0].topWords;
          cats = docs[0].categories;
          quickest = docs[0].quickest;
          quickestObj = docs[0].quickestObj;
          win = docs[0].wins;
          lose = docs[0].loses;
          end = docs[0].failed;
          totalGames = docs[0].totalGames;
          startTimeStamp = docs[0].startTimeStamp;
        }

        findDocuments(db, 'stats', filter, {datetime: 0}, {}, function(docs) {
          if (docs.length === 0) {
            // combStats[db.databaseName] = summary;
            // console.log(db.databaseName, "no docs, returning");
            db.close();
            return cb(null);
          }
          if (startTimeStamp === 0) startTimeStamp = docs[0].timestamp;
          // console.log(docs.length, db.databaseName);

          //  users, words, cats, quickest, quickestObj, win, lose, end)
          var summary = processResults(docs, users, totalUsers, words, cats, quickest, quickestObj, win, lose, end, totalGames, startTimeStamp);
          // update the pointer with latest stats
          combStats[db.databaseName] = summary;
          // return cb(null);
          // console.log('updating', db.databaseName);
          updateDocument('summary', 'stats', db, summary, function (result) {
            console.log('updated', db.databaseName);
            db.close();
            return cb(null);
          });
        });
      });

    });
  }, function (err) {
    if (err) return callback(err);
    // return callback(null, 'early exit');
    var newStats = mergeStats(combStats);
    // return callback(null, 'early exit');
    // console.log(newStats)
    // console.log('updating combined db')
    MongoClient.connect(MONGODB_URI, function(err, db) {

      if (err) {console.log(err);  return callback(err)}

      updateDocument('summary', 'combined_stats', db, newStats, function (result) {
        if (err) {console.log(err);  return callback(err)}
         console.log('updated combined db')
        // console.log(result)
        return callback(null, result.result);
      });

    });

  });
}

function mergeStats(arrStats) {
  // now we have all the stats, merge to master

  var fullStats = JSON.parse(JSON.stringify(arrStats.twentyquestions));
  delete fullStats._id
  // // fullStats._id = arrStats.twentyquestions_combined._id;
  fullStats.gameCollection = 'combined_stats';

  console.log(fullStats.wins, fullStats.loses, fullStats.failed, fullStats.totalGames);

  Object.keys(arrStats).forEach(function(key) {
    // console.log(key)
    if (key == 'twentyquestions' || key == 'twentyquestions_combined') return;

    var x = arrStats[key];

    // topWords
    fullStats.topWords = mergeObjArrs(fullStats.topWords, x.topWords);
    // categories
    fullStats.categories = mergeObjArrs(fullStats.categories, x.categories);
    // quickest
    // quickestObj
    // currHour
    // wins
    fullStats.wins += x.wins;
    // loses
    fullStats.loses += x.loses;
    // failed
    fullStats.failed += x.failed;
    // totalGames
    fullStats.totalGames += x.totalGames;
    // lastGame
    if (fullStats.lastGame.timestamp < x.lastGame.timestamp) {
      fullStats.lastGame = x.lastGame;
    }
  });

  fullStats.categories.sort(sortByCount);
  fullStats.topWords.sort(sortByCount);
  fullStats.topWords = fullStats.topWords.slice(0, 10);

  // avgGameHr
  fullStats.avgGameHr = getGamesPerHour(fullStats.startTimeStamp, new Date(), fullStats.totalGames);
  fullStats.dateTime = new Date();
  console.log(fullStats.wins, fullStats.loses, fullStats.failed, fullStats.totalGames);
  return fullStats;
}

function mergeObjArrs(master, child) {
  // for each child obj, push to master
  for(var i = 0, len = child.length; i < len; i++) {
    upsertArray(child[ i ].key, master, child[ i ].count);
  }
  return master;
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

function processResults(docs, users, totalUsers, words, cats, quickest, quickestObj, win, lose, end, totalGames, startTimeStamp) {

  var currHour = 0;
  var nowDate = +new Date();
  var ONE_HOUR = 60 * 60 * 1000;

  var types = ["Animal", "Vegetable", "Mineral", "Other", "Unknown"]

  var gPerHr = getGamesPerHour(startTimeStamp, docs[docs.length-1].timestamp, docs.length+totalGames);
  // console.log(startDate, endDate, Math.ceil(hours), gPerHr);

  for (var i = 0; i < docs.length; i++) {
    upsertArray(docs[i].userId, users, 1);
    upsertArray(docs[i].word, words, 1);

    if (types.indexOf(docs[i].type) > -1) upsertArray(docs[i].type, cats, 1);

    if ((nowDate - docs[i].timestamp) < ONE_HOUR) currHour++;

    if (docs[i].num < quickest) {
      quickest = docs[i].num;
      quickestObj = docs[i].word;
    }
    if (docs[i].num == 30) {
      if (docs[i].win) {
        // console.log('check me')
        lose++;
      } else {
        // console.log('check me too')
        end++;
      }
    }
    if (docs[i].win) win++; else lose++;
  }

  words.sort(sortByCount);
  // var topWords = words.slice(0, 10);
  var topWords = words;
  cats.sort(sortByCount);

  return {
    dateTime: new Date(),
    gameCollection: 'stats',
    totalUsers: "tba",
    topWords: topWords,
    categories: cats,
    quickest: quickest,
    quickestObj: quickestObj,
    wins: win,
    loses: lose,
    failed: end,
    totalGames: totalGames + docs.length,
    avgGameHr: gPerHr,
    currHour: currHour,
    last_id: docs[docs.length-1]._id,
    startTime: "Tue Dec 27 2016 22:38:20 GMT+0000 (UTC)", // docs[0].datetime,
    startTimeStamp: 1482878300965,
    lastGame: docs[docs.length-1]
  };
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

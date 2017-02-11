"use strict";
var console = require('tracer').colorConsole();
var MongoClient = require('mongodb').MongoClient, assert = require('assert');
var async = require('async');
var request = require('request');
// Connection URL
// var url = process.argv[2];  // process.env.mongoURI;
// var QCollection = process.argv[3];      // "stats";
// var StatsCollection = process.argv[4];  // "summary";
var SAVE_TO_DB = true;
var USER = process.argv[2];
var PWD = process.argv[3];
var MONGODB_URI = process.argv[4];
var MONGOAPIKEY = process.argv[5];

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
// DEV ID
var amz = "amzn1.ask.account.AEBLVM4M4OQFMXUQIDFHHO6SVQMU6UH5CCQVAJ7TDXQHFFVNQ37TDOQCPTDZU2A22DZ6TAP5TTRP4QGFHRNSIIIKP6ILSR26GGR2O5DQHF3APX3A4RJHLKJ5A4G2L3F3FEQLNJ6LAQAJTSXB2ANRN25M3RU755Q4HBVNGRQLY3QH4OPMJXASHECDYUJ47GXGW57TKG6ESJUFMDY";

exports.handler = function (event, context) {
  //rebuildIndexes();
};

buildStats(function (err, result) {
  console.log(err, result);
});

// writeToMongoUsingHttp(amz, 'test', 99, 'splitDb.js', false, function (err, result) {
//   if (err) return console.log(err);
//   return console.log(result.stats);
// });

function buildStats(callback) {
  var urls = buildUrls();
  urls.push(MONGODB_URI)
  console.log(urls)

  var combStats = {};

  async.forEachOf(urls, function (value, key, cb) {

    console.log(value, key)

    MongoClient.connect(value, function(err, db) {

      if (err) {console.log(db);  return callback(err)}

      console.log("Connected successfully to server", db.databaseName);
      var coll = 'summary';
      if (db.databaseName == 'twentyquestions') coll = 'summary';

      findDocuments(db, 'summary', {}, {}, {}, function(docs) {
        // db.close();
        if (err) {
          console.log('mongodb find err', err);
          return cb(err);
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

        // console.log(docs[0]);
        users = [];
        // totalUsers = docs[0].totalUsers;
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
        if (docs.length == 0) { console.log(db.databaseName, "no docs, returning"); db.close(); return cb(null);}
        if (startTimeStamp == 0) startTimeStamp = docs[0].timestamp;
        // console.log(docs.length, docs[0]);
        // getStats(docs);
        //  users, words, cats, quickest, quickestObj, win, lose, end)
        var summary = processResults(docs, users, totalUsers, words, cats, quickest, quickestObj, win, lose, end, totalGames, startTimeStamp);

        console.log(summary);

        return cb()

        updateDocument('summary', db, summary, function (result) {
          // console.log(result);
          db.close();
          return cb(null);
        });
      });

        // // console.log(docs, db.databaseName)
        // if (db.databaseName == 'twentyquestions') {
        //   combStats[db.databaseName] = docs[0];
        // } else {
        //   combStats[db.databaseName] = docs.length;
        // }

        // return cb(null);
      });

    });
  }, function (err) {
    if (err) return callback(err);

    console.log(combStats)

    // configs is now a map of JSON data
    // doSomethingWith(configs);

    return callback(null, combStats)

  });
}

function processResults(docs, users, totalUsers, words, cats, quickest, quickestObj, win, lose, end, totalGames, startTimeStamp) {
  // console.log(docs.length, users.length, totalUsers, words.length, cats.length, quickest, quickestObj, win, lose, end, totalGames, startTimeStamp);
  // var users = [];
  // var words = [];
  // var cats = [];

  // var quickest = 30;
  // var quickestObj = "";
  // var win = 0;
  // var lose = 0;
  // var end = 0;
  var currHour = 0;

  var nowDate = +new Date;
  var ONE_HOUR = 60 * 60 * 1000;

  var startDate = new Date(startTimeStamp);
  var endDate = new Date(docs[docs.length-1].timestamp);

  var hours = Math.abs(startDate - endDate) / 36e5;
  var gPerHr = Math.ceil((docs.length+totalGames)/Math.ceil(hours));
  // console.log(startDate, endDate, Math.ceil(hours), gPerHr);

  for (var i = 0; i < docs.length; i++) {
    upsertArray(docs[i].userId, users);
    upsertArray(docs[i].word, words);
    upsertArray(docs[i].type, cats)

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

  // users.sort(sortByCount);
  // var topUsers = users.slice(0, 10);
  // console.log(users.length, topUsers);

  words.sort(sortByCount);  
  var topWords = words.slice(0, 10);

  cats.sort(sortByCount);

  // console.log(topWords);
  // var returningUserCount = 0;
  // for (var i = 0; i < users.length; i++) {
  //   if (users[i].count == 2) {
  //     returningUserCount = i+1;
  //     break;
  //   }
  // }

  // for (var i = 0; i < topUsers.length; i++) {
  //   topUsers[i].key = i+1;
  // }

  return {
    dateTime: new Date(),
    gameCollection: 'stats',
    // returningUserCount: returningUserCount,
    // topUsers: topUsers,
    // totalUsers: totalUsers + users.length,
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
  }
}

function rebuildIndexes() {

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

function getMongoURIForUser(userId) {
    var char = userId.substr(userId.length - 3);
    char = char.substr(0,1).toLowerCase();
    var idx = dbs[char];
    var retVal = "mongodb://" + USER +  ":" + PWD + "@ds1" + idx + ".mlab.com:" + idx + "/twentyquestions_" + char;
    // console.log(retVal);
    return retVal;
}

function getMongoURLForUser(userId) {
    var char = userId.substr(userId.length - 3);
    char = char.substr(0,1).toLowerCase();
    var idx = dbs[char];
    var retVal = "https://api.mlab.com/api/1/databases/twentyquestions_" + char + "/collections/stats?apiKey=" + MONGOAPIKEY;
    return retVal;
}

function writeToMongoUsingHttp(userId, word, num, type, win, callback) {
  if (SAVE_TO_DB == 'false') return callback(null, {});

    async.parallel({
      save: function(cb) {

          var url = getMongoURLForUser(userId);

          var json = {
              'userId': userId,
              'word': word,
              'num': num,
              'win': win,
              'type': type,
              'timestamp': +new Date,
              'datetime': new Date().toLocaleString()};

          request.post({
            headers: {'content-type' : 'application/json'},
            url:     url,
            body:    JSON.stringify(json)
          }, function(err, response, body){
            // console.log('done 1')
            return cb(err, url)
          });

      },
      stats: function(cb) {

        request.get({
            headers: {'content-type' : 'application/json'},
            url:     "https://api.mongolab.com/api/1/databases/twentyquestions/collections/summary?apiKey=" + MONGOAPIKEY
          }, function(err, response, body){
            // console.log('done 2')
            return cb(err, JSON.parse(body))
          });
      }
  }, function(err, results) {
    return callback(err, results.stats[0]);
  });
}

function writeToMongoUsingClient(userId, word, num, type, win, callback) {
  if (SAVE_TO_DB == 'false') return callback(null, {});

  async.parallel({
      save: function(cb) {
          MongoClient.connect(getMongoURIForUser(userId), function(err, db) {
            if (err) {
              console.log('mongodb conn err save', err);
              return cb(err);
            }
            var collection = db.collection('stats');
            collection.insertOne({
              'userId': userId,
              'word': word,
              'num': num,
              'win': win,
              'type': type,
              'timestamp': +new Date,
              'datetime': new Date().toLocaleString()}, function(err, result) {
                db.close();
                if (err) {
                    console.log('mongodb save err', err);
                    return cb(err);
                }
                return cb(null, result);
            });
          });
      },
      stats: function(cb) {
        MongoClient.connect(MONGODB_URI, function(err, db) {
          if (err) {
              console.log('mongodb conn err stats', err);
              return cb(err);
          }
          var summary = db.collection('summary');
          summary.findOne({}, function (err, item) {
            db.close();
            if (err) {
              console.log('mongodb find err', err);
              return cb(err);
            }

            return cb(null, item);
          });
        });
      }
  }, function(err, results) {
    return callback(err, results.stats);
  });
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



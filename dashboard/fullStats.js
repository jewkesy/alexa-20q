"use strict";
var console = require('tracer').colorConsole();
var MongoClient = require('mongodb').MongoClient, assert = require('assert');

// Connection URL
var url = process.argv[2];  // process.env.mongoURI;
var QCollection = process.argv[3];      // "stats";
var StatsCollection = process.argv[4];  // "summary";


exports.handler = function (event, context) {
  init();
};

init();

function init() {
    // Use connect method to connect to the server
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    console.log("Connected successfully to server");

    findDocuments(db, StatsCollection, {}, {}, {}, function(docs) {
      // var currSummary;
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


      findDocuments(db, QCollection, filter, {datetime: 0}, {}, function(docs) {
        if (docs.length == 0) { console.log("no docs, returning"); db.close(); return;}

        // console.log(docs.length, docs[0]);
        // getStats(docs);
        //  users, words, cats, quickest, quickestObj, win, lose, end)
        var summary = processResults(docs, users, totalUsers, words, cats, quickest, quickestObj, win, lose, end, totalGames, startTimeStamp);

        console.log(summary);

        // console.log("merge this: ", currSummary, "to this: ", summary);
        // var newSum = mergeSummaries(currSummary, summary);
        db.close();
      });
    });
  });
}

// function mergeSummaries(currSum, newSum) {
//   return newSum;
// }

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

  users.sort(sortByCount);
  var topUsers = users.slice(0, 10);
  // console.log(users.length, topUsers);

  words.sort(sortByCount);  
  var topWords = words.slice(0, 10);

  cats.sort(sortByCount);

  // console.log(topWords);
  var returningUserCount = 0;
  // console.log(users[0])
  for (var i = 0; i < users.length; i++) {
    if (users[i].count > 1) {
      returningUserCount = i+1;
      // break;
    }
  }

  for (var i = 0; i < topUsers.length; i++) {
    topUsers[i].key = i+1;
  }

  return {
    dateTime: new Date(),
    gameCollection: 'stats',
    returningUserCount: returningUserCount,
    topUsers: topUsers,
    totalUsers: users.length,
    // totalUsers: "tba",
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
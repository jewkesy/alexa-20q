"use strict";

var assert = require('chai').assert;
var helpers = require('./../src/helpers.js');
var console = require('tracer').colorConsole();

// getStartGamePhrase: function (player) {}
// getFarewellPhrase: function () {}
// getWinPhrase: function () {}
// getLostPhrase: function () {}
// buildNaturalLangList: function (items, finalWord) {}
// handleSpeechQuerks: function (speech) {}
// getQuestionNo: function (text) {}
// getGuessText: function (guessText) {}
// getRandomFact: function (summary) {}
// randomInt: function (low, high) {}

const questions = [
    "Question 1.  Animal, Vegetable, Mineral, Other, or Unknown?",
    "Question 2.  Is it small?",
    "Question 3.  Does it growl?",
    "Question 4.  Does it have four legs?",
    "Question 5.  Is it round?",
    "Question 6.  Does it growl?",
    "Question 7.  Is it white?",
    "Question 8.  Is it very large?",
    "Question 9.  Can it be used in a pie?",
    "Question 10.  Can you lift it?",
    "Question 11.  Can it help you find your way?",
    "Question 12.  Does it have fangs?",
    "Question 13.  Does it cry?",
    "Question 14.  Can it growl?",
    "Question 15.  Does it have short fur?",
    "Question 16.  Does it have a long tail?",
    "Question 17.  Can it jump? ?",
    "Question 18.  Is it originally from Africa?",
    "Question 19.  Does it like to play?",
    "Question 20.  I am guessing that it is a panther?"
];

const summary = {
 totalUsers: 'tba',
  topWords:
   [ { key: 'a carrot', count: 602 },
     { key: 'an elephant', count: 524 },
     { key: 'a giraffe', count: 430 },
     { key: 'a lion', count: 279 },
     { key: 'a zebra', count: 210 },
     { key: 'a domestic cat', count: 198 },
     { key: 'a mobile phone', count: 187 },
     { key: 'a television set', count: 176 },
     { key: 'a tiger', count: 171 },
     { key: 'a cell-phone', count: 164 } ],
  categories:
   [ { key: 'Other', count: 13948 },
     { key: 'Animal', count: 13678 },
     { key: 'Vegetable', count: 3678 },
     { key: 'Mineral', count: 2038 },
     { key: 'Unknown', count: 1450 },
     { key: 'No', count: 348 },
     { key: 'Yes', count: 254 },
     { key: 'Sometimes', count: 15 },
     { key: 'Maybe', count: 7 },
     { key: 'Partly', count: 6 },
     { key: 'Depends', count: 3 },
     { key: 'Doubtful', count: 3 },
     { key: 'Usually', count: 1 },
     { key: 'Probably', count: 1 } ],
  quickest: 8,
  quickestObj: 'a giraffe',
  wins: 19338,
  loses: 16095,
  failed: 5990,
  totalGames: 35430,
  avgGameHr: 124
}

var player = [
  { "num":99, "win": false, "type": "splitDb.js", "timestamp": 1486675626844},
  { "num":30, "win": false, "type": "Animal", "timestamp": 1487104127415},
  { "num":17, "win": true, "type": "Animal", "timestamp": 1487514621848},
  { "num":19, "win": true, "type": "Animal", "timestamp": 1487514720865} ]

describe("src/helpers.js", function () {
    describe("get phrases", function () {
        describe("getStartGamePhrase: function (player) {}", function () {
            it("gets a start phrase for new player", function () {
                var retVal = helpers.getStartGamePhrase([]);
                assert.notEqual(retVal, "");
            });

            it("Detects when last played was yesterday and you won", function () {

              var today = new Date();
              var yesterday = new Date(today);
              yesterday.setDate(today.getDate() - 1);

              var yesterdayTS = yesterday.getTime();
              var p = JSON.parse(JSON.stringify(player));
              p.push({
                num: 10,
                win: true,
                type: 'Other',
                timestamp: yesterdayTS
              })
                var retVal = helpers.getStartGamePhrase(p);
                assert.notEqual(retVal, "");
            });

            it("Detects when last played was yesterday and you lost", function () {

              var today = new Date();
              var yesterday = new Date(today);
              yesterday.setDate(today.getDate() - 1);

              var yesterdayTS = yesterday.getTime();
              var p = JSON.parse(JSON.stringify(player));
              p.push({
                num: 26,
                win: false,
                type: 'Other',
                timestamp: yesterdayTS
              })
                var retVal = helpers.getStartGamePhrase(p);
                assert.notEqual(retVal, "");
            });




            it("gets a start phrase", function () {
                var retVal = helpers.getStartGamePhrase(player);
                assert.notEqual(retVal, "");
            });
            it("it has a full stop and a space at the end", function () {
                var retVal = helpers.getStartGamePhrase(player).slice(-2);
                assert.equal(retVal, ". ");
            });
        });

        describe("getFarewellPhrase: function () {}", function () {
            it("gets a farewell phrase", function () {
                var retVal = helpers.getFarewellPhrase();
                assert.notEqual(retVal, "");
            });
            it("it has a full stop and a space at the end", function () {
                var retVal = helpers.getFarewellPhrase().slice(-2);
                assert.equal(retVal, ". ");
            });
        });

        describe("getWinPhrase: function () {}", function () {
            it("gets a win phrase", function () {
                var retVal = helpers.getWinPhrase();
                assert.notEqual(retVal, "");
            });
            it("it has a full stop and a space at the end", function () {
                var retVal = helpers.getWinPhrase().slice(-2);
                assert.equal(retVal, ". ");
            });
        });

        describe("getLostPhrase: function () {}", function () {
            it("gets a lose phrase", function () {
                var retVal = helpers.getLostPhrase();
                assert.notEqual(retVal, "");
            });
            it("it has a full stop and a space at the end", function () {
                var retVal = helpers.getLostPhrase().slice(-2);
                assert.equal(retVal, ". ");
            });
        });
    });

    describe("buildNaturalLangList: function (items, finalWord) {}", function () {
        it("that 'or' precedes the penultimate word", function () {});
        it("that words are comma separated, apart from the last word", function () {});
    });

    describe("handleSpeechQuerks: function (speech) {}", function () {
        it("removes the question mark for known speech querks", function () {
            var input = "Does it growl?";
            var expected = "Does it growl";
            var retVal = helpers.handleSpeechQuerks(input);
            assert.equal(retVal, expected);
        });
        it("leaves the question mark for unknown speech querks", function () {
            var input = "Is Alexa awesome?";
            var expected = "Is Alexa awesome?";
            var retVal = helpers.handleSpeechQuerks(input);
            assert.equal(retVal, input);
        });
    });

    xdescribe("getQuestionNo: function (text) {}", function () {
        it("", function () {});
    });

    describe("getGuessText: function (guessText) {}", function () {
        it("returns the guess object if making a guess", function () {});
        it("returns empty if not making a guess", function () {});
    });

    describe("getRandomFact: function (summary) {}", function () {
        it("returns a random fact", function () {
            var retVal = helpers.getRandomFact(summary);
            assert.isAtLeast(retVal.length, 10);
        });
    });

    xdescribe("randomInt: function (low, high) {}", function () {
        it("", function () {});
    });
});

// function getGuessText(guessText) {
//     // Question 17.  I am guessing that it is a panther?
//     // Question 17.  I am guessing that it is marble (the rock)
//     // Question 17.  I am guessing that it is an ant eater?
//     // Question 30.  I am guessing that it is an armadillo?
//     // console.log(guessText);
//     var retVal = guessText.split("I am guessing that it is ")[1];
//     // console.log(retVal);
//     // console.log(retVal.slice(-1));
//     if (retVal.slice(-1) == '?') retVal = retVal.substring(0, retVal.length - 1);
//     // console.log(retVal);
//     return retVal;
// }

// function getQuestionNo(text) {
//     // console.log(text)
//     //Question 17. Does it have a long tail?
//     //Question 2.  Does it have claws?
//     text = text.replace("Question ", "");
//     var retVal = text.substring(0,  text.indexOf("."));
//     // console.log(retVal)
//     return retVal;
// }

// console.log(getGuessText("Question 1.  I am guessing that it is a panther?"), getQuestionNo("Question 1.  I am guessing that it is a panther?"));
// console.log(getGuessText("Question 17.  I am guessing that it is a panther?"), getQuestionNo("Question 17.  I am guessing that it is a panther?"));
// console.log(getGuessText("Question 17.  I am guessing that it is marble (the rock)"), getQuestionNo("Question 17.  I am guessing that it is marble (the rock)?"));
// console.log(getGuessText("Question 17.  I am guessing that it is an ant eater?"), getQuestionNo("Question 17.  I am guessing that it is an ant eater?"));
// console.log(getGuessText("Question 30.  I am guessing that it is an armadillo?"), getQuestionNo("Question 30.  I am guessing that it is an armadillo?"));
// // console.log(getGuessText(""));

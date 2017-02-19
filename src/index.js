var request = require('request');
var cheerio = require('cheerio');
var console = require('tracer').colorConsole();
var MongoClient = require('mongodb').MongoClient;
var async = require('async');

var ALEXA_APP_ID = process.env.appID;
var MONGODB_URI = process.env.mongoURI;
var USER = process.env.mongoUser;
var PWD = process.env.mongoPwd;
var MONGOAPIKEY = process.env.mongoAPIKey;
var SAVE_TO_DB = process.env.savetoDB;
var TWENTY_QUESTIONS_DATA_URL = process.env.dataURL;
var TWENTY_QUESTIONS_HOME_URL = process.env.webURL;
var TIMEOUT = parseInt(process.env.timeout);
var lang = '/gsq-enUK';  // or '/gsq-en' for US
var regions = 'GB,NL,US';  // or 'US,MX,CA,KH' for US
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
var helpers = require('helpers.js');

exports.handler = function (event, context) {
    try {
        // console.log("event.session.application.applicationId=" + event.session.application.applicationId, "amzn1.echo-sdk-ams.app." + ALEXA_APP_ID);

        // if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app." + ALEXA_APP_ID) {
        //     context.fail("Invalid Application ID");
        // }

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                     event.session,
                     function callback(sessionAttributes, speechletResponse) {
                        context.succeed(buildResponse(sessionAttributes, speechletResponse));
                     });
        }  else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                     event.session,
                     function callback(sessionAttributes, speechletResponse) {
                         context.succeed(buildResponse(sessionAttributes, speechletResponse));
                     });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);

            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    // console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId + ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the app without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    // console.log("onLaunch requestId=" + launchRequest.requestId + ", sessionId=" + session.sessionId);
    startGame(session.user.userId, callback);
}

/**
 * Called when the user specifies an intent for this application.
 */
function onIntent(intentRequest, session, callback) {
    // console.log("onIntent requestId=" + intentRequest.requestId +
    //             ", sessionId=" + session.sessionId +
    //             ", intentName=" + intentRequest.intent.name);

    // console.log('onIntent', intentRequest)

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    var sessionAttributes = session.attributes;

    if(typeof sessionAttributes !== 'undefined') {

        if(sessionAttributes.questionType == 'first') {

            switch(intentName) {
                case "StopIntent":
                case "CancelIntent":
                    return stop(intentName, session, callback);
                case "HelpIntent":
                    return processGameHelp(true, session, callback);
                case "AnimalIntent":
                    return processAnswer('Animal', session, callback);
                case "VegetableIntent":
                    return processAnswer('Vegetable', session, callback);
                case "MineralIntent":
                    return processAnswer('Mineral', session, callback);
                case "OtherIntent":
                    return processAnswer('Other', session, callback);
                case "UnknownIntent":
                    return processAnswer('Unknown', session, callback);
                case "RepeatIntent":
                    return repeatQuestion(intentName, session, callback);
                default:
                    return invalidAnswer(intentName, session, callback);
            }

        } else if (sessionAttributes.questionType == 'question') {

            switch(intentName) {
                case "StopIntent":
                case "CancelIntent":
                    return stop(intentName, session, callback);
                case "HelpIntent":
                    return processGameHelp(false, session, callback);
                case "YesIntent":
                    return processAnswer('Yes', session, callback);
                case "NoIntent":
                    return processAnswer('No', session, callback);
                case "UnknownIntent":
                    return processAnswer('Unknown', session, callback);
                case "IrrelevantIntent":
                    return processAnswer('Irrelevant', session, callback);
                case "SometimesIntent":
                    return processAnswer('Sometimes', session, callback);
                case "MaybeIntent":
                    return processAnswer('Maybe', session, callback);
                case "ProbablyIntent":
                    return processAnswer('Probably', session, callback);
                case "DoubtfulIntent":
                    return processAnswer('Doubtful', session, callback);
                case "UsuallyIntent":
                    return processAnswer('Usually', session, callback);
                case "DependsIntent":
                    return processAnswer('Depends', session, callback);
                case "RarelyIntent":
                    return processAnswer('Rarely', session, callback);
                case "PartlyIntent":
                    return processAnswer('Partly', session, callback);
                case "RightIntent":
                    return processAnswer('Right', session, callback);
                case "WrongIntent":
                    return processAnswer('Wrong', session, callback);
                case "NearlyIntent":
                    return processAnswer('Nearly', session, callback);
                case "RepeatIntent":
                    return repeatQuestion(intentName, session, callback);
                default:
                    return invalidAnswer(intentName, session, callback);
            }
        }

    } else {
        startGame(session.user.userId, callback);
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the app returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId + ", sessionId=" + session.sessionId);
}

/**
 * Helpers that build all of the responses.
 */
function buildSpeechletResponse(title, output, repromptText, shouldEndSession, cardText, cardType) {

    if (typeof cardType == 'undefined') cardType = "Simple";  // Standard
    if (typeof cardText == 'undefined') cardText = output;
    output = helpers.handleSpeechQuerks(output);
    return {
        outputSpeech: {
            type: "SSML", //PlainText or SSML
            ssml: "<speak>" + output + "</speak>"  //output
          //  text: output
        },
        card: {
            type: cardType,
            title: "Twenty Questions - " + title,
            content: cardText
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    //console.log('buildReponse', speechletResponse);
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}

function stop(intent, session, callback) {
    var sessionAttributes = session.attributes;
    sessionAttributes.intent = intent;
    callback(sessionAttributes, buildSpeechletResponse("Goodbye", "Thanks for playing", "", true));
}

function repeatQuestion(intent, session, callback) {
    var sessionAttributes = session.attributes;
    callback(sessionAttributes,
        buildSpeechletResponse("Question " + sessionAttributes.questionNum, sessionAttributes.questionText,
            sessionAttributes.questionText + "\nIf you are unsure, you can say 'I don't know.'",  false));
}

function unknownAnswer(session, callback) {
    var sessionAttributes = session.attributes;
    callback(sessionAttributes, buildSpeechletResponse("Invalid Answer", "Sorry, I didn't understand the answer.\nPlease try again or say help.", sessionAttributes.questionText, false));
}

function invalidAnswer(intent, session, callback) {
    // console.log(intent);
    var sessionAttributes = session.attributes;
    sessionAttributes.intent = intent;
    var optionlist = helpers.buildNaturalLangList(Object.keys(sessionAttributes.options), 'or');

    // repeattext = "<p>You can say " + optionlist + "</p>";
    var questiontext = "Sorry, that was not a valid answer.\n";

    if(sessionAttributes.questionNum.toString() == '1') {
        questiontext += "You can say " + optionlist;
    } else {
        questiontext += "Please try again or ask for help.\n" + sessionAttributes.questionText;
    }

    callback(sessionAttributes, buildSpeechletResponse("Invalid Answer", questiontext, sessionAttributes.questionText, false));
}

function processGameHelp(firstQuestion, session, callback) {
    var sessionAttributes = session.attributes;
    sessionAttributes.intent = 'HelpIntent';
    var text = "Think of an object and I will try to guess what it is within twenty questions.\n";

    var opts = helpers.buildNaturalLangList(Object.keys(sessionAttributes.options), 'or');

    if (firstQuestion) {
        text += "Is it an " + opts;
    } else {
        text = "You can say " + opts + '.\n' + sessionAttributes.questionText;
    }

    callback(sessionAttributes, buildSpeechletResponse("Help", text, sessionAttributes.questionText, false));
}

function processAnswer(answer, session, callback) {
    var sessionAttributes = session.attributes;
    sessionAttributes.intent = answer;
    if (sessionAttributes.questionNum == 1) sessionAttributes.type = answer;

    if (sessionAttributes.options[answer] === undefined) {
        return invalidAnswer(answer, session, callback);
    } else {
        var uri = sessionAttributes.options[answer];
        return askNextQuestion(uri, answer, session, callback);
    }
}

function askNextQuestion(uri, answer, session, callback) {
    var sessionAttributes = session.attributes;

    var reqoptions = {
        url: TWENTY_QUESTIONS_DATA_URL + uri,
        timeout: TIMEOUT,
        headers: {
            'Referer': TWENTY_QUESTIONS_DATA_URL + lang
        }
    };

    request(reqoptions, function(err, response, html){
        if (err) {
            console.log("Error requesting " + uri, err);
            return callback(sessionAttributes,
                buildSpeechletResponse("App Error", "There was an error accessing the 20q website. Try repeating your answer.",
                    "There was an error accessing the 20q websites. Try repeating your answer.", false));
        }

        var $;
        try {
            $ = cheerio.load(html);
        } catch (e) {
            console.log("Exception when trying to parse html with Cheerio.", e, html);
            return callback(sessionAttributes,
                buildSpeechletResponse("App Error", "There was an error with the 20q website. Try repeating your question.",
                    "There was an error with the 20q website. Try repeating your question.", false));
        }

        if($('h2').length > 0) {
            // There is only an h2 element on the game over screen.
            sessionAttributes.history += answer;

            sessionAttributes.history += '\nThank you for playing. ' + helpers.getFarewellPhrase() + '\n';

            var ending = "Please check your Alexa App for your game summary.  Goodbye."
            // console.log(sessionAttributes.questionText);
            var guess = helpers.getGuessText(sessionAttributes.questionText);
            if($('h2').first().text() == "20Q won!") {
                console.log('20Q won: ', guess, session.user.userId);
                writeToMongoUsingHttp(session.user.userId, guess, sessionAttributes.questionNum, sessionAttributes.type, true, function(err, results) {
                    // console.log(results);
                    sessionAttributes.history += helpers.getRandomFact(results);
                    return callback(sessionAttributes, buildSpeechletResponse("I won!",  "I win!\n"   + helpers.getWinPhrase() + ending, "", true, sessionAttributes.history));
                 });
            } else {
                console.log('20Q lost: ', guess, session.user.userId);
                writeToMongoUsingHttp(session.user.userId, guess, sessionAttributes.questionNum, sessionAttributes.type, false, function(err, results) {
                    // console.log(results);
                    sessionAttributes.history += helpers.getRandomFact(results);
                    return callback(sessionAttributes, buildSpeechletResponse("I lost!", "You win!\n" + helpers.getLostPhrase() + ending, "", true, sessionAttributes.history));
                });
            }
        } else {
            var optionelements = $('big nobr a');

            sessionAttributes.options = {};

            var rightURI;
            var wrongURI;
            var guess = false;

            for(var i = 0; i < optionelements.length; i++) {
                var optionname = $(optionelements[i]).text().replace(/(&nbsp;)/i,'').trim();
                var optionURI = $(optionelements[i]).attr('href');
                if (optionname == 'Close') {optionname = 'Nearly'; guess = true;}
                else if (optionname == 'Right') {rightURI = optionURI; guess = true;}
                else if (optionname == 'Wrong') {wrongURI = optionURI; guess = true;}
                sessionAttributes.options[optionname] = optionURI;
            }
            if (guess) {
                sessionAttributes.options['Yes'] = rightURI;
                sessionAttributes.options['No'] = wrongURI;
            }
            // console.log(sessionAttributes.options)

            var question = $('big b').text().split(/[\r\n]/)[0].replace(/(&nbsp;)/i,'').trim();

            sessionAttributes.history += answer + "\n" + question + " ";

            question = question.replace('Q', 'Question ');
            sessionAttributes.questionType = 'question';
            sessionAttributes.questionNum = helpers.getQuestionNo(question);
            sessionAttributes.questionText = question;

            callback(sessionAttributes,
                buildSpeechletResponse("Question " + sessionAttributes.questionNum, question,
                    question + "\nIf you are unsure, you can say 'I don't know.'",  false));
        }
    });
}

/**
 * Start a new game
 */

function startGame(userId, callback) {
    var sessionAttributes = {};

    var reqoptions = {
        url: TWENTY_QUESTIONS_DATA_URL + lang,
        timeout: TIMEOUT,
        headers: {
            'Referer': TWENTY_QUESTIONS_HOME_URL + '/play.html'
        }
    };

    async.parallel({
      get20q: function (cb) {
        request(reqoptions, function(err, response, html){
            if(err) {
                var msg =  "There was an error accessing the twenty questions website. ";

                if (err.code === 'ETIMEDOUT') { msg += " Please try again in a few moments. "; }
                console.log(msg, err);
                var retVal = {
                  title: "App Error - " + err,
                  sayText: msg,
                  repromptText: msg,
                  shouldEndSession: true
                }
                return cb(null, retVal);
                // return cb(sessionAttributes, buildSpeechletResponse("App Error - " + err, msg, msg, true));
            }

            var $ = cheerio.load(html);
            var newgameuri = $('form').first().attr('action');

            var reqoptions = {
                url: TWENTY_QUESTIONS_DATA_URL + newgameuri,
                headers: {
                    'Referer': TWENTY_QUESTIONS_DATA_URL + lang   // http://www.20q.net/gsq-enUK   or '/gsq-en' for US
                },
                form: {
                    'age': '',
                    'cctkr': regions,
                    'submit': 'Play'
                }
            };

            request.post(reqoptions, function(err, response, html) {
                var $ = cheerio.load(html);
                var optionelements = $('big nobr a');

                sessionAttributes.options = {};
                for(var i = 0; i < optionelements.length; i++) {
                    var optionname = $(optionelements[i]).text();
                    var optionURI = $(optionelements[i]).attr('href');
                    sessionAttributes.options[optionname] = optionURI;
                }

                var listtext = helpers.buildNaturalLangList(Object.keys(sessionAttributes.options), 'or');

                sessionAttributes.questionType = 'first';
                sessionAttributes.questionNum = 1;
                sessionAttributes.questionText = listtext + "?";
                sessionAttributes.history = "\nQ1.  " + listtext + "? ";

                var retVal = {
                  cardText: '\nQuestion 1. ' + listtext + '?',
                  title: "New Game",
                  sayText: "<p>Question 1. " + listtext + "?</p>",
                  repromptText: listtext + "?",
                  shouldEndSession: false
                }
                return cb(null, retVal);
            });
        });
      },
      getStats: function (cb) {
        var url = getMongoURLForUser(userId) + '&q={"userId":"' + userId + '"}&f={"_id":0,"userId":0,"datetime":0,"word":0}';

        request(url, function(err, response){
      		var playr = JSON.parse(response.body);
          var intro = helpers.getStartGamePhrase(playr);
          var retVal = {
            intro: intro,
            player: playr
          }
          return cb(null, retVal);
        });
      }
    }, function(err, results) {
      console.log(results);
      return callback(sessionAttributes, buildSpeechletResponse(results.get20q.title, results.getStats.intro + results.get20q.sayText, results.get20q.repromptText, results.get20q.shouldEndSession, results.get20q.cardText));
    });
}

function getMongoURIForUser(userId) {
    var char = userId.substr(userId.length - 3);
    char = char.substr(0,1).toLowerCase();
    var idx = dbs[char];
    var retVal = "mongodb://" + USER +  ":" + PWD + "@ds1" + idx + ".mlab.com:" + idx + "/twentyquestions_" + char;
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
        }, function(err, response, body) {
          return cb(err, url)
        });
    },
    stats: function(cb) {
      request.get({
        headers: {'content-type':'application/json'},
        url:     'https://api.mongolab.com/api/1/databases/twentyquestions/collections/summary?q={"gameCollection":"combined_stats"}&apiKey=' + MONGOAPIKEY
      }, function(err, response, body){
        return cb(err, JSON.parse(body))
      });
    }
  }, function(err, results) {
    return callback(err, results.stats[0]);
  });
}

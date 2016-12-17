var request = require('request');
var cheerio = require('cheerio');

var ALEXA_APP_ID = undefined;
var TWENTY_QUESTIONS_DATA_URL = 'http://y.20q.net';
var TWENTY_QUESTIONS_HOME_URL = 'http://www.20q.net';
var lang = '/gsq-enUK';  // or '/gsq-en' for US
var regions = 'GB,NL,US';  // or 'US,MX,CA,KH' for US

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId, "amzn1.echo-sdk-ams.app." + ALEXA_APP_ID);

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
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId + ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the app without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId + ", sessionId=" + session.sessionId);

    startGame(callback);
}

/** 
 * Called when the user specifies an intent for this application.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId +
                ", sessionId=" + session.sessionId +
                ", intentName=" + intentRequest.intent.intentName);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    var sessionAttributes = session.attributes;

    if(typeof sessionAttributes !== 'undefined') {
        // We have a game going

        // questionType can be "first", "question", or "guess"
        if(sessionAttributes.questionType == 'first') {

            switch(intentName) {
                case "AnimalIntent":
                    return processAnswer('Animal', session, callback);
                case "VegetableIntent":
                    return processAnswer('Vegetable', session, callback);
                case "MineralIntent":
                    return processAnswer('Mineral', session, callback);
                case "ConceptIntent":
                    return processAnswer('Concept', session, callback);
                case "UnknownIntent":
                    return processAnswer('Unknown', session, callback);
                default: 
                    return invalidAnswer(session, callback);
            }

        } else if (sessionAttributes.questionType == 'question') {

            switch(intentName) {
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
                case "CloseIntent":
                    return processAnswer('Close', session, callback);
                default: 
                    return invalidAnswer(session, callback);
            }
        }

    } else {
        startGame(callback);
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the app returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId +
                ", sessionId=" + session.sessionId);
}

/**
 * Helpers that build all of the responses.
 */
function buildSpeechletResponse(title, output, repromptText, shouldEndSession, cardText, cardType) {

    if (typeof cardType == 'undefined') cardType = "Simple";  // Standard
    if (typeof cardText == 'undefined') cardText = output;
    return {
        outputSpeech: {
            type: "SSML", //PlainText or SSML
            ssml: "<speak>" + output + "</speak>"  //output
          //  text: output
        },
        card: {
            type: cardType,
            title: "20Q - " + title,
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
    console.log('buildReponse "'+speechletResponse.outputSpeech.text+'"');
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}

function unknownAnswer(session, callback) {
    var sessionAttributes = session.attributes;

    var optionlist = buildNaturalLangList(Object.keys(sessionAttributes.options), 'or');

    var repeattext = "<p>You can say " + optionlist + "</p><p>" + sessionAttributes.questionText + "</p>";
    var questiontext = "<p>Sorry, I didn't understand the answer.</p>" + repeattext;

    callback(sessionAttributes, buildSpeechletResponse("Invalid Answer", questiontext, repeattext, false));
}

function invalidAnswer(session, callback) {
    var sessionAttributes = session.attributes;

    var optionlist = buildNaturalLangList(Object.keys(sessionAttributes.options), 'or');
    var repeattext = "";
    repeattext = "<p>You can say " + optionlist + "</p>";

    if(optionlist[0] == 'Animal' && optionlist[1] == 'Vegetable') {}
    else {repeattext += "<p>" + sessionAttributes.questionText +  "</p>";}

    var questiontext = "<p>Sorry, that was not a valid answer.</p>" + repeattext;

    callback(sessionAttributes, buildSpeechletResponse("Invalid Answer", questiontext, repeattext, false));
}

function processAnswer(answer, session, callback) {
    var sessionAttributes = session.attributes;

    if(sessionAttributes.options[answer] === undefined) {
        return invalidAnswer(session, callback);
    } else {
        var uri = sessionAttributes.options[answer];
        return askNextQuestion(uri, session, callback);
    }
}

function askNextQuestion(uri, session, callback) {
    var sessionAttributes = session.attributes;

    var reqoptions = {
        url: TWENTY_QUESTIONS_DATA_URL + uri,
        headers: {
            'Referer': TWENTY_QUESTIONS_DATA_URL + lang
        }
    };

    request(reqoptions, function(err, response, html){
        if (err) {
            console.log("Error requesting " + uri, err);
            return callback(sessionAttributes,
                buildSpeechletResponse("App Error", "There was an error accessing the twenty questions website. Try repeating your answer.", "There was an error accessing the twenty questions. Try repeating your answer.", false));
        }

        var $;
        try {
            $ = cheerio.load(html);
        } catch (e) {
            console.log("Exception when trying to parse html with Cheerio.", e, html);
            return callback(sessionAttributes,
                buildSpeechletResponse("App Error", "There was an error with the 20q website. Try repeating your question.", "There was an error with the 20q website. Try repeating your question.", false));
        }

        if($('h2').length > 0) {
            // There is only an h2 element on the game over screen.
            if($('h2').first().text() == "20Q won!") {
                return callback(sessionAttributes, buildSpeechletResponse("20Q won!", "Woohoo! I win!", "", true));
            } else {
                return callback(sessionAttributes, buildSpeechletResponse("20Q lost!", "Alright, I give up! You win!", "", true));
            }
        } else {
            var optionelements = $('big nobr a');

            sessionAttributes.options = {};
            for(var i = 0; i < optionelements.length; i++) {
                var optionname = $(optionelements[i]).text().replace(/(&nbsp;)/i,'').trim();
                var optionURI = $(optionelements[i]).attr('href');

                sessionAttributes.options[optionname] = optionURI;
            }

           
            var question = $('big b').text().split(/[\r\n]/)[0].replace(/(&nbsp;)/i,'').trim();
            question = question.replace('Q', 'Question ');
            sessionAttributes.questionType = 'question';
            sessionAttributes.questionNum += 1;
            sessionAttributes.questionText = question;

            var listtext = buildNaturalLangList(Object.keys(sessionAttributes.options), 'or');

            callback(sessionAttributes,
                buildSpeechletResponse("Question " + sessionAttributes.questionNum, question, question + " If you are unsure, you can say 'I don't know.'", false));
        }
    });
}

/** 
 * Start a new game
 */

function startGame(callback) {
    var sessionAttributes = {};

    var reqoptions = {
        url: TWENTY_QUESTIONS_DATA_URL + lang,
        headers: {
            'Referer': TWENTY_QUESTIONS_HOME_URL + '/play.html'
        }
    };
    
    request(reqoptions, function(err, response, html){
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

            var listtext = buildNaturalLangList(Object.keys(sessionAttributes.options), 'or');
            var startgamephrases = [
                'I will read your mind. ',
                'Prepare to be amazed. ',
                'I love this game. ',
                'Lets play. ',
                'Lets go. ',
                'Ok. ',
                'Is it an ',
                '20 Questions? I\'ll only need 10. '
            ];
            var intro = startgamephrases[randomInt(0, startgamephrases.length)];
            var startgametext = "<p>" + intro + "</p>";

            sessionAttributes.questionType = 'first';
            sessionAttributes.questionNum = 1;
            sessionAttributes.questionText = listtext + "?";

            var cardText = 'Q1. ' + listtext + '?';

            callback(sessionAttributes, buildSpeechletResponse("New Game", startgametext + "<p>Question 1. " + listtext + "?</p>", listtext + "?", false, cardText));
        });
    });

}

function buildNaturalLangList(items, finalWord) {
    var output = '';
    for(var i = 0; i<items.length; i++) {
        if(i === 0) {
            output += items[i];
        } else if (i < items.length-1) {
            output += ', ' + items[i];
        } else {
            output += ', ' + finalWord + ' ' + items[i];
        }
    }

    return output;
}

function randomInt(low, high) {
    return Math.floor(Math.random() * high);
}
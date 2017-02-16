"use strict";

var console = require('tracer').colorConsole();

const winPhrases  = ["Yay", "Woo hoo", "Told ya", "That was easy", "Good choice", "Better luck next time", "Must try harder", "Easy peasy", "Too easy", "Ha ha", "Loser", "Tee hee", "Here is a slow clap for your efforts. Clap. Clap", "That was difficult. Not"];
const losePhrases = ["You got me", "Couldn't get that one", "Good choice", "That was tough", "Well done", "You beat me", "That was tricky", "Whatevas", "Fine", "Gutted", "Fair play", "Doh", "Booo", "Nice one", "If I had hands, I'd clap"];
const startGamePhrases = ['I will read your mind', 'Prepare to be amazed', 'I love this game', 'Lets play', 'Lets go', 'Ok', '20 Questions? I\'ll only need 10', 'Lets do this', '20 Questions? My fastest is 8', 'Prepare to lose'];
const farewellPhrases = ["Please visit www.daryljewkes.com to see live game statistics from the Alexa community", "Please visit www.daryljewkes.com to see the top objects guessed correctly from the Alexa community", "Please visit www.daryljewkes.com to see my win vs lose ratio"];

module.exports = {
	getStartGamePhrase: function () {
		return getStartGamePhrase();
	},
	getFarewellPhrase: function () {
		return getFarewellPhrase();
	},
	getWinPhrase: function () {
		return getWinPhrase();
	},
	getLostPhrase: function () {
		return getLostPhrase();
	},
	buildNaturalLangList: function (items, finalWord) {
		return buildNaturalLangList(items, finalWord);
	},
	handleSpeechQuerks: function (speech) {
		return handleSpeechQuerks(speech);
	},
	getQuestionNo: function (text){
		return getQuestionNo(text);
	},
	getGuessText: function (guessText) {
		return getGuessText(guessText);
	},
    getRandomFact: function (summary) {
        return getRandomFact(summary);

    },
	randomInt: function (low, high) {
		return randomInt(low, high);
	}
}

function getStartGamePhrase() {
	return startGamePhrases[randomInt(0, startGamePhrases.length)] + ". ";
}

function getFarewellPhrase() {
	return farewellPhrases[randomInt(0, farewellPhrases.length)] + ". ";
}

function getWinPhrase() {
	return winPhrases[randomInt(0, winPhrases.length)] + ". ";
}

function getLostPhrase() {
	return losePhrases[randomInt(0, losePhrases.length)] + ". ";
}

function handleSpeechQuerks(speech) {
    var querks = ["Does it growl?", "Does it roll?", "Does it have four legs?",     +
        "Is it round?", "Can you lift it?", "Can it help you find your way?",       +
        "Does it cry?", "Can it growl?", "Is it tall?", "Is it used by the police?" +
        "Does it purr?", "Does it get wet?"];

    if (querks.indexOf(speech) > -1) return speech.substring(0, speech.length - 1);
    return speech;

    //      if (speech.indexOf("Does it growl?") > -1) return speech.substring(0, speech.length - 1);
    // else if (speech.indexOf("Does it roll?") > -1) return speech.substring(0, speech.length - 1);
    // else if (speech.indexOf("Does it have four legs?") > -1) return speech.substring(0, speech.length - 1);
    // else if (speech.indexOf("Is it round?") > -1) return speech.substring(0, speech.length - 1);
    // else if (speech.indexOf("Can you lift it?") > -1) return speech.substring(0, speech.length - 1);
    // else if (speech.indexOf("Can it help you find your way?") > -1) return speech.substring(0, speech.length - 1);
    // else if (speech.indexOf("Does it cry?") > -1) return speech.substring(0, speech.length - 1);
    // else if (speech.indexOf("Can it growl?") > -1) return speech.substring(0, speech.length - 1);
    // else if (speech.indexOf("Is it tall?") > -1) return speech.substring(0, speech.length - 1);
    // else if (speech.indexOf("Is it used by the police?") > -1) return speech.substring(0, speech.length - 1);
    // else if (speech.indexOf("Does it purr?") > -1) return speech.substring(0, speech.length - 1);
    // else if (speech.indexOf("Does it get wet?") > -1) return speech.substring(0, speech.length - 1);
    // return speech;
}

function getQuestionNo(text) {
    // console.log(text)
    //Question 17. Does it have a long tail?
    //Question 2.  Does it have claws?
    text = text.replace("Question ", "");
    var retVal = text.substring(0,  text.indexOf("."));
    // console.log(retVal)
    return retVal;
}

function buildNaturalLangList(items, finalWord) {
    var output = '';
    for (var i = 0; i < items.length; i++) {
        if (items[i] == 'Close') items[i] = 'Nearly';
        else if (items[i] == 'Right') items[i] = 'Yes';
        else if (items[i] == 'Wrong') items[i] = 'No';
        if(i === 0) {
            output += items[i];
        } else if (i < items.length - 1) {
            output += ', ' + items[i];
        } else {
            output += ', ' + finalWord + ' ' + items[i];
        }
    }

    return output;
}

function getRandomFact(summary) {

    var facts = [
        // avgGameHr
        "Since this Skill launched, the Alexa community are currently playing an average of " + summary.avgGameHr + " games every hour!",

        "Since this Skill launched, the Alexa community are currently playing an average of " +  numberWithCommas(summary.avgGameHr*24) + " games every day!",
        // categories
        "The categories chosen by the Alexa community is popularity order are " + summary.categories[0].key + ", " + summary.categories[1].key + ", " + summary.categories[2].key + ", " + summary.categories[3].key + " and finally " + summary.categories[4].key + "!" ,

        // failed
        // loses
        // quickest
        // quickestObj
        "My fastest correct guess was for " + summary.quickestObj + " in only " + summary.quickest + " questions!",
        // topWords
        "The top 5 objects picked by the Alexa community are " + summary.topWords[0].key + ", " + summary.topWords[1].key + ", " + summary.topWords[2].key + ", " + summary.topWords[3].key + " and " + summary.topWords[4].key +  "!",

        // totalGames
        "Since this Skill launched, the Alexa community have played " + numberWithCommas(summary.totalGames) + " games",
        // wins
        "Since this Skill launched, Alexa has guessed " + Math.floor(((summary.wins + (summary.loses)-summary.failed) / summary.totalGames) * 100) + '% of objects correctly - though not all in 20 questions or less.'
    ];

    var retVal =  facts[randomInt(0, facts.length )];
    console.log(retVal)
    return retVal
}

function getGuessText(guessText) {

    var retVal = guessText.split("I am guessing that it is ")[1];

    if (retVal.slice(-1) == '?') retVal = retVal.substring(0, retVal.length - 1);

    return retVal;
}

function randomInt(low, high) {
    return Math.floor(Math.random() * high);
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

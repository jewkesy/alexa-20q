function getGuessText(guessText) {
    // Question 17.  I am guessing that it is a panther?
    // Question 17.  I am guessing that it is marble (the rock)
    // Question 17.  I am guessing that it is an ant eater?
    // Question 30.  I am guessing that it is an armadillo?
    // console.log(guessText);
    var retVal = guessText.split("I am guessing that it is ")[1];
    // console.log(retVal);
    // console.log(retVal.slice(-1));
    if (retVal.slice(-1) == '?') retVal = retVal.substring(0, retVal.length - 1);
    // console.log(retVal);
    return retVal;
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


console.log(getGuessText("Question 1.  I am guessing that it is a panther?"), getQuestionNo("Question 1.  I am guessing that it is a panther?"));
console.log(getGuessText("Question 17.  I am guessing that it is a panther?"), getQuestionNo("Question 17.  I am guessing that it is a panther?"));
console.log(getGuessText("Question 17.  I am guessing that it is marble (the rock)"), getQuestionNo("Question 17.  I am guessing that it is marble (the rock)?"));
console.log(getGuessText("Question 17.  I am guessing that it is an ant eater?"), getQuestionNo("Question 17.  I am guessing that it is an ant eater?"));
console.log(getGuessText("Question 30.  I am guessing that it is an armadillo?"), getQuestionNo("Question 30.  I am guessing that it is an armadillo?"));
// console.log(getGuessText(""));



function handleSpeechQuerks(speech) {
    if (speech.indexOf("Does it growl?") > -1) return speech.substring(0, speech.length - 1);
    else if (speech.indexOf("Does it roll?") > -1) return speech.substring(0, speech.length - 1);
    else if (speech.indexOf("Does it have four legs?") > -1) return speech.substring(0, speech.length - 1);
    else if (speech.indexOf("Is it round?") > -1) return speech.substring(0, speech.length - 1);
    else if (speech.indexOf("Can you lift it?") > -1) return speech.substring(0, speech.length - 1);
    else if (speech.indexOf("Can it help you find your way?") > -1) return speech.substring(0, speech.length - 1);
    else if (speech.indexOf("Does it cry?") > -1) return speech.substring(0, speech.length - 1);
    else if (speech.indexOf("Can it growl?") > -1) return speech.substring(0, speech.length - 1);
    return speech;
}
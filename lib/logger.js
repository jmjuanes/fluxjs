let logty = require("logty");
let colorSupport = require("color-support");

//Colors
let colorsEnabled = colorSupport().hasBasic;
let colorize = function(start, end) {
    return function(text) {
        return (colorsEnabled === true) ? "\u001b["+ start + "m" + text + "\u001b[" + end + "m" : text;
    }
};
let colors = {
    red: colorize(31, 39),
    grey: colorize(90, 39),
    blue: colorize(34, 39)
};

//Log message format
let logFormat = function(tag, label, message){
    return "[" + colors.grey(logty.timestamp("YYYY-MM-DD hh:mm:ss")) + "] " + message;
};

//Stdout log
let logStdout = new logty(null, {encoding: "utf8"});
logStdout.setFormat(logFormat);
logStdout.pipe(process.stdout);

//Stderr log
let logStderr = new logty(null, {encoding: "utf8"});
logStderr.setFormat(logFormat);
logStderr.pipe(process.stderr);

//Disable colors
module.exports.disableColors = function() {
    colorsEnabled = false;
};

//Generate a log message
module.exports.log = function(message) {
    logStdout.customLabeledMessage("", message);
};

//Generate an error message
module.exports.error = function(message) {
    logStderr.customLabeledMessage("", colors.red(message));
};

//Finish logs
module.exports.end = function() {
    logStdout.end();
    logStderr.end();
};

//Log colors
module.exports.colors = colors;

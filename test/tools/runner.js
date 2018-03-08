let exec = require("child_process").exec;
let path = require("path");

module.exports = function (file, args, cb) {
    let cmd = ["node"];
    //Append the script file to run
    cmd.push(path.join(process.cwd(), "./test/samples/" + file));
    //Append the arguments passed
    cmd = cmd.concat(args);
    //console.log(cmd.join(" "));
    //Run the script
    return exec(cmd.join(" "), function (error, stdout, stderr) {
        if (error) {
            return cb(error, [], []);
        }
        //console.log("---------- output: ");
        //console.log(stdout);
        //console.log("---------- error: ");
        //console.log(stderr);
        //Split the stdout and stderr strings by line break
        let stdoutItems = parseStd(stdout);
        let stderrItems = parseStd(stderr);
        return cb(null, stdoutItems, stderrItems);
    });
};

//Parse std text
let parseStd = function (str) {
    return str.split("\n").filter(function (line) {
        return line.trim().length !== 0;
    });
};

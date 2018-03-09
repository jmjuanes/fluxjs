let keue = require("keue");
let getArgs = require("get-args");

//Log manager
let logger = require("./lib/logger.js");

//Parse the options
let options = getArgs().options;

//Tasks manager
let tasks = new keue();
let tasksList = []; //List of added tasks
let taskStart = 0, taskEnd = 0; //Task timers
tasks.on("finish", function () {
    logger.end();
});
tasks.on("task:start", function (name) {
    taskStart = Date.now();
    return logger.log("Task '" + logger.colors.blue(name) + "' started.");
});
tasks.on("task:end", function(name){
    taskEnd = Date.now();
    let time = taskEnd - taskStart;
    return logger.log("Task '" + logger.colors.blue(name) + "' finished after " + time + "ms.");
});
tasks.on("error", function(error){
    logger.error(error.message);
    logger.end();
});

//Add a new task
module.exports.task = function () {
    tasks.addTask.apply(tasks, arguments);
    tasksList.push(arguments[0]);
};

//Print a log message in console
module.exports.log = logger.log;
module.exports.error = logger.error;

//Access to the options passed to the script
module.exports.option = function(key) {
    return options[key];
};

process.nextTick(function () {
    //Check the no-colors option
    if(typeof options["flow-no-colors"] === "boolean") {
        logger.disableColors();
    }
    //Get the tasks to run
    let list = (typeof options["flow-tasks"] === "string") ? options["flow-tasks"].split(",") : tasksList;
    if(list.length === 0) {
        logger.error("No tasks to run");
        return logger.end();
    }
    process.nextTick(function(){
        try {
            tasks.run(list);
        } catch(error) {
            logger.error(error.message);
            logger.end();
        }
    });
});

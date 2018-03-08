let keue = require("keue");
let getArgs = require("get-args");
let logty = require("logty");

//Log manager
let logger = new logty(null, {encoding: "utf8"});
logger.setFormat(function(tag, label, message){
    return "[" + logty.timestamp("YYYY-MM-DD hh:mm:ss") + "] " + message;
});
logger.pipe(process.stdout);

//Tasks finished method
let tasksFinished = function() {
    logger.end();
};

//Tasks manager
let tasks = new keue();
let tasksList = []; //List of added tasks
let taskStart = 0, taskEnd = 0; //Task timers
tasks.on("finish", function () {
    return tasksFinished();
});
tasks.on("task:start", function (name) {
    taskStart = Date.now();
    return logger.debug("Starting task " + name + "");
});
tasks.on("task:end", function(name){
    taskEnd = Date.now();
    return logger.debug("Task " + name + " finished after " + (taskEnd - taskStart) + "ms");
});
tasks.on("error", function(error){
    logger.debug(error.message);
    return tasksFinished();
});

//Add a new task
module.exports.task = function () {
    tasks.addTask.apply(tasks, arguments);
    tasksList.push(arguments[0]);
};

//Print a log message in console
module.exports.log = function(message) {
    logger.customLabeledMessage("", message);
};

//Next tick
process.nextTick(function () {
    let options = getArgs().options;
    //console.log(options);
    let list = (typeof options.tasks === "string") ? options.tasks.split(",") : tasksList;
    if(list.length === 0) {
        logger.customLabeledMessage("", "No tasks to run");
        return tasksFinished();
    }
    //Run the provided tasks
    process.nextTick(function(){
        return tasks.run(list);
    });
});

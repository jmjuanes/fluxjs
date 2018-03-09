let flow = require("../../index.js");

flow.task("task0", function (done) {
    flow.log("Executed task 0");
    return done();
});

flow.task("task1", ["task0"], function (done) {
    flow.log("Executed task 1");
    return done();
});

flow.task("task2", ["task0", "task1"], function (done) {
    flow.log("Executed task 2");
    return done();
});

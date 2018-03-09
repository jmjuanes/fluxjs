let assert = require("assert");
let runner = require("./tools/runner.js");

describe("flag: --flow-tasks", function(){

    it("runs all tasks if flag is not used", function(done){
        runner("simple-script.js", [], function(error, stdout, stderr){
            assert.equal(error, null);
            assert.equal(stdout.length, 9);
            assert.equal(stderr.length, 0);
            return done();
        });
    });

    it("runs only the provided task", function(done){
        runner("simple-script.js", ["--flow-tasks", "task0"], function(error, stdout, stderr){
            assert.equal(error, null);
            assert.equal(stdout.length, 3);
            assert.equal(stderr.length, 0);
            return done();
        });
    });

    it("display an error it a task is not defined", function(done){
        runner("simple-script.js", ["--flow-tasks", "task3"], function(error, stdout, stderr){
            assert.equal(error, null);
            assert.equal(stdout.length, 0);
            assert.equal(stderr.length, 1);
            return done();
        });
    });

});

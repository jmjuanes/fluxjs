# tinyflow

> Tiny module for automating tasks in your workflow

[![npm](https://img.shields.io/npm/v/tinyflow.svg?style=flat-square)](https://www.npmjs.com/package/tinyflow)
[![npm](https://img.shields.io/npm/dt/tinyflow.svg?style=flat-square)](https://www.npmjs.com/package/tinyflow)
[![npm](https://img.shields.io/npm/l/tinyflow.svg?style=flat-square)](https://github.com/jmjuanes/tinyflow)


## Installation 

Use [npm](https://npmjs.com) to install this module on your project:

```
npm install --save tinyflow
```

## Usage

Create a new file and write the tasks that you want to automatize. For example, let's create a file called `tasks.js`:

```javascript
let flow = require("tinyflow");
let fs = require("fs");
let path = require("path");
let sass = require("node-sass");
let mkdirp = require("mkdirp");
let uglify = require("uglify-js");

//Create the dist folder 
flow.task("create-dist", function (done) {
    mkdirp.sync("./dist");
    return done();
});

//Compile SCSS files
//First we must run the create-dist task 
flow.task("compile-scss", ["create-dist"], function (done) {
    let content = fs.readFileSync("./scss/style.scss", "utf8");
    //Compile the scss files
    return sass.render({data: content}, function (error, result) {
        if (error) {
            return done(error);
        }
        //Write the compiled scss file 
        fs.writeFileSync("./dist/style.scss", result.css, "utf8");
        return done();
    });
});

//Minify JS files 
//First we should run the create-dist task
flow.task("minify-js", ["create-dist"], function (done) {
    let content = fs.readFileSync("./js/index.js", "utf8");
    let result = uglify.minify(content);
    if (result.error) {
        return done(result.error); 
    }
    fs.writeFileSync("./dist/index.js", result.code, "utf8");
    return done();
});

//Default tasks 
flow.defaultTask(["compile-scss", "minify-js"]);

```

You can execute all tasks defined in `flow.defaultTask` by running this script with `node`: 

```bash 
$ node ./tasks.js
```

You can execute a single task (or a subset of tasks) by using the flag `--flow-tasks` with the task to execute (or a comma-separated list of tasks): 
`
```bash 
$ node ./tasks.js --flow-tasks compile-scss
```

You can use the [npm scripts](https://docs.npmjs.com/misc/scripts) field in `package.json` to define these commands: 

```json
{
    "scripts": {
        "compile-scss": "node ./tasks.js --flow-tasks compile-scss",
        "minify-js": "node ./tasks.js --flow-tasks minify-js",
    }
}
```



## API 

### flow.task(name\[, dependencies\], handler)

Register a new task called `name`. This method is an alias of [`keue.addTask`](https://github.com/jmjuanes/keue#tasksaddtaskname-dependencies-handler). 

The task `dependencies` is a `string` or an `array` of `strings` with the names of the tasks that should be executed before running this task. This argument is optionally. 

The task `handler` is a function that will execute the task operations. This function will be called with only one argument: a `done` function that should be called when the all the task operations are finished.

```javascript
flow.task("task0", function (done) {
    //Do your task operations
    //. . .

    //When all the operations are finished, call the done function 
    return done();
});
```

If there is an error running the task operations, you can call the `done` function with an error object. After that, the error will be automatically printed in console and the flow will be aborted, so no more tasks will be executed.

```javascript
flow.task("task-async", function (done) {
    yourAsyncFunction(arg1, ..., function (error, data) {
        if (error) {
            //Something went wrong running 'yourAsyncFunction', print the error and abort the tasks
            return done(error);
        }
        //Continue with your operations.
        //. . .
        return done();
    });
});
```


### flow.defaultTask(task)

Define the default task or tasks that should be runned if the script is called without the `--flow-tasks` option. The `task` argument can be a `string` with the name of the single task to execute, or an `array` of strings with the order that the tasks should be executed. Note that this order will change if any task has dependencies, so in this case the dependencies will be executed before.

```javascript
//Set a single default task to run
flow.defaultTask("task0");

// OR

//Set an array with thasks to be executed in order:
flow.defaultTask(["task0", "task1", "task2"]);
```

### flow.getArgument(key)

Use this method to access to any argument passed to the script using a single or a double hyphenated arguments.

```javascript
// node script.js --name John

let name = flow.getArgument("name");
console.log(name); // John
```


### flow.log(message)

Print log messages in console.

```javascript
flow.log("This is a log message");
```

### flow.error(message)

Print error messages in console.

```javascript 
flow.error("Something went wrong...");
``` 


## CLI flags

You can use the following flags from the command-line to change the default behavior of the tool. Your custom flags can be accessed with `flow.getArgument`.

#### `--flow-tasks tasks`

Define the tasks that will be executed. It also determines the order where these tasks will be executed. If this option is not used, the module will execute the tasks provided with `flow.defaultTask`.

You can execute a single task (and all the dependencies of these task) providing the name of the task to execute: 

```bash 
$ node ./my-tasks.js --flow-tasks compile-scss
```

You can also execute multiple tasks providing a list of comma-separated tasks to execute: 

```bash 
$ node ./my-tasks.js --flow-tasks compile-css,compile-js,minify-css,minify-js
```

#### `--flow-no-colors`

All logs and errors messages will be displayed without colors.

```bash
$ node ./my-tasks.js --flow-no-colors
```

## License 

Under the [MIT LICENSE](./LICENSE).


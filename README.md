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

Create a new file and write the tasks that you want to automatize. For example, let's create a file called `
```javascript
let flow = require("tinyflow");

//
```




## API 

### flow.task(name\[, dependencies\], handler)

Register a new task called `name`. This method is an alias of [`keue.addTask`](https://github.com/jmjuanes/keue#tasksaddtaskname-dependencies-handler).


### flow.defaultTask(task)

Define the default task or tasks that should be runned if the script is called without the `--flow-tasks` option. The `task` argument can be a `string` with the name of the single task to execute, or an `array` of strings with the order that the tasks should be executed. Note that this order should change if any task has dependencies, so in this case the dependencies will be executed before.

```javascript
//Set a single default task to run
flow.defaultTask("task0");

// OR

//Set an array with thasks to be executed in order:
flow.defaultTask(["task0", "task1", "task2"]);
```


## License 

Under the [MIT LICENSE](./LICENSE).


# tinyflow

> Tiny module to run pipelines in Node.js

[![npm](https://img.shields.io/npm/v/tinyflow.svg?style=flat-square)](https://www.npmjs.com/package/tinyflow)
[![npm](https://img.shields.io/npm/dt/tinyflow.svg?style=flat-square)](https://www.npmjs.com/package/tinyflow)
[![npm](https://img.shields.io/npm/l/tinyflow.svg?style=flat-square)](https://github.com/jmjuanes/tinyflow)


## Installation 

Use [npm](https://npmjs.com) to install this module on your project:

```
npm install --save tinyflow
```

## Usage

```javascript
var tinyflow = require('tinyflow');

//Create a flow instance 
var flow = new tinyflow('My flow', './data', { verbose: true });

//Add the files
flow.file('input1', { path: './input1.txt', content: 'Hello world!!' });
flow.file('output1', { path: './output1.txt' });
flow.file('temporal1', { path: './temporal1.txt', delete: true });

//Register the variables
flow.variable('init_message', 'Welcome to Flow example');
flow.variable('end_message', 'See you soon!!');

//Register the commands
flow.command('start', "echo '{{ variable.init_message }}'");
flow.command('test1', "cat {{ file.input1 }} > {{ file.temporal1 }}");
flow.command('test2', "cat {{ file.temporal1 }} > {{ file.output1 }}");
flow.command('end', "echo '{{ variable.end_message }}'");

//Aborted event listener
flow.on('abort', function()
{
  //Display in console
  console.log('WORKFLOW ABORTED');
});

//Pause event listener
flow.on('pause', function()
{
  //Display in console
  console.log('WORKFLOW PAUSED');
});

//Finish event listener
flow.on('finish', function()
{
  //Display in console
  console.log('WORKFLOW FINISHED');
});

//Run the flow
flow.run();
```

## API 

### var flow = new tinyflow(name, wd, options);

Initialize a new `tinyflow` instance. 

### flow.file(name, options);

Register a new file that can be used in the flow.

### flow.binary(name, path);

Register a new binary file that can be used in the flow.

### flow.variable(name, value);

Register a new variable that can be used in the flow.

### flow.command(name, command_template);

Register a command template that will be executed in the flow.

### flow.run(callback);

Initialize the flow.

## License 

Under the [MIT LICENSE](./LICENSE).
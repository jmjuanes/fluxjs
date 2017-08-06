//Import workfly
var workfly = require('../index.js');

//Initialize the new flow object
var flow = new workfly('My flow', './', { verbose: true });

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

//Register the error event listener
flow.on('error', function(error)
{
  //Display the error in console
  console.error('ERROR : ' + error.message);
});

//Command run
flow.on('command-after:test2', function(index, cmd, stdout, stderr)
{
  //Pause the flow
  flow.pause();

  //Set the time out
  return setTimeout(function()
  {
    //Display the stdout
    console.log('===== STDOUT of command ' + index);
    console.log(stdout);

    //Display the stderr
    console.log('===== STDERR of command ' + index);
    console.log(stderr);

    //Resume the flow
    return flow.resume();
  }, 1000);

  //Abort the flow
  //flow.abort();
});

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

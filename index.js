//Import dependencies
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var logty = require('logty');
var util = require('util');
var events = require('events');
var utily = require('utily');

//Import workfly libs
var workfly_cmd = require('./lib/command.js');
var workfly_file = require('./lib/file.js');

//Initialize the workfly object
var workfly = function(name, wd, opt)
{
  //Check the workflow name
  if(typeof name !== 'string'){ throw new Error('No workflow name provided'); }

  //Check the working directory value
  if(typeof wd === 'undefined'){ wd = process.cwd(); }

  //Check the options object
  if(typeof opt !== 'object'){ opt = {}; }

  //Save the workflow name
  this._name = name.trim();

  //Initialize the data
  this._data = { file: {}, variable: {}, binary: {}, wd: null };

  //Initialize the working directory
  this._data.wd = (typeof wd === 'string') ? path.resolve(process.cwd(), wd) : process.cwd();

  //Initialize the commands list
  this._commands = [];

  //Initialize the workfly options
  this._options = Object.assign({ encoding: 'utf8', verbose: false }, (typeof wd === 'object') ? wd : opt);

  //Initialize the workflow status
  this._status = { running: false, completed: false, aborted: false, paused: false, time_start: 0, time_end: 0 };

  //Workflow command index
  this._index = -1;

  //Workflow logger
  this._log = new logty(this._name);

  //Inherit to the event emitter constructor
  events.call(this);

  //Return the workflow object
  return this;
};

//Inherits EventEmitter to workfly
util.inherits(workfly, events);

//Set a new file
workfly.prototype.file = function(name, options)
{
  //Initialize the file properties
  var obj = Object.assign({ path: null, ext: '.txt', content: null, delete: false }, options);

  //Check the file path
  if(obj.path !== null)
  {
    //Create the new file path
    obj.path = './' + utily.string.unique() + obj.ext;
  }

  //Resolve the file path
  obj.path = path.resolve(this._data.wd, obj.path);

  //Save the file object
  this._data.file[name] = obj;

  //Display in logs
  this._log.debug('Set file "' + name + '" -> ' + obj.path);

  //Return this
  return this;
};

//Set a binary file path
workfly.prototype.binary = function(name, options)
{
  //Initialize the binary options
  var obj = Object.assign({ path: null }, options);

  //Parse the binary path
  obj.path = path.resolve(this._data.wd, obj.path);

  //Save the binary into the list
  this._data.binary[name] = obj;

  //Display in logs
  this._log.debug('Set binary "' + name + '" -> ' + obj.path);

  //Return this
  return this;
};

//Set a variable
workfly.prototype.variable = function(key, value)
{
  //Save the variable
  this._data.variable[key.trim()] = value;

  //Return this
  return this;
};

//Add a new command
workfly.prototype.command = function(name, cmd)
{
  //Save the command
  this._commands.push({ name: name.trim(), cmd: cmd.trim() });

  //Return this
  return this;
};

//Run the workflow
workfly.prototype.run = function()
{
  //Save this
  var self = this;

  //Display in console
  self._log.info('Working directory: ' + self._data.wd);

  //Check the number of commands to run
  if(self._commands.length === 0)
  {
    //Display error in logs
    self._log.fatal('No commands to run in workflow');

    //Emit the error event
    return self.emit('error', new Error('No commands to run in workflow'));
  }
  else
  {
    //Display in logs
    self._log.info('Detected ' + self._commands.length + ' commands to execute');
  }

  //Create the working directory
  mkdirp(self._wd, '0777', function(error)
  {
    //Check for error
    if(error)
    {
      //Display the error in logs
      self._log.fatal('Error creating the working directory');

      //Emit the error event and exit
      return self.emit('error', error);
    }

    //Initialize the files
    return workfly_file.create(self._data.file, self._log, function(error)
    {
      //Check the error
      if(error){ return self.emit('error', error); }

      //Set workflow as running
      self._status.running = true;

      //Save the run start time
      self._status.time_start = Date.now();

      //Reset the command index
      self._index = -1;

      //Display in logs
      self._log.info('Starting workflow');

      //Initialize the commands queue
      return self._next();
    });
  });

  //Return this
  return this;
};

//Run the next command
workfly.prototype._next = function()
{
  //Save this
  var self = this;

  //Check if workflow is completed
  if(self._status.completed === true){ return; }

  //Check if workflow is paused or aborted
  if(self._status.paused === true || self._status.aborted === true)
  {
    //Set workflow running as false
    self._status.running = false;

    //Print in log
    self.log.notice((self._status.paused === true) ? 'Workflow paused' : 'Workflow aborted');

    //Emit the event
    return self.emit((self._status.paused === true) ? 'pause' : 'abort', self._index);
  }

  //Set workflow running as true
  self._status.running = true;

  //Increment the command index
  self._index = self._index + 1;

  //Check the state index
  if(self._index >= self._commands.length)
  {
    //Set running as false
    self._status.running = false;

    //Clear the unused files
    return workfly_file.delete(self._data.file, self.log, function(error)
    {
      //Check the error
      if(error)
      {
        //Display the error in logs
        self._log.error('Error removing the marked files');

        //Emit the error 
        return self.emit('error', error);
      }

      //Get the run end time
      self._status.time_end = Date.now();

      //Get the elapsed time in seconds
      var seconds = Math.round((self._status.time_end - self._status.time_start) / 1000);

      //Display in logs
      self._log.notice('Workflow completed in ' + seconds + ' seconds');

      //Set status as completed
      self._status.completed = true;

      //Emit the finish event
      return self.emit('finish');
    });
  }

  //Get the command object
  var cmd_obj = self._commands[self._index];

  //Get the command name
  var cmd_name = cmd_obj.name;

  //Parse the command
  var cmd_line = workfly_cmd.parse(cmd_obj.cmd, self._data, self._log);

  //Emit the command before event
  self.emit('command-before:' + cmd_name, self._index, cmd_line);

  //Display in logs
  self._log.notice('Running command ' + cmd_name);

  //Display the command in console
  self._log.debug('$ ' + cmd_line);

  //Run the command
  return workfly_cmd.run(cmd_line, self._data, self._log, self._options, function(error, cmd_out, cmd_err)
  {
    //Check for error
    if(error)
    {
      //Set running as false
      self._status.running = false;

      //Display the error message
      self._log.error('Error running command ' + cmd_name);

      //Display the error message
      self._log.error(error.message);

      //Display workflow aborted
      self._log.fatal('Workflow aborted');

      //Emit the error event and exit
      return self.emit('error', error);
    }

    //Emit the command completed event
    self.emit('command-after:' + cmd_name, self._index, cmd_line, cmd_out, cmd_err);

    //Next command
    return self._next();
  });
};

//Abort the workflow
workfly.prototype.abort = function()
{
  //Abort the workflow when the command that is running now is finished
  this._status.aborted = true;
};

//Pause the workflow
workfly.prototype.pause = function()
{
  //Pause the workflow
  this._status.paused = true;
};

//Resume the workflow
workfly.prototype.resume = function()
{
  //Resume the workflow
  this._status.paused = false;

  //Check if workflow is aborted or completed
  if(this._status.aborted === true || this._status.completed === true ){ return; }

  //Check if workflow running
  if(this._status.running === true){ return; }

  //Emit the resumed event
  this.emit('resume');

  //Print in logs
  this._log.info('Workflow resumed');

  //Continue with the next command
  return this._next();
};

//Exports to node
module.exports = workfly;

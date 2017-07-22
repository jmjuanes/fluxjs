//Import dependencies
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var logty = require('logty');
var util = require('util');
var events = require('events');
var utily = require('utily');

//Import workfly libs
var workfly_cmd = require('./lib/cmd.js');
var workfly_parse = require('./lib/parse.js');

//Initialize the options object
var options = {};
options.verbose = false; //Print log messages in console
options.encoding = 'utf8'; //Default encoding
options.timeout = 0; //Command timeout execution value
options.max_buffer = 200*1024; //Command max buffer value
options.clear_temp = false; //Remove temporal files at end

//Initialize the workfly object
var workfly = function(name, obj)
{
  //Save the workflow name
  this.name = (typeof name === 'string') ? name.trim() : '';

  //Initialize the working directory
  this.wd = path.join(process.cwd(), './');

  //Initialize the files
  Object.assign(this, { input: {}, output: {}, temp: {}, binaries: {} });

  //Initialize the commands
  this.commands = [];

  //Initialize the variables list
  this.variables = {};

  //Initialize the workfly options
  this.options = Object.assign({}, options);

  //Initialize the workflow status
  Object.assign(this, { _completed: false, _running: false, _paused: false, _aborted: false });

  //Workflow command index
  this._index = -1;
  
  //Time start and end 
  Object.assign(this, { _time_start: 0, _time_end: 0 });

  //Workflow logger
  this._log = new logty(this.name);

  //Inherit to the event emitter constructor
  events.call(this);

  //Parse the workfly object
  this._parse((typeof name === 'object') ? name : obj);

  //Run the workflow
  return this._run();
};

//Inherits EventEmitter to workfly
util.inherits(workfly, events);

//Log writer
workfly.prototype._log_writer = function(msg)
{
  //Check the options
  if(this.options.verbose === false){ return; }

  //Write the log to the stdout
  process.stdout.write(msg);
};

//Parse a workfly object
workfly.prototype._parse = function(obj)
{
  //check the object
  if(typeof obj !== 'object'){ return this; }

  //Save this
  var self = this;

  //Check the working directory
  if(typeof obj.wd === 'string')
  {
    //Save the new working directory
    this.wd = path.resolve(this.wd, obj.wd);

    //Add the last / at the current working directory
    this.wd = path.join(this.wd, './');
  }

  //Iterate over all the files list
  ['input','output','temp','binaries'].forEach(function(item)
  {
    //Check for object
    if(typeof obj[item] !== 'object'){ return; }

    //Save the files
    Object.assign(self[item], obj[item]);
  });

  //Parse the commands
  if(Array.isArray(obj.commands) === true)
  {
    //Concatenate the list of commands
    this.commands = this.commands.concat(obj.commands);
  }

  //Parse the variables
  if(typeof obj.variables === 'object')
  {
    //Assign the list of variables
    Object.assign(this.variables, obj.variables);
  }

  //Check the options
  if(typeof obj.options === 'object')
  {
    //Parse the options
    this.options = workfly_parse.options(this.options, obj.options);
  }

  //Return this
  return this;
};

//Run the workflow
workfly.prototype._run = function()
{
  //Save this
  var self = this;

  //Display in console
  self._log.info('Working directory: ' + self.wd);

  //Parse all the files
  ['input','output','temp'].forEach(function(type)
  {
    //Display the files information
    self._log.info('Using the following ' + type + ' files');

    //Parse the files list
    self[type] = workfly_parse.files(self.wd, self[type], self._log);
  });

  //Binaries list
  if(utily.object.keys(self.binaries).length !== 0)
  {
    //Display a binaries information
    self._log.info('Using the following binaries list');

    //Parse the binaries list
    self.binaries = workfly_parse.binaries(self.binaries, self._log);
  }
  else
  {
    //Display a warning in console
    self._log.warning('No binaries paths provided');
  }

  //Parse the commands list
  self.commands = workfly_parse.commands(self.commands);

  //Check the number of commands to run
  if(self.commands.length === 0)
  {
    //Display error in logs
    self._log.fatal('No commands to run in workflow');

    //Emit the error event
    return self.emit('error', new Error('No commands to run in workflow'));
  }
  else
  {
    //Display in logs
    self._log.info('Detected ' + self.commands.length + ' commands to execute');
  }

  //Create the working directory
  mkdirp(self.wd, '0777', function(error)
  {
    //Check for error
    if(error)
    {
      //Emit the error event and exit
      return self.emit('error', error);
    }

    //Set workflow as running
    self._running = true;

    //Save the run start time
    self._time_start = Date.now();

    //Display in logs
    self._log.info('Starting workflow');

    //Initialize the commands queue
    return self._next();
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
  if(self._completed === true){ return; }

  //Check if workflow is paused or aborted
  if(self._paused === true || self._aborted === true)
  {
    //Set workflow running as false
    self._running = false;

    //Check the type
    if(self._paused === true)
    {
      //Print in logs
      self._log.info('Workflow paused');

      //Emit the paused event
      return self.emit('pause', self._index);
    }
    else
    {
      //Print in logs
      self._log.info('Workflow aborted');

      //Emit the aborted event
      return self.emit('abort', self._index);
    }
  }

  //Set workflow running as true
  self._running = true;

  //Increment the command index
  self._index = self._index + 1;

  //Check the state index
  if(self._index >= self.commands.length)
  {
    //Set running as false
    self._running = false;

    //Clear the temporal files
    return self._clear_temp(function(error)
    {
      //Check the error
      if(error)
      {
        //Emit the error 
        return self.emit('error', error);
      }

      //Get the run end time
      self._time_end = Date.now();

      //Display in logs
      self._log.notice('Run completed in ' + (self._time_end - self._time_start) + ' ms');

      //Set status as completed
      self._completed = true;

      //Emit the finish event
      return self.emit('finish');
    });
  }

  //Get the command
  var cmd = workfly_cmd.parse(self.commands[self._index], self);

  //Display in logs
  self._log.notice('Running command ' + self._index);

  //Display the command in console
  self._log.notice('$ ' + cmd);

  //Run the command
  return workfly_cmd.exec(cmd, self.wd, self.options, function(error, cmd_time, cmd_out, cmd_err)
  {
    //Check for error
    if(error)
    {
      //Set running as false
      self._running = false;

      //Display the error message
      self._log.error('Error running command ' + self._index);
      self._log.error(error.message);

      //Emit the error event and exit
      return self.emit('error', error);
    }

    //Display the time in logs
    self._log.notice('Command completed in ' + cmd_time + ' ms');

    //Emit the command completed event
    self.emit('command', self._index, cmd, cmd_out, cmd_err);

    //Next command
    return self._next();
  });
};

//Clear the temporal files
workfly.prototype._clear_temp = function(cb)
{
  //Save this
  var self = this;

  //Get the list of temporal files
  var list = utily.object.values(self.temp);

  //Check the clear temporal files option
  if(self.options.clear_temp === false || list.length === 0)
  {
    //Do the callback without remove the temporal files
    return cb(null);
  }

  //Display in log the path of each file that will be removed
  list.forEach(function(file)
  {
    //Display in logs
    self._log.info('Remove temporal file : ' + file);
  });

  //Clear the temporal files
  return utily.fs.unlink(list, function(error)
  {
    //Do the callback with the error
    return cb(error);
  });
};

//Abort the workflow
workfly.prototype.abort = function()
{
  //Abort the workflow when the command that is running now is finished
  this._aborted = true;
};

//Pause the workflow
workfly.prototype.pause = function()
{
  //Pause the workflow
  this._paused = true;
};

//Resume the workflow
workfly.prototype.resume = function()
{
  //Resume the workflow
  this._paused = false;

  //Check if workflow is aborted or completed
  if(this._aborted === true || this._completed === true ){ return; }

  //Check if workflow running
  if(this._running === true){ return; }

  //Emit the resumed event
  this.emit('resume');

  //Print in logs
  this._log.info('Workflow resumed');

  //Continue with the next command
  return this._next();
};

//Exports to node
module.exports = workfly;

//Import dependencies
var fs = require('fs');
var path = require('path');
var pstat = require('pstat');
var mkdirp = require('mkdirp');
var logty = require('logty');
var util = require('util');
var events = require('events');
var utily = require('utily');

//Import workfly libs
var workfly_commands = require('./lib/commands.js');
var workfly_parse = require('./lib/parse.js');

//Initialize the options object
var options = {};
options.verbose = false; //Print log messages in console
options.encoding = 'utf8'; //Default encoding
options.timeout = 0; //Command timeout execution value
options.max_buffer = 200*1024; //Command max buffer value
options.clear_temp = false; //Remove temporal files at end

//Initialize the workfly object
var workfly = function(obj)
{
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

  //Workflow status
  this.status = { running: false, aborted: false, completed: false };

  //Inherit to the event emitter constructor
  events.call(this);

  //Parse the workfly object
  return this.parse(obj);
};

//Inherits EventEmitter to workfly
util.inherits(workfly, events);

//Parse a workfly object
workfly.prototype.parse = function(obj)
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
workfly.prototype.run = function()
{
  //Save this
  var self = this;

  //Log write fake stream
  var log_writer = function(msg)
  {
    //Check the options
    if(self.options.verbose === false){ return; }

    //Write the log to the stdout
    process.stdout.write(msg);
  };

  //Initialize the log object
  var log = new logty('', { write: log_writer });

  //Check the number of commands to run
  if(self.commands.length === 0)
  {
    //Display error in logs
    log.fatal('No commands to run in workflow');

    //Emit the error event
    return self.emit('error', new Error('No commands to run in workflow'));
  }

  //Set workflow as running
  self.status.running = true;

  //Save the run start time
  var run_start = Date.now();

  //Display in console
  log.info('Working directory: ' + self.wd);

  //Parse all the files
  ['input','output','temp'].forEach(function(type)
  {
    //Display the files information
    log.info('Using the following ' + type + ' files');

    //Parse the files list
    self[type] = workfly_parse.files(self.wd, self[type], log);
  });

  //Binaries list
  if(utily.object.keys(self.binaries).length !== 0)
  {
    //Display a binaries information
    log.info('Using the following binaries list');

    //Parse the binaries list
    self.binaries = workfly_parse.binaries(self.binaries, log);
  }
  else
  {
    //Display a warning in console
    log.warning('No binaries paths provided');
  }

  //Create the working directory
  return mkdirp(self.wd, '0777', function(error)
  {
    //Check for error
    if(error)
    {
      //Set running as false
      self.status.running = false;

      //Emit the error event and exit
      return self.emit('error', error);
    }

    //Clear the temporal files
    var clear_temp = function(cb)
    {
      //Check the clear temporal files option
      if(self.options.clear_temp === false)
      {
        //Do the callback without remove the temporal files
        return cb();
      }

      //Get the list of temporal files
      var list = utily.object.values(self.temp);

      //Clear the temporal files
      return utily.files.rm(list, function(error)
      {
        //Check the error
        return (error) ? self.emit('error', error) : cb();
      });
    };

    //Run each command
    var run_cmd = function(index)
    {
      //Check the aborted status
      if(self.status.aborted === true)
      {
        //Set running as false
        self.status.running = false;

        //Display in console
        log.notice('Workflow aborted');

        //Emit the abort event
        return self.emit('abort', index);
      }

      //Check the index
      if(index >= self.commands.length)
      {
        //Set running as false
        self.status.running = false;

        //Clear the temporal files
        return clear_temp(function()
        {
          //Get the run end time
          var run_end = Date.now();

          //Display in logs
          log.info('Run completed in ' + (run_end - run_start) + ' ms');

          //Set status as completed
          self.status.completed = true;

          //Emit the finish event
          return self.emit('finish');
        });
      }

      //Get the command
      var cmd = workfly_commands.parse(self.commands[index], self);

      //Display in logs
      log.notice('Running command ' + index);

      //Display the command in console
      log.notice('$ ' + cmd);

      //Run the command
      return workfly_commands.exec(cmd, self.wd, self.options, function(error, cmd_time, cmd_out, cmd_err)
      {
        //Check for error
        if(error)
        {
          //Set running as false
          self.status.running = false;

          //Display the error message
          log.error('Error running command ' + index);
          log.error(error.message);

          //Emit the error event and exit
          return self.emit('error', error);
        }

        //Display the time in logs
        log.notice('Command completed in ' + cmd_time + ' ms');

        //Emit the command completed event
        self.emit('command', index, cmd, cmd_out, cmd_err);

        //Next command
        return run_cmd(index + 1);
      });
    };

    //Initialize the commands queue
    return run_cmd(0);
  });
};

//Abort the workflow
workfly.prototype.abort = function()
{
  //Abort the workflow when the command that is running now is finished
  this.status.aborted = true;
};

//Exports to node
module.exports = workfly;

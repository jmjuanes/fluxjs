//Import dependencies
var fs = require('fs');
var path = require('path');
var pstat = require('pstat');
var mkdirp = require('mkdirp');
var logty = require('logty');
var util = require('util');
var events = require('events');

//Import flux libs
var flux_commands = require('./lib/commands.js');
var flux_files = require('./lib/files.js');
var flux_options = require('./lib/options.js');

//Initialize the flux object
var flux = function(obj)
{
  //Initialize the working directory
  this.wd = path.join(process.cwd(), './');

  //Initialize the files
  Object.assign(this, { input: {}, output: {}, temp: {}, binaries: {} });

  //Initialize the commands
  this.commands = [];

  //Initialize the variables list
  this.variables = {};

  //Initialize the flux options
  this.options = flux_options.init();

  //Workflow status
  this.status = { running: false, aborted: false, completed: false };

  //Inherit to the event emitter constructor
  events.call(this);

  //Parse the flux object
  return this.parse(obj);
};

//Inherits EventEmitter to fluxjs
util.inherits(flux, events);

//Parse a flux object
flux.prototype.parse = function(obj)
{
  //Check the working directory
  if(typeof obj.wd === 'string')
  {
    //Save the new working directory
    this.wd = path.resolve(this.wd, obj.wd);

    //Add the last / at the current working directory
    this.wd = path.join(this.wd, './');
  }

  //Parse the files
  ['input','output','temp','binaries'].forEach(function(item)
  {
    //Parse the files
    new_obj[item] = flux_files.parse(obj[item], obj.wd);
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
    this.options = flux_options.parse(this.options, obj.options);
  }

  //Return this
  return this;
};

//Run
flux.prototype.run = function()
{
  //Save this
  var self = this;

  //Set workflow as running
  self.status.running = true;

  //Save the run start time
  var run_start = Date.now();

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

  //Display in console
  log.info('Working directory: ' + self.wd);

  //Parse all the files
  ['input','output','temp','binaries'].forEach(function(item)
  {
    //Parse the files list
    self[item] = flux_files.parse(self.wd, self[item]);
  });

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

      //Clear the temporal files
      return flux_files.remove(self.temp, function(error)
      {
        //Check the error
        if(error)
        {
          //Emit the error event
          return self.emit('error', error);
        }
        else
        {
          //Do the callback
          return cb();
        }
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
      var cmd = flux_commands.parse(self.commands[index], self);

      //Display in logs
      log.notice('Running command ' + index);

      //Display the command in console
      log.notice('$ ' + cmd);

      //Run the command
      return flux_commands.exec(cmd, self.wd, self.options, function(error, cmd_time, cmd_out, cmd_err)
      {
        //Check for error
        if(error)
        {
          //Set running as false
          self.status.running = false;

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
flux.prototype.abort = function()
{
  //Abort the workflow when the command that is running now is finished
  this.status.aborted = true;
};

//Exports to node
module.exports = flux;

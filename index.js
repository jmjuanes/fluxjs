//Import dependencies
var fs = require('fs');
var path = require('path');
var pstat = require('pstat');
var mkdirp = require('mkdirp');
var log = require('logty');

//Import flux libs
var flux_commands = require('./lib/commands.js');
var flux_files = require('./lib/files.js');
var flux_options = require('./lib/options.js');

//Initialize the flux object
var flux = {};

//Generate a new flux object
flux.init = function(wd)
{
  //Initialize the flux object
  var obj = { wd: process.cwd(), commands: [], variables: {} };

  //Initialize the files paths
  obj = Object.assign(obj, { input: {}, output: {}, temp: {}, binaries: {} });

  //Initialize the options
  obj.options = flux_options.init();

  //Check the current working directory
  if(typeof wd === 'string'){ obj.wd = path.resolve(obj.wd, wd); }

  //Return the new flux object
  return obj;
};

//Run a flux object
flux.run = function(obj_original, cb)
{
  //Check for no object
  if(typeof obj_original !== 'object'){ throw new Error('No Flux object provided'); }

  //Check for no callback function
  if(typeof cb !== 'function'){ throw new Error('No callback method provided'); }

  //Initialize the logs object
  var logs = [];

  //Parse the flux object
  var obj = flux.parse(obj_original, logs);

  //Create thw working directory
  return mkdirp(obj.wd, '0777', function(error)
  {
    //Check for error
    if(error){ return cb(error, logs, obj); }

    //Finish running
    var run_end = function(error)
    {
      //Check the clear temporal files option
      if(obj.options.clear_temp === true)
      {
        //Clear the temporal files
        return flux_files.remove(obj.temp, function(error_temp)
        {
          //Check the error temporal
          error = (error === null) ? error_temp : error;

          //Do the callback
          return cb(error, logs, obj);
        });
      }

      //Do the callback
      return cb(error, logs, obj);
    };

    //Run each command
    var run_cmd = function(index)
    {
      //Check the index
      if(index >= obj.commands.length)
      {
        //Do the callback
        return run_end(null);
      }

      //Get the command
      var cmd = flux_commands.parse(obj.commands[index], obj);

      //Display in console
      console.log(cmd);

      //Run the command
      return flux_commands.exec(cmd, obj, function(error, cmd_logs)
      {
        //Concatenate the logs
        logs = logs.concat(cmd_logs);

        //Check for error
        if(error)
        {
          //Do the callback with the error
          return run_end(error);
        }

        //Next command
        return run_cmd(index + 1);
      });
    };

    //Initialize the commands queue
    return run_cmd(0);
  });
};

//Parse the flux object
flux.parse = function(obj, logs)
{
  //Initialize the new object
  var new_obj = { wd: process.cwd(), commands: [], variables: {}, options: {} };

  //Check the working directory
  if(typeof obj.wd === 'string'){ new_obj.wd = path.resolve(process.cwd(), obj.wd); }

  //Add the last / at the current working directory
  obj.wd = path.join(obj.wd, './');

  //Parse the files
  ['input','output','temp','binaries'].forEach(function(item)
  {
    //Parse the files
    new_obj[item] = flux_files.parse(obj[item], obj.wd);
  });

  //Parse the commands
  if(Array.isArray(obj.commands) === true){ new_obj.commands = obj.commands; }

  //Parse the variables
  if(typeof obj.variables === 'object'){ new_obj.variables = Object.assign(new_obj.variables, obj.variables); }

  //Check the options
  if(typeof obj.options !== 'object'){ obj.options = {}; }

  //Parse the options
  new_obj.options = flux_options.parse(obj.options);

  //Return the parsed object
  return new_obj;
};

//Exports to node
module.exports = flux;

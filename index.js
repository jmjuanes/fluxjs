//Import dependencies
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var pstat = require('pstat');
var mkdirp = require('mkdirp');
var log = require('logty');

//Generate a new flux object
module.exports.init = function(wd)
{
  //Initialize the flux object
  var obj = { wd: process.cwd(), commands: [], variables: {} };

  //Initialize the files paths
  obj = Object.assign(obj, { input: {}, output: {}, temp: {}, binaries: {} });

  //Initialize the options
  obj.options = { clear_temp: false, encoding: 'utf8', timeout: 0, max_buffer: 200*1024 };

  //Check the current working directory
  if(typeof wd === 'string'){ obj.wd = path.resolve(obj.wd, wd); }

  //Return the new flux object
  return obj;
};

//Run a flux object
module.exports.run = function(obj_original, cb)
{
  //Check for no object
  if(typeof obj_original !== 'object')
  {
    //Throw the error
    throw new Error('No Flux object provided');
  }

  //Check for no callback function
  if(typeof cb !== 'function')
  {
    //Throw the new error
    throw new Error('No callback method provided');
  }

  //Initialize the logs object
  var logs = [];

  //Parse the flux object
  var obj = parse_obj(obj_original, logs);

  //Create thw working directory
  return mkdirp(obj.wd, '0777', function(error)
  {
    //Check for error
    if(error){ return cb(error, logs, obj); }

    //Run each command
    var run_cmd = function(index)
    {
      //Check the index
      if(index >= obj.commands.length)
      {
        //Do the callback
        return cb(null);
      }

      //Get the command
      var cmd = prepare_cmd(obj.commands[index], obj);

      //Initialize the command options
      var cmd_opt = { cwd: obj.wd, encoding: obj.options.encoding, timeout: obj.options.timeout };

      //Display in console
      console.log(cmd);

      //Get the start time
      var time_start = Date.now();

      //Run the command
      return exec(cmd, cmd_opt, function(error, stdout, stderr)
      {
        //Get the execution time end
        var time_end = Date.now();

        //Check for error
        if(error)
        {
          //Do the callback with the error
          return cb(error);
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
var parse_obj = function(obj)
{
  //Initialize the new object
  var new_obj = { wd: process.cwd(), commands: [], variables: {}, options: {} };

  //Check the working directory
  if(typeof obj.wd === 'string'){ new_obj.wd = path.resolve(process.cwd(), obj.wd); }

  //Parse the files
  ['input','output','temp','binaries'].forEach(function(item)
  {
    //Initialize the new object
    new_obj[item] = {};

    //Check if the item is defined
    if(typeof obj[item] !== 'object'){ return; }

    //Read all the keys in the object
    for(var key in obj[item])
    {
      //Get the value
      var value = obj[item][key];

      //Check for string
      if(typeof value !== 'string'){ continue; }

      //Save the key
      new_obj[item][key] = path.resolve(new_obj.wd, value);
    }
  });

  //Parse the commands
  if(Array.isArray(obj.commands) === true){ new_obj.commands = obj.commands; }

  //Parse the variables
  if(typeof obj.variables === 'object'){ new_obj.variables = Object.assign(new_obj.variables, obj.variables); }

  //Check the options
  if(typeof obj.options !== 'object'){ obj.options = {}; }

  //Check the clear temporal files option
  if(typeof obj.options.clear_temp === 'boolean'){ new_obj.options.clear_temp = obj.options.clear_temp; }

  //Return the parsed object
  return new_obj;
};


//Prepre the command
var prepare_cmd = function(cmd, obj)
{
  //Replace in the command and return the new generated command
  return cmd.replace(/{{([^{}]+)}}/g, function(match, found)
  {
    //Parse the found string
    var pattern = found.trim().split('.');

    //Check the length
    if(pattern.length < 2){ return match; }

    //Get the object type
    var obj_type = pattern[0].trim().toLowerCase();

    //Get the object key
    var obj_key = pattern[1].trim();

    //Get the value
    var value = obj[obj_type][obj_key];

    //Check if value exists and is a string
    if(typeof value === 'string')
    {
      //Check for file or binary
      if(['input', 'output', 'temp', 'binaries'].indexOf(obj_type) !== -1)
      {
        //Return the file path
        return path.resolve(obj.wd, value);
      }
      else
      {
        //Return the value
        return value;
      }
    }

    //Default, return the original match
    return match;
  });
};

//Remove the temporal files
var remove_temporals = function(cb)
{
  //Save this
  var self = this;

  //Get all the temporal files
  var files_keys = Object.keys(this.temporals);

  //Method to remove all temporal files
  var rm_temp = function(index)
  {
    //Check the index
    if(index >= files_keys.length)
    {
      //Do the callback without error
      return cb(null);
    }

    //Get the file path
    var file = self.temporals[files_keys[index]];

    //Check if temporal file exists
    return pstat.isFile(file, function(exists)
    {
      //Check if temporal file exists
      if(exists === false)
      {
        //Continue with the next file
        return rm_temp(index + 1);
      }

      //Remove the file
      return fs.unlink(file, function(error)
      {
        //Check the error
        if(error){ return cb(error); }

        //Continue with the next temporal file
        return rm_temp(index + 1);
      });
    });
  };

  //Remove the first file
  return rm_temp(0);
};

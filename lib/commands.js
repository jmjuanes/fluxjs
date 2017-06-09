//Import dependencies
var exec = require('child_process').exec;

//Execute a command
module.exports.exec = function(cmd, obj, cb)
{
  //Initialize this command logs
  var cmd_logs = [];

  //Get the options object
  var opt = obj.options;

  //Initialize the command options
  var cmd_opt = { cwd: obj.wd, encoding: opt.encoding, timeout: opt.timeout, maxBuffer: opt.max_buffer };

  //Get the start time
  var time_start = Date.now();

  //Run the command
  return exec(cmd, cmd_opt, function(error, stdout, stderr)
  {
    //Get the execution time end
    var time_end = Date.now();

    //Do the callback
    return cb(error, cmd_logs);
  });
};

//Parse a command
module.exports.parse = function(cmd, obj)
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

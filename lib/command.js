//Import dependencies
var spawn = require('child_process').spawn;

//Run a command
module.exports.run = function(line, data, log, opt, cb)
{
  //Initialize the command options
  var options = { cwd: data.wd };

  //Get the start time
  var time_start = Date.now();

  //Initialize the stdout data
  var stdout_data = '';

  //Initialize the stderr data
  var stderr_data = '';

  //Initialize the command
  var cmd = spawn(line, options);

  //Error event
  cmd.on('error', function(error)
  {
    //Call the callback with the error
    return cb(error, null, null);
  });

  //Stdout data
  cmd.stdout.on('data', function(message)
  {
    //Append the stdout data
    stdout_data = stdout_data + message.toString();

    //Check the verbose mode
    if(opt.verbose === false){ return; }

    //Display the stdout message
    log.notice('stdout: ' + message.toString());
  });

  //Stderr data
  cmd.stderr.on('data', function(message)
  {
    //Append the stderr data
    stderr_data = stderr_data + message.toString();

    //Check the verbose mode
    if(opt.verbose === false){ return; }

    //Display the stderr message
    log.notice('stderr: ' + message.toString());
  });

  //Close with a code
  cmd.on('close', function(code)
  {
    //Display in log
    log.notice('Command exited with code ' + code);

    //Get the execution time end
    var time_end = Date.now();

    //Get the total tile
    var time_total = Math.round((time_end - time_start) / 1000);

    //Display in logs
    log.notice('Command completed in ' + time_total + 'seconds');

    //Do the callback
    return cb(null, stdout_data, stderr_data);
  });
};

//Parse a command
module.exports.parse = function(cmd, data, log)
{
  //Replace in the command and return the new generated command
  return cmd.replace(/{{([^{}]+)}}/g, function(match, found)
  {
    //Check for working directory variable
    if(found.trim() === 'wd'){ return data.wd; }

    //Parse the found string
    var pattern = found.trim().split('.');

    //Check the length
    if(pattern.length === 2)
    {
      //Get the object type
      var obj_type = pattern[0].trim().toLowerCase();

      //Get the object key
      var obj_key = pattern[1].trim();

      //Check the type
      if(obj_type === 'binary' || obj_type === 'file')
      {
        //Check the path value
        if(typeof data[obj_type][obj_key].path === 'string')
        {
          //Return the path value
          return data[obj_type][obj_key].path;
        }
      }
      else if(obj_type === 'variable')
      {
        //Check the variable value
        if(typeof data.variable[obj_key] !== 'undefined')
        {
          //Return the variable value
          return data.variable[obj_key].toString();
        }
      }
    }

    //Display waring
    log.warning('Unknown pattern ' + match);

    //Return the original match
    return match;
  });
};

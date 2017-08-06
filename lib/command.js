//Import dependencies
var exec = require('child_process').exec;

//Run a command
module.exports.run = function(line, data, log, opt, cb)
{
  //Initialize the command options
  var options = { cwd: data.wd, encoding: opt.encoding };

  //Get the start time
  var time_start = Date.now();

  //Run the command
  var cmd = exec(line, options, function(error, stdout, stderr)
  {
    //Get the execution time end
    var time_end = Date.now();

    //Display in logs
    log.notice('Command completed in ' + Math.round((time_end - time_start) / 1000) + 'seconds');

    //Do the callback
    return cb(error, stdout, stderr);
  });

  //Stdout data
  cmd.stdout.on('data', function(message)
  {
    //Check the verbose mode
    if(opt.verbose === false){ return; }

    //Display the stdout message
    log.notice('stdout: ' + message.toString());
  });

  //Stderr data
  cmd.stderr.on('data', function(message)
  {
    //Check the verbose mode
    if(opt.verbose === false){ return; }

    //Display the stderr message
    log.notice('stderr: ' + message.toString());
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

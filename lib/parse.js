//Import dependencies
var path = require('path');
var utily = require('utily');

//Parse the binaries list
module.exports.binaries = function(list, log)
{
  //Parsed binaries list
  var parsed_list = {};

  //Read all the binaries keys and paths
  utily.object.keys(list).forEach(function(key)
  {
    //Check for string path
    if(typeof list[key] !== 'string')
    {
      //Display a warning message
      log.warning('Binary "' + key + '" has not a string path. Skipping binary.');
    }
    else
    {
      //Save to the parsed list
      parsed_list[key] = list[key].trim();

      //Display in logs the binary path
      log.info('Binary ' + key + ' -> ' + parsed_list[key]);
    }
  });

  //Return the parsed list
  return parsed_list;
};

//Parse a list of files
module.exports.files = function(wd, list, log)
{
  //Parsed files list
  var parsed_list = {};

  //Read all the files on the list
  utily.object.keys(list).forEach(function(key)
  {
    //Check for string path
    if(typeof list[key] !== 'string')
    {
      //Display a warning message
      log.warning('File "' + key + '" has not a string path associated. Skipping file.');
    }
    else
    {
      //Get the absolute path to the file and save to the list
      parsed_list[key] = path.resolve(wd, list[key].trim());

      //Display in logs the file path
      log.info('File ' + key + ' -> ' + parsed_list[key]);
    }
  });

  //Return the parsed list
  return parsed_list;
};
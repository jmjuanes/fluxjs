//Import dependencies
var fs = require('fs');
var path = require('path');
var pstat = require('pstat');

//Parse the files
module.exports.parse = function(wd, files)
{
  //New files list
  var new_files = {};

  //Parse the files on this block
  Object.keys(files).forEach(function(file_key)
  {
    //Get the file path
    var file_path = files[file_key];

    //Check if provided path is a string
    if(typeof file_path !== 'string'){ return; }

    //Resolve the file path
    file_path = path.resolve(wd, file_path);

    //Save to the new files list
    new_files[file_key] = file_path;
  });

  //Return the new files object
  return new_files;
};

//Remove a list of files
module.exports.remove = function(files, cb)
{
  //Get all the files to delete
  var files_keys = Object.keys(files);

  //Method to remove all temporal files
  var remove_file = function(index)
  {
    //Check the index
    if(index >= files_keys.length)
    {
      //Do the callback without error
      return cb(null);
    }

    //Get the file path
    var file = files[files_keys[index]];

    //Check if temporal file exists
    return pstat.isFile(file, function(exists)
    {
      //Check if temporal file exists
      if(exists === false)
      {
        //Continue with the next file
        return remove_file(index + 1);
      }

      //Remove the file
      return fs.unlink(file, function(error)
      {
        //Check the error
        if(error){ return cb(error); }

        //Continue with the next temporal file
        return remove_file(index + 1);
      });
    });
  };

  //Remove the first file
  return remove_file(0);
};

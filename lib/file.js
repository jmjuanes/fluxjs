//Import dependencies
var fs = require('fs');
var utily = require('utily');

//Create the files
module.exports.create = function(list, log, cb)
{
  //Get the list of files names
  var names = utily.object.keys(list);

  //Create a temporal file
  var file_create_iterator = function(index, name, next)
  {
    //Get the file options
    var obj = list[name];

    //Display in logs
    //log.debug('Saving temporal file "' + value.name + '" as ' + out[value.name]);

    //Check the content
    if(typeof obj.content !== 'string'){ return next(); }

    //Create the file
    return fs.writeFile(obj.path, obj.content, 'utf8', function(error)
    {
      //Delete the file content
      obj.content = null;

      //Continue with the next file
      return next(error);
    });
  };

  //Create done
  var file_create_done = function(error)
  {
    //Call the callback method with the error
    return cb(error);
  };

  //Create the temporal files
  return utily.eachAsync(names, file_create_iterator, file_create_done);
};

//Delete the files
module.exports.delete = function(list, log, cb)
{
  //Get the list of files names
  var names = utily.object.keys(list);

  //File delete iterator
  var file_delete_iterator = function(index, name, next)
  {
    //Get the file options
    var obj = list[name];

    //Check if the file is not marked to delete
    if(obj.delete !== true){ return next(); }

    //Display in logs
    log.info('Deleted ' + obj.path);

    //Delete the file
    return utily.fs.unlink(obj.path, function(error)
    {
      //Continue with the next file
      return next(error);
    });
  };

  //File delete done
  var file_delete_done = function(error)
  {
    //Call the callback function with the error
    return cb(error);
  };

  //Delete the temporal files
  return utily.eachAsync(names, file_delete_iterator, file_delete_done);
};

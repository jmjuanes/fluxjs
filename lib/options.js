//Initialize the options object
var options = {};

//Add the options list
options.clear_temp = false; //Clear the temporal files at end
options.encoding = 'utf8'; //Default encoding
options.timeout = 0; //Command timeout execution value
options.max_buffer = 200*1024; //Command max buffer value
options.verbose = false; //Print logs in console

//Clone the opions
var clone_options = function()
{
  //Return a clone of the default options
  return Object.assign({}, options);
};

//Initialize the options
module.exports.init = function()
{
  //Return a clone of the options
  return clone_options();
};

//Parse an options object
module.exports.parse = function(opt)
{
  //Get a clone of the options
  var new_opt = clone_options();

  //Check for undefined options object
  if(typeof opt !== 'object'){ return new_opt; }

  //Parse all the options
  for(var key in new_opt)
  {
    //Check if this option is defined in the original options object
    if(typeof opt[key] !== typeof new_opt[key]){ continue; }

    //Save the original option value
    new_opt[key] = opt[key];
  }

  //Return the new options
  return new_opt;
};

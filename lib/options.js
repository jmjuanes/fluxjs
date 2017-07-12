//Initialize the options
module.exports.init = function()
{
  //Initialize the options object
  var opt = {};

  //Add the options list
  opt.clear_temp = false; //Clear the temporal files at end
  opt.encoding = 'utf8'; //Default encoding
  opt.timeout = 0; //Command timeout execution value
  opt.max_buffer = 200*1024; //Command max buffer value
  opt.verbose = false; //Print logs in console

  //Return the options
  return opt;
};

//Parse an options object
module.exports.parse = function(original, opt)
{
  //Check for undefined options object
  if(typeof opt !== 'object'){ return original; }

  //Parse all the options
  for(var key in opt)
  {
    //Check if this option is defined in the original options object
    if(typeof opt[key] !== typeof original[key]){ continue; }

    //Save to the original option value
    original[key] = opt[key];
  }

  //Return the parsed options
  return original;
};

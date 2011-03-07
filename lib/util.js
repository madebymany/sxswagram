var sys = require('sys');

// fn(err) -> fn(success, ...)
//
exports.errorHandler = function(onError){
  return function(onSuccess){
    return function(err, r0, r1, r2, r3){
      if (err) {
        onError(err);
      } else if (onSuccess) {
        onSuccess(r0, r1, r2, r3); // Simpler & quicker than argument slicing
      }  
    };
  };
};

exports.printErr = function(err){
  sys.log(err);
  if (typeof err.stack !== 'undefined') {
    console.log(err.stack);
  }
};

// object, fn(key, value)
//
exports.objForEach = function(o, fn){
  Object.keys(o).forEach(function(k){
    fn(k, o[k]);
  });
};

// string, fn(err, messageType, messageData)
//
exports.decodeMessage = function(raw, callback){
  try {
    var m = JSON.parse(raw);
    callback(null, m[0], m[1]);
  } catch(err) {
    callback(err);
  }
};

exports.encodeMessage = function(messageType, messageData){
  return JSON.stringify([messageType, messageData]);
};

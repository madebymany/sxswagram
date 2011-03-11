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

// Return elements in a that are not in b
// e.g. [1, 2], [2, 3] -> [1]
//
exports.arrSubtract = function(a, b){
  return a.reduce(function(acc, e){
    if (b.indexOf(e) === -1) { acc.push(e); }
    return acc;
  }, []);
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

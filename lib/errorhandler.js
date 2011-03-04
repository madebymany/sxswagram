exports.handler = function(onError){
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

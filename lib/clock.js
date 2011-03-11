var fs = require('fs');

var getAllClocks = function(path, callback){
  fs.readdir(path, function(err, files){
    if (err) { callback(err); return; }
    callback(null, files.reduce(function(acc, file){
      var m = file.match(/([^\/]+).png$/);
      if (m) { acc.push(parseInt(m[1], 10)); }
      return acc;
    }, []));
  });
};

exports.getAllClocks = getAllClocks;

var sys          = require('sys'),
    async        = require('async'),
    config       = require('../config/config.js'),
    instagram    = require('../lib/instagram').
                     createClient(config.clientId, config.accessToken),
    database     = require('../lib/database');

var handle = function(onSuccess){
  return function(err, a, b, c, d){
    if (err) {
      console.log(err.stack);
    } else {
      onSuccess(a, b, c, d); // Simpler than argument slicing
    }  
  }
};

database.withCollection(config, handle(function(db, collection){
  async.forEach(config.userIds, function(userId, done){
    instagram.getUserMedia(userId, {count: 1000}, handle(function(resultSet){
      if (resultSet.hasOwnProperty('data')) {
        collection.insert(resultSet.data, handle(function(){
          console.log(resultSet.data.length + ' records added');
          done();
        }));
      } else {
        done();
      }
    }));
  }, function(){
    db.close();
  });
}));

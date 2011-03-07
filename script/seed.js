var sys       = require('sys'),
    async     = require('async'),
    config    = require('../config/config').config,
    instagram = require('../lib/instagram').
                     createClient(config.clientId, config.accessToken),
    util      = require('../lib/util'),
    database  = require('../lib/database');

var E = util.errorHandler(function(err){
  console.log(err.stack);
});

database.withCollection(config, E(function(collection){
  async.forEach(config.userIds, function(userId, done){
    instagram.getUserMedia(userId, {count: 1000}, E(function(resultSet){
      if (resultSet.hasOwnProperty('data')) {
        collection.insert(resultSet.data, E(function(){
          console.log(resultSet.data.length + ' records added');
          done();
        }));
      } else {
        done();
      }
    }));
  }, function(){
    collection.db.close();
  });
}));

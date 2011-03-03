var sys          = require('sys'),
    async        = require('async'),
    config       = require('../config/config'),
    instagram    = require('../lib/instagram').
                     createClient(config.clientId, config.accessToken),
    errorHandler = require('../lib/errorhandler'),
    database     = require('../lib/database');

var handle = errorHandler.handler(function(err){
  console.log(err.stack);
});

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

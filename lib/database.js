var getLatestUpdateId = function(userId, callback){
  this.find({'user.id': userId}, {limit: 1, sort: {id: -1}}, function(err, cursor){
    if (err) { callback(err); return; }
    cursor.toArray(function(err, docs){
      if (err) { callback(err); return; }
      if (docs.length > 0) {
        callback(null, docs[0].id);
      } else {
        callback(null, 0);
      }
    });
  });
};

var getLatestBlogPostTime = function(callback){
  this.find({type: 'blog'}, {limit: 1, sort: {created_time: -1}}, function(err, cursor){
    if (err) { callback(err); return; }
    cursor.toArray(function(err, docs){
      if (err) { callback(err); return; }
      if (docs.length > 0) {
        callback(null, docs[0].created_time);
      } else {
        callback(null, 0);
      }
    });
  });
};

var getUpdates = function(criteria, howMany, callback){
  this.find(criteria, {limit: howMany, sort: {id: -1}}, function(err, cursor){
    if (err) { callback(err); return; }
    cursor.toArray(function(err, docs){
      if (err) { callback(err); return; }
      callback(null, docs);
    });
  });
};

exports.withCollection = function(config, callback){
  var mongodb = require('mongodb'),
      client  = new mongodb.Db(
                  config.database.name,
                  new mongodb.Server(
                    config.database.hostname,
                    config.database.port,
                    {auto_reconnect: true, native_parser: true}
                  )
                );

  client.open(function(err, p_client) {
    if (err) { callback(err); return; }
    client.collection('updates', function(err, c) {
      if (err) { callback(err); return; }
      c.getLatestUpdateId     = getLatestUpdateId.bind(c);
      c.getUpdates            = getUpdates.bind(c);
      c.getLatestBlogPostTime = getLatestBlogPostTime.bind(c);
      callback(null, c);
    });
  });
};

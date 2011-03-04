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
    client.createCollection('updates', function(err, collection) {
      if (err) { callback(err); return; }
      client.collection('updates', function(err, collection) {
        if (err) { callback(err); return; }
        callback(null, client, collection);
      });
    });
  });
};

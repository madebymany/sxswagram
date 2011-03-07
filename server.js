var sys          = require('sys'),
    config       = require('./config/config').config,
    instagram    = require('./lib/instagram').
                     createClient(config.clientId, config.accessToken),
    errorHandler = require('./lib/errorhandler'),
    database     = require('./lib/database'),
    people       = require('./lib/person').
                     fromUserIds(config.userIds),
    server       = require('./lib/pushserver').
                     createServer(config.port, __dirname + '/public'),
    cachedInitialUpdates = null;

var printErr = function(err){
  sys.log(err);
  if (typeof err.stack !== 'undefined') {
    console.log(err.stack);
  }
};

var E = errorHandler.handler(function(err){
  printErr(err);
});

var objForEach = function(o, fn){
  Object.keys(o).forEach(function(k){
    fn(k, o[k]);
  });
};

var main = function(dbCollection){

  // Find latest update ID for each person
  // on response:
  //   - start polling for person.
  //
  objForEach(function(_, person){
    var pollInterval = config.pollInterval.normal;
    dbCollection.getLatestUpdateId(person.userId, E(function(n){
      person.setMinId(n);
      var poll = function(){
        console.log('polling '+person.userId);
        person.getLatestUpdates(instagram, function(err, res){
          if (err) {
            pollInterval = config.pollInterval.error;
            printErr(err);
          } else {
            pollInterval = config.pollInterval.normal;
            if (res) { updateReceived(res); }
          }
        });
        // This will be reached before the success/failure is known. That's OK,
        // because:
        // 1) we want to poll again regardless of what happens; and
        // 2) even if the next poll happens soon, over the long run we will
        // back off and avoid hammering the API.
        setTimeout(poll, pollInterval);
      };
      poll();
    }));
  });

  // For each update received:
  //   - save to database
  //   - broadcast to all clients
  //
  var updateReceived = function(update){
    console.log('received update for '+update.user.id);
    cachedInitialUpdates = null;
    dbCollection.insert(update, E());
    server.clientPool.broadcast(JSON.stringify(['new', [update]]));
  };

  // Send client a batch of the latest N updates before timestamp
  //
  var sendUpdates = function(client, timestamp){
    var criteria = {created_time: {$lt: timestamp}};
    dbCollection.getUpdates(criteria, config.chunkSize, E(function(data){
      client.send(JSON.stringify(['more', data]));
    }));
  };

  // Send client a starting batch of the latest N updates
  //
  var sendInitialUpdates = function(client){
    var send = function(data){
      client.send(JSON.stringify(['start', data]));
    };
    if (cachedInitialUpdates) {
      send(cachedInitialUpdates);
    } else {
      dbCollection.getUpdates({}, config.chunkSize, E(function(data){
        cachedInitialUpdates = data;
        send(data);
      }));
    }
  };

  // On socket connection:
  //   - Add to pool
  //   - Set up disconnection handler
  //   - Set up message handler
  //   - Send an initial set of updates
  //
  server.socket.on('connection', function(client){
    server.clientPool.add(client);
    client.on('disconnect', function(){
      server.clientPool.remove(client);
    });
    client.on('message', function(m){
      var message = JSON.parse(m);
      switch (message[0]) {
        case 'more':
          sendUpdates(client, message[1]);
          break;
      }
    });
    sendInitialUpdates(client);
  });
};

database.withCollection(config, E(function(collection){
  main(collection);
}));

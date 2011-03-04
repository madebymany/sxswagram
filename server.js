var sys          = require('sys'),
    async        = require('async'),
    config       = require('./config/config').config,
    instagram    = require('./lib/instagram').
                     createClient(config.clientId, config.accessToken),
    errorHandler = require('./lib/errorhandler'),
    database     = require('./lib/database'),
    people       = require('./lib/person').
                     fromUserIds(config.userIds),
    server       = require('./lib/pushserver').
                     createServer(config.port, __dirname + '/public'),
    pollInterval = config.pollInterval.normal,
    bulkData     = '[]';

var printErr = function(err){
  sys.log(err);
  if (typeof err.stack !== 'undefined') {
    console.log(err.stack);
  }
};

var handle = errorHandler.handler(function(err){
  printErr(err);
});

var main = function(dbCollection){

  // Find latest update ID for each person
  // on response:
  //   - start polling for person.
  //
  Object.keys(people).forEach(function(userId){
    var person = people[userId];
    dbCollection.getLatestUpdateId(person.userId, handle(function(n){
      person.setMinId(n);
      var poll = function(){
        console.log('polling '+person.userId);
        person.getLatestUpdate(instagram, function(err, res){
          if (err) {
            pollInterval = config.pollInterval.error;
            printErr(err);
          } else {
            pollInterval = config.pollInterval.normal;
            if (res) { updateReceived(res); }
          }
        });
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
    dbCollection.insert(update, handle());
    server.clientPool.broadcast(JSON.stringify(['new', [person.lastUpdate]]));
  };

  // On request for new data:
  // if timestamp given:
  //   - send batch before timestamp
  // else:
  //   - send starting batch (latest)
  //
  var sendUpdates = function(client, timestamp){
    var criteria, header;
    if (timestamp) {
      criteria = {created_time: {$lt: timestamp}};
      header = 'more';
    } else {
      criteria = {};
      header = 'start';
    }
    dbCollection.getUpdates(criteria, config.chunkSize, handle(function(data)){
      client.send(JSON.stringify([header, data]));
    });
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
    sendUpdates(client);
  });
};

database.withCollection(config, handle(function(collection){
  main(collection);
}));

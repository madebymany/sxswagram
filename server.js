var config    = require('./config/config').config,
    instagram = require('./lib/instagram').
                  createClient(config.clientId, config.accessToken),
    util      = require('./lib/util'),
    database  = require('./lib/database'),
    people    = require('./lib/person').
                  fromUserIds(config.userIds),
    server    = require('./lib/pushserver').
                  createServer(config.port, __dirname + '/public'),
    atom      = require('./lib/atom'),
    blog      = new atom.Feed(config.atom.url),
    cachedInitialUpdates = null;

var E = util.errorHandler(function(err){
  util.printErr(err);
});

var main = function(dbCollection){

  // Find latest update ID for each person
  // on response:
  //   - start polling for person.
  //
  util.objForEach(people, function(_, person){
    var pollInterval = config.pollInterval.normal;
    dbCollection.getLatestUpdateId(person.userId, E(function(n){
      person.setMinId(n);
      var poll = function(){
        console.log('polling '+person.userId);
        person.getLatestUpdates(instagram, function(err, res){
          if (err) {
            pollInterval = config.pollInterval.error;
            util.printErr(err);
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

  // Find latest blog post time
  // on response:
  //   - start polling for blog posts
  //
  dbCollection.getLatestBlogPostTime(E(function(n){
    blog.setMinTimestamp(n);
    var poll = function(){
      console.log('polling blog feed');
      blog.getLatestPosts(E(function(post){
        updateReceived(post);
      }));
      setTimeout(poll, config.atom.pollInterval);
    };
    poll();
  }));

  // For each update received:
  //   - expire initial update cache
  //   - save to database
  //   - broadcast to all clients
  //
  var updateReceived = function(update){
    switch (update.type) {
      case 'image':
        console.log('received update for ' + update.user.username);
        break;
      case 'blog':
        console.log('found blog post ' + update.title);
        break;
      default:
        console.log('unknown update ' + update.type);
    }
    cachedInitialUpdates = null;
    dbCollection.insert(update, E());
    server.clientPool.broadcast(util.encodeMessage('new', [update]));
  };

  // Send client a batch of the latest N updates before timestamp
  //
  var sendUpdates = function(client, timestamp){
    var criteria = {created_time: {$lt: timestamp}};
    dbCollection.getUpdates(criteria, config.chunkSize, E(function(data){
      client.send(util.encodeMessage('more', data));
    }));
  };

  // Send client a starting batch of the latest N updates
  //
  var sendInitialUpdates = function(client){
    var send = function(data){
      client.send(util.encodeMessage('start', data));
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

  // Handle an incoming message
  //
  var receivedMessage = function(client, raw){
    util.decodeMessage(raw, E(function(type, data){
      if (type === 'more') {
        sendUpdates(client, data);
      }
    }));
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
    client.on('message', function(raw){
      receivedMessage(client, raw);
    });
    sendInitialUpdates(client);
  });
};

database.withCollection(config, E(function(collection){
  main(collection);
}));

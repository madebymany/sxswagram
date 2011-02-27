var POLL_INTERVAL_NORMAL = 60 * 1000,
    POLL_INTERVAL_ERROR  = 5 * POLL_INTERVAL_NORMAL;

var sys          = require('sys'),
    async        = require('async'),
    config       = require('./config/config.js'),
    instagram    = require('./lib/instagram').
                     createClient(config.clientId, config.accessToken),
    people       = require('./lib/person').
                     fromUserIds(config.userIds),
    server       = require('./lib/pushserver').
                     createServer(config.port, __dirname + '/public'),
    pollInterval = POLL_INTERVAL_NORMAL,
    bulkData     = '[]';

var log = function(m) {
  sys.log(m);
  if (typeof m.stack !== 'undefined') {
    console.log(m.stack);
  }
};

server.get('/all.json', function(req, res){
  res.header('Content-Type', 'application/json');
  res.send(bulkData);
});

server.socket.on('connection', function(client){
  server.clientPool.add(client);
  client.on('disconnect', function(){
    server.clientPool.remove(client);
  });
  client.send(bulkData);
});

var regenerateBulkData = function(){
  async.map(people, function(item, done){
    done(null, item.lastUpdate);
  }, function(err, results){
    if (err) { log(err); }
    else { bulkData = JSON.stringify(results); }
  });
};

var updated = function(person){
  sys.log(['Update for', person.username].join(' '));
  server.clientPool.broadcast(JSON.stringify([person.lastUpdate]));
  regenerateBulkData();
};

var poll = function(){
  setTimeout(poll, pollInterval);
  sys.log('Polling');

  async.forEach(people, function(person, done){
    person.getLatestUpdate(instagram, function(err, res){
      if (err) {
        pollInterval = POLL_INTERVAL_ERROR;
        log(err);
      } else {
        pollInterval = POLL_INTERVAL_NORMAL;
        if (res) { updated(res); }
      }
      done();
    });
  }, function(err){
    if (err) { log(err); }
  });
};

poll();

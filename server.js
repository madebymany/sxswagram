var http      = require('http'), 
    io        = require('socket.io'),
    sys       = require('sys'),
    express   = require('express'),
    async     = require('async'),
    instagram = require('./lib/instagram'),
    person    = require('./lib/person'),
    config    = require('./config/config.js');

const POLL_INTERVAL_NORMAL = 60 * 1000,
      POLL_INTERVAL_ERROR  = 5 * POLL_INTERVAL_NORMAL;

var api = new instagram.client(config.clientId, config.accessToken);

var server = express.createServer();
server.use(express.staticProvider(__dirname + '/public'));
server.use(express.errorHandler({showStack: true, dumpExceptions: true}));

var people = [],
    bulkData = '[]';

async.map(config.users, function(item, done){
  done(null, new person.person(item));
}, function(err, results){
  people = results;
});

server.get('/all.json', function(req, res){
  res.header('Content-Type', 'application/json');
  res.send(bulkData);
});

server.get('/ping', function(req, res){
  res.send('pong');
});

server.listen(config.port);
var socket = io.listen(server);

var regenerateBulkData = function(){
  async.map(people, function(item, done){
    done(null, item.lastUpdate);
  }, function(err, results){
    if (err) {
      sys.log(err)
    } else {
      bulkData = JSON.stringify(results);
    }
  });
};

var updated = function(p){
  sys.log(['Update for', p.username].join(' '));
  push(JSON.stringify([p.lastUpdate]));
  regenerateBulkData();
};

var pollInterval = POLL_INTERVAL_NORMAL;

var poll = function(){
  sys.log('Polling');
  var i
  for (i = 0; i < people.length; i++) {
    people[i].getLatestUpdate(api, function(err, p){
      if (err) {
        pollInterval = POLL_INTERVAL_ERROR;
        sys.log(err);
      } else {
        pollInterval = POLL_INTERVAL_NORMAL;
        if (p) {
          updated(p);
        }
      }
    });
  }
  setTimeout(poll, pollInterval);
};

clients = {};

var push = function(message){
  for (key in clients) { if (clients.hasOwnProperty(key)) {
    setTimeout(function(){
      clients[key].send(message);
    }, 0);
  }}
};

socket.on('connection', function(client){
  clients[client.sessionId] = client;
  client.on('disconnect', function(){
    delete clients[client.sessionId];
  });
  client.send(bulkData);
});

poll();

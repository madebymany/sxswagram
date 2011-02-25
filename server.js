var http      = require('http'), 
    io        = require('socket.io'),
    sys       = require('sys'),
    express   = require('express'),
    async     = require('async'),
    instagram = require('./lib/instagram'),
    person    = require('./lib/person'),
    config    = require('./config/config.js');

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

var poll = function(){
  setTimeout(poll, 60000);
  var i;
  for (i = 0; i < people.length; i++) {
    people[i].getLatestUpdate(api, function(p){
      if (p) {
        updated(p);
      }
    });
  }
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
  clients[client.id] = client;
  client.on('disconnect', function(){
    delete clients[client.id];
  });
  client.send(bulkData);
});

poll();

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
server.listen(config.port);

var bulkData = '[]';
server.get('/all.json', function(req, res){
  res.header('Content-Type', 'application/json');
  res.send(bulkData);
});

var socket = io.listen(server);

var i, people = [];
for (i = 0; i < config.users.length; i++) {
  people.push(new person.person(config.users[i]));
}

var updated = function(p){
  sys.log('Update for ' + p.username);
  console.log(p.lastUpdate);
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

socket.on('connection', function(client){
  var connected = true;
  client.on('message', function(m){
    sys.log('Message received: '+m);
  });
  client.on('disconnect', function(){
    connected = false;
  });
});

poll();

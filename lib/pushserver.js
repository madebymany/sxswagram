var io        = require('socket.io'),
    express   = require('express');

exports.createServer = function(port){
  var server = express.createServer();

  server.use(express.staticProvider(__dirname + '/../public'));
  server.use(express.errorHandler({showStack: true, dumpExceptions: true}));

  server.get('/ping', function(req, res){
    res.send('pong');
  });

  server.listen(port);
  server.socket = io.listen(server);
  server.clientPool = new ClientPool();

  return server;
};

var ClientPool = function(){
  this._clients = {};
};

ClientPool.prototype.add = function(client){
  this._clients[client.sessionId] = client;
};

ClientPool.prototype.remove = function(client){
  delete this._clients[client.sessionId];
};

ClientPool.prototype.broadcast = function(message){
  var clients = this._clients;
  for (key in clients) { if (clients.hasOwnProperty(key)) {
    setTimeout(function(){
      clients[key].send(message);
    }, 0);
  }}
};

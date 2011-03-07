var io        = require('socket.io'),
    express   = require('express');

var ClientPool = function(){
  this._clients = {};
};

ClientPool.prototype.add = function(client){
  this._clients[client.sessionId] = client;
};

ClientPool.prototype.remove = function(client){
  delete this._clients[client.sessionId];
};

ClientPool.prototype.asyncSend = function(client, message){
  setTimeout(function(){
    client.send(message);
  }, 0);
};

ClientPool.prototype.broadcast = function(message){
  var clients = this._clients;
  for (var key in clients) { if (clients.hasOwnProperty(key)) {
    this.asyncSend(clients[key], message);
  }}
};

exports.createServer = function(port, publicDir){
  var server = express.createServer();

  server.use(express['static'](publicDir));
  server.use(express.errorHandler({showStack: true, dumpExceptions: true}));

  server.get('/ping', function(req, res){
    res.send('pong');
  });

  server.listen(port);
  server.socket = io.listen(server);
  server.clientPool = new ClientPool();

  return server;
};

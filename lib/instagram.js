var https       = require('https'),
    sys         = require('sys'),
    querystring = require('querystring'),
    url         = require('url');

var Client = function(clientId, accessToken){
  this._clientId = clientId;
  this._accessToken = accessToken;
  this._prefix = 'https://api.instagram.com/v1';
  return this;
};

var P = Client.prototype;

P.query = function(method, path, data, callback){
  var body = null;

  data.client_id = this._clientId;

  if (method == 'GET') {
    path = path + '?' + querystring.stringify(data);
  } else {
    body = querystring.stringify(data);
  }

  this.makeRequest(method, this._prefix + path, body, callback);
};

P.makeRequest = function(method, loc, body, callback){
  var u = url.parse(loc);

  var options = {
    host: u.hostname,
    port: u.port || 443,
    path: u.pathname + (u.search || ''),
    method: method
  };

  var chunks = [];

  var req = https.request(options, function(res){
    res.on('data', function(chunk){
      chunks.push(chunk);
    });

    res.on('end', function(){
      try {
        callback(null, JSON.parse(chunks.join('')));
      } catch(err) {
        err.context = chunks.join('');
        callback(err);
      }
    });
  });

  req.on('error', function(err) {
    callback(err);
  });

  if (body) {
    req.write(body);
  }

  req.end();
};

P.GET = function(path, data, callback){
  if (!callback) { callback = data; data = {}; }
  this.query('GET', path, data, callback);
};

P.getUser = function(userId, callback){
  this.GET('/users/' + userId, callback);
};

P.searchUser = function(q, callback){
  this.GET('/users/search', {q: q}, callback);
};

P.getUserMedia = function(userId, minId, callback){
  data = {access_token: this._accessToken};
  if (minId) {
    data.min_id = minId;
  }
  this.GET('/users/'+userId+'/media/recent', data, callback);
};

P.getNextPage = function(resultSet, callback){
  if (typeof resultSet.pagination !== 'undefined' &&
      typeof resultSet.pagination.next_url !== 'undefined') {
    this.makeRequest('GET', resultSet.pagination.next_url, null, callback);
  } else {
    callback(null, {});
  }
};

exports.createClient = function(clientId, accessToken){
  return new Client(clientId, accessToken);
};

exports.Client = Client;

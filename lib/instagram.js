var https       = require('https'),
    sys         = require('sys'),
    querystring = require('querystring'),
    url         = require('url');

var C = function(clientId, accessToken){
  this._clientId = clientId;
  this._accessToken = accessToken
  this._prefix = 'https://api.instagram.com/v1';
  return this;
};

var P = C.prototype;

P.query = function(method, path, data, callback){
  data.client_id = this._clientId;

  if (method == 'GET') {
    path = path + '?' + querystring.stringify(data);
  }

  var u = url.parse(this._prefix + path);

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
        callback(err);
      }
    });
  });

  req.on('error', function(err) {
    callback(err);
  });

  if (method != 'GET') {
    req.write(querystring.stringify(data));
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

P.getMedia = function(userId, maxId, callback){
  data = {access_token: this._accessToken};
  if (callback) {
    data.max_id = maxId;
  } else {
    callback = maxId;
  }
  this.GET('/users/'+userId+'/media/recent', data, callback);
};

exports.client = C;

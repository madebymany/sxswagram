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

var fixAPIDataRecursive = function(data){
  var keysToFix = ['id', 'created_time'];
  if (data === null || data === undefined) {
    return data;
  } else if (typeof data.map === 'function') {
    return data.map(fixAPIDataRecursive);
  } else if (typeof data === 'object') {
    return Object.keys(data).reduce(function(o, k){
      var v = data[k];
      switch (k) {
        case 'id':
        case 'created_time':
          o[k] = parseInt(v, 10);
          break;
        case 'tags':
          o[k] = (typeof v === 'string') ? v.split(/\s+/) : v;
          break;
        default:
          o[k] = fixAPIDataRecursive(v);
      }
      return o;
    }, {});
  } else {
    return data;
  }
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
        callback(null, fixAPIDataRecursive(JSON.parse(chunks.join(''))));
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

P.getUserMedia = function(userId, options, callback){
  options.access_token = this._accessToken;
  this.GET('/users/'+userId+'/media/recent', options, callback);
};

P.getNextPage = function(resultSet, callback){
  if (resultSet.hasOwnProperty('pagination') &&
      resultSet.pagination.hasOwnProperty('next_url')) {
    this.makeRequest('GET', resultSet.pagination.next_url, null, callback);
  } else {
    callback(null, {});
  }
};

exports.createClient = function(clientId, accessToken){
  return new Client(clientId, accessToken);
};

exports.Client = Client;

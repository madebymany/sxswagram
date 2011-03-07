var http   = require('http'),
    url    = require('url'),
    xml2js = require('xml2js-expat');

var Feed = function(atomUrl){
  this._url = url.parse(atomUrl);
  this._minTimestamp = 0;
};

var P = Feed.prototype;

P.setMinTimestamp = function(t){
  this._minTimestamp = t;
};

P.getLatestPosts = function(callback){
  var current    = {},
      entries    = [],
      self       = this;

  var foundEntry = function(entry){
    callback(null, entry);
    self._minTimestamp = Math.max(self._minTimestamp, entry.created_time);
  };

  var parser = new xml2js.Parser();

  parser.addListener('end', function(result) {
    result.entry.reverse().forEach(function(entry){
      var d = { 
        id: entry.id,
        type: 'blog',
        author: entry.author.name,
        title: entry.title,
        link: url.resolve(self._url, entry.link['@'].href),
        created_time: new Date(entry.published).getTime() / 1000
      };
      if (d.created_time > self._minTimestamp) {
        foundEntry(d);
      }
    });
  });

  var chunks = [];

  var options = {
    host: self._url.hostname,
    port: self._url.port || 80,
    path: self._url.pathname + (self._url.search || ''),
    method: 'GET'
  };

  var req = http.request(options, function(res){
    res.on('data', function(chunk){
      chunks.push(chunk);
    });

    res.on('end', function(){
      parser.parseString(chunks.join(''));
    });
  });

  req.end();
};

exports.Feed = Feed;

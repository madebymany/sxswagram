var person = function(userId){
  this._userId = userId;
  this._minId = 0;
  this._lastImage = null;
  this.username = null;
};

var P = person.prototype;

P.getLatestUpdate = function(client, callback){
  var self = this;
  client.getUserMedia(this._userId, this._minId, function(err, data){
    if (err) {
      sys.log(err);
      callback(null);
    }
    if (data.data.length > 0) {
      self.update(data.data, callback);
    } else {
      callback(null);
    }
  });
};

P.update = function(data, callback){
  var i, self = this;

  this._minId = data[0]['id'];

  for (i = 0; i < data.length; i++) {
    if (data[i].type == 'image') {
      self._lastImage = data[i];
      self.username = data[i].user.username;
      callback(self);
      return;
    }
  }

  callback(null);
};

exports.person = person;

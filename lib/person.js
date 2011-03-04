var Person = function(userId){
  this.userId = userId;
  this._minId = 0;
};

var P = Person.prototype;

P.getLatestUpdates = function(client, callback){
  var self = this;
  client.getUserMedia(this.userId, {min_id: this._minId, count: 100}, function(err, resultSet){
    if (err) {
      callback(err, null);
      return;
    }
    if (resultSet.hasOwnProperty('data') && resultSet.data.length > 0) {
      self.receivedUpdates(resultSet.data, callback);
    } else {
      callback(null, null);
    }
  });
};

P.setMinId = function(id){
  this._minId = id;
};

P.receivedUpdates = function(data, callback){
  this.setMinId(data[0].id);

  data.reverse().forEach(function(d){
    if (d.type == 'image') {
      callback(null, d);
    }
  });
};

exports.fromUserIds = function(userIds){
  return userIds.reduce(function(o, userId){
    o[userId] = new Person(userId);
    return o;
  }, {});
};

exports.Person = Person;

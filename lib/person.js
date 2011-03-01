var Person = function(userId){
  this._userId = userId;
  this._minId = 0;
  this._lastImage = null;
  this.username = null;
  this.profile_picture = null;
  this.lastUpdate = null;
};

var P = Person.prototype;

P.getLatestUpdate = function(client, callback){
  var self = this;
  client.getUserMedia(this._userId, this._minId, function(err, resultSet){
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

P.receivedUpdates = function(data, callback){
  var i, self = this;

  this._minId = data[0].id;

  for (i = 0; i < data.length; i++) {
    if (data[i].type == 'image') {
      self.updatePublicData(data[i]);
      callback(null, self);
      return;
    }
  }

  callback(null, null);
};

P.updatePublicData = function(entry){
  this._lastImage = entry;
  this.username = entry.user.username;
  this.lastUpdate = {
    created_at:    entry.created_time,
    username:      entry.user.username,
    profile_picture: entry.user.profile_picture,
    comment_count: entry.comments.count,
    like_count:    entry.likes.count,
    tags:          entry.tags,
    location:      entry.location,
    images:        entry.images,
    caption_text:  entry.caption ? entry.caption.text : null,
    link:          entry.link
  };
};

exports.fromUserIds = function(userIds){
  var i, result = [];
  for (i = 0; i < userIds.length; i++) {
    result.push(new Person(userIds[i]));
  }
  return result;
};

exports.Person = Person;

var person = function(userId){
  this._userId = userId;
  this._minId = 0;
  this._lastImage = null;
  this.username = null;
  this.lastUpdate = null;
};

var P = person.prototype;

P.getLatestUpdate = function(client, callback){
  var self = this;
  client.getUserMedia(this._userId, this._minId, function(err, data){
    if (err) {
      callback(err, null);
    }
    if (data.data.length > 0) {
      self.receivedUpdates(data.data, callback);
    } else {
      callback(null, null);
    }
  });
};

P.receivedUpdates = function(data, callback){
  var i, self = this;

  this._minId = data[0]['id'];

  for (i = 0; i < data.length; i++) {
    if (data[i].type == 'image') {
      self.updatePublicData(data[i]);
      callback(null, self);
      return;
    }
  }

  callback(null, null);
};

P.updatePublicData = function(data){
  this._lastImage = data;
  this.username = data.user.username;
  this.lastUpdate = {
    created_at:    data.created_time,
    username:      data.user.username,
    comment_count: data.comments.count,
    like_count:    data.likes.count,
    tags:          data.tags,
    location:      data.location,
    images:        data.images,
    caption_text:  data.caption ? data.caption.text : null,
    link:          data.link
  }
};

exports.person = person;

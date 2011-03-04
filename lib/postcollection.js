var PostCollection = function(limit){
  this._posts = [];
  this._limit = limit;
};

PostCollection.prototype.add = function(post){
  this._posts.push(post);
  this._posts = this._posts.sort(function(a, b){
    return (a.created_time < b.created_time) ? 1 : 0;
  }).slice(0, this._limit);
};

PostCollection.prototype.all = function(){
  return this._posts;
};

exports.PostCollection = PostCollection;

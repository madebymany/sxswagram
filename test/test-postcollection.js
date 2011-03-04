var common = require('./common'),
    PostCollection = require('postcollection').PostCollection;

var clone = function(o){ return o; }; //JSON.parse(JSON.stringify(o)); };

exports['should sort and remove oldest items when new one is added'] = function(test){
  pc = new PostCollection(2);
  var a = {created_time: 1299060528},
      b = {created_time: 1299060529},
      c = {created_time: 1299060527},
      d = {created_time: 1299060530};

  test.deepEqual(clone(pc.all()), []);

  pc.add(a);
  test.deepEqual(clone(pc.all()), [a]);

  pc.add(b);
  test.deepEqual(clone(pc.all()), [b, a]);

  pc.add(c);
  test.deepEqual(clone(pc.all()), [b, a]);

  pc.add(d);
  test.deepEqual(clone(pc.all()), [d, b]);

  test.done();
};

var Person = function(data){
  this.update(data);
  this.username = data.username;
  this.elementId = data.username;
};

Person.prototype.forTemplate = function(){
  var d = this.data;
  d.location_name = (d.location) ? d.location.name : null;
  d.image_url = d.images.thumbnail.url;
  d.elementId = this.elementId;
  return d;
};

Person.prototype.update = function(data){
  this.data = data;
};

var Template = function(name){
  var script = $('#' + name);
  this.template = script.html();
  this.container = script.parent();
  script.remove();
};

Template.prototype.render = function(obj){
  var html = Mustache.to_html(this.template, obj.forTemplate());
  var element = $('#'+ obj.elementId);
  if (element.length > 0) {
    element.replaceWith(html);
  } else {
    this.container.append(html);
  }
};

var UI = {
  people: {},

  receivedData: function(data){
    for (var i = 0; i < data.length; i++) {
      var un = data[i].username;
      if (UI.people[un]) {
        UI.people[un].update(data[i]);
      } else {
        UI.people[un] = new Person(data[i]);
      }
      console.log(data[i]);
      UI.template.render(UI.people[un]);
    }
  },

  connectToSocket: function(){
    var connected = false;
    const RETRY_INTERVAL = 10000;
    var timeout;

    var socket = new io.Socket();

    var retryConnection = function(){
      setTimeout(function(){
        if (!connected) {
          $.get('/ping', function(data){
            connected = true;
            window.location.href = unescape(window.location.pathname);
          });
          retryConnection();
        }
      }, RETRY_INTERVAL);
    };

    socket.on('connect', function(){
      connected = true;
      clearTimeout(timeout);
    });

    socket.on('disconnect', function(){
      connected = false;
      retryConnection();
      setTimeout(UI.connectToSocket, 5000);
    });

    socket.on('message', function(m){
      UI.receivedData($.parseJSON(m));
    });

    socket.connect();
    retryConnection();
  },

  start: function(){
    UI.template = new Template('person_template');
    UI.connectToSocket();
  }
}

$(document).ready(UI.start);

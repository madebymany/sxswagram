var Person = function(data){
  this.update(data);
  this.username = data.username;
  this.elementId = data.username;
};

Person.prototype.forTemplate = function(){
  var d = this.data;
  d.location_name = (d.location) ? d.location.name : null;
  d.image_url = d.images.thumbnail.url;
  d.element_id = this.elementId;
  d.angle = Math.floor(Math.random() * 6);
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
      UI.template.render(UI.people[un]);
    }
    UI.applyAgeEffect();
  },

  connectToSocket: function(){
    var connected = false;
    var RETRY_INTERVAL = 10000;

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

  applyAgeEffect: function(){
    var now = new Date().getTime() / 1000;
    $('.person .overlay').each(function(i, el){
      var age = now - el.getAttribute('data-timestamp');
      if (age < 0) { age = 0; }
      opacity = (age / 3600) * 0.1;
      if (opacity > 0.4) { opacity = 0.4; }
      $(el).css('opacity', opacity);
    });
  },

  repeating: function(){
    setTimeout(UI.repeating, 60000);
    UI.applyAgeEffect();
  },

  start: function(){
    UI.template = new Template('person_template');
    UI.connectToSocket();
    UI.repeating();
  }
};

$(document).ready(UI.start);

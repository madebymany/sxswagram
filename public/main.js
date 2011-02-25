var Person = function(data){
  this.update(data);
  this.username = data.username;
  this.elementId = '#' + data.username;
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
  var element = $(obj.elementId);
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
    UI.socket = new io.Socket();
    UI.socket.connect();

    setTimeout(function(){
      if (!UI.socket.connected) {
        UI.connectToSocket();
      }
    }, 5000);

    UI.socket.on('message', function(m){
      UI.receivedData($.parseJSON(m));
    });

    UI.socket.on('disconnect', function(){
      setTimeout(UI.connectToSocket, 5000);
    });
  },

  start: function(){
    UI.template = new Template('person_template');
    UI.connectToSocket();
  }
}

$(document).ready(UI.start);

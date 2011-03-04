var Update = function(data){
  this.update(data);
  this.username = data.username;
  this.elementId = data.username;
};

Update.prototype.forTemplate = function(){
  var d = this.data;
  d.location_name = (d.location) ? d.location.name : null;
  d.image_url = d.images.low_resolution.url;
  d.element_id = this.elementId;
  d.angle = Math.floor(Math.random() * 6);
  return d;
};

Update.prototype.update = function(data){
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
  updates: {},

  localTime : {
    start : function () {
      var today         = new Date(),
          localTime     = today.getTime(),
          localOffset   = today.getTimezoneOffset() * 60000,
          utc           = localTime - localOffset,
          austinOffset  = -6,
          austin        = utc + (3600000*austinOffset),
          todayInAustin = new Date(austin),
          h             = todayInAustin.getHours(),
          m             = todayInAustin.getMinutes(),
          s             = todayInAustin.getSeconds(),
          ampm          = (h > 11) ? "pm" : "am";

      if (h > 12) {
        h = h -12;
      } else if (h == 0) {
        h = 12;
      }

      m = this.check(m);
      s = this.check(s);
      $('#time time').html(h+":"+m+" "+ampm).attr('datetime', today);
      t = setTimeout('UI.localTime.start();',5000);
    },
    check : function (i) {
      if (i<10) { i="0" + i; }
      return i;
    }
  },

  meta : function (el) {
    el.each(function(){
      $('li', this).each(function(){
        var item = $(this),
            no_whitespace = item.text().replace(/^\s*|\s*$/g,'');
        if (no_whitespace.length == 0) {
          item.text('');
        }
      });
      $(this).css('opacity',0).show();
    });
    
    el.parent().hover(function(){
      var this_el = $('ul',this);
      this_el.animate({'opacity':1},{queue:false});
    }, function(){
      var this_el = $('ul',this);
      this_el.animate({'opacity':0},{queue:false});
    });
  },

  loadMore : function () {
    var win = $(window),
        load_more = $('#load_more').hide();
    // fire when user scrolls to the bottom of the page.
    win.scroll(function(){
      if  (win.scrollTop() == $(document).height() - win.height()){
        load_more.show();
        UI.loadOlder();
      }
    });
  },

  loadOlder :function () {
    // go get older posts
    t = setTimeout("$('#load_more').fadeOut();",2000);
    
  },

  loadNew : function () {
    var load_new = $('#load_new'),
        new_text = $('#new_text');
    
    load_new.animate({height:73});
    
    // Initiate loading new posts on click
    new_text.click(function(){
      $(this).parent().animate({height:0});
      $('html,body').animate({scrollTop: $("#updates").offset().top - 20},'slow');
    });
  },
	
	requestMore: function(timestamp){
		UI.socket.send('["more", '+timestamp+']'); // TODO: how do you *generate* JSON in jQuery?
	},

  receivedMessage: function(m){
		console.log(m);
	  var data = m[1];
		switch (m[0]) {
			case 'start':
				// TODO: initial fill
				break;
		  case 'new':
				// TODO: add to pool of new updates
				break;
			case 'more':
				// TODO: fill up infinite scroll
				break;
		}
		/*
    for (var i = 0; i < data.length; i++) {
      var un = data[i].username;
      if (UI.updates[un]) {
        UI.updates[un].update(data[i]);
      } else {
        UI.updates[un] = new Update(data[i]);
      }
      UI.template.render(UI.updates[un]);
    }
		*/
    UI.meta($('.update ul'));
  },

  connectToSocket: function(){
    var connected = false;
    var RETRY_INTERVAL = 10000;

    var socket = new io.Socket();
		UI.socket = socket;

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

    socket.on('message', function(raw){
      UI.receivedMessage($.parseJSON(raw));
    });

    socket.connect();
    retryConnection();
  },

  repeating: function(){
    setTimeout(UI.repeating, 60000);
    UI.meta($('.update ul'));
  },

  iDevice : {
    start : function () {
      var device = (UI.isiPad) ? 'iPad' : 'iPhone';
      $('body').addClass('portrait ' + device);
      this.setOrientation();
      window.onorientationchange = this.setOrientation;
    },
    setOrientation : function () {
      var body = $('body');
      if ( orientation == 0 || orientation == 180 ) {
        body.addClass('portrait').removeClass('landscape');
      }
      else if ( orientation == 90 || orientation == -90 ) {
        body.addClass('landscape').removeClass('portrait');
      }
    }
  },

  start: function(){
    UI.localTime.start();
    UI.template = new Template('update_template');
    UI.connectToSocket();
    UI.repeating();
    UI.meta($('.update ul'));
    UI.loadMore();
    UI.loadNew();
    //test for iPad/iPhone
    UI.isiPad    = navigator.userAgent.match(/iPad/i) != null;
    UI.isiPhone  = navigator.userAgent.match(/iPhone/i) != null;
    
    if (UI.isiPad||UI.isiPhone) { UI.iDevice.start(); }
    if (UI.isiPhone) {
      addEventListener("load", function() {
        setTimeout('window.scrollTo(0, 1)', 0);
      }, false);
    }
    
  }
};

$(document).ready(UI.start);

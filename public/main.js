var Update = function(data){
  this.data = data;
};

Update.prototype.forTemplate = function(){
  var d = this.data;
  d.location_name = (d.location) ? d.location.name : null;
  d.created_at = d.created_time;
  d.image_url = d.images.low_resolution.url;
  d.element_id = d.id;
  d.username = d.user.username;
  d.profile_picture = 'avatar_' + d.user.username + '.png';
  d.caption_text = d.caption ? d.caption.text : null;
  if (d.tags.length > 0) { d.tags = d.tags.join(' '); }
  return d;
};

var Template = function(name){
  var script = $('#' + name);
  this.template = script.html();
  this.container = script.parent();
  script.remove();
};

Template.prototype.render = function(obj,type){
  var html = $(Mustache.to_html(this.template, obj.forTemplate())).hide();
  if (type == 'new') { html.prepend('<img src=/images/latest_post.png class=latest>'); }
  (type == 'new') ? this.container.prepend(html) : this.container.append(html);
  html.fadeIn();
  UI.meta($('ul',html));
  if (!UI.isiPhone) { $('#load_more').css('visibility','hidden'); }
};

var UI = {

  //test for iPad/iPhone
  isiPad:   navigator.userAgent.match(/iPad/i) != null,
  isiPhone: navigator.userAgent.match(/iPhone/i) != null,

  updates : [],
  loading : false,

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
      var meta = $(this).css('opacity',0).show(),
          h = meta.height(),
          ih = 0;
      $('li', meta).each(function(){
        var item = $(this),
            no_whitespace = item.text().replace(/^\s*|\s*$/g,'');
        if (no_whitespace.length == 0) {
          item.text('');
        }
        ih = ih + item.height();
      });
      $('li:first', meta).css('margin-top', (h - ih) / 2);
    });
    
    var parent = el.parent();
    
    parent.hover(function(){
      show_it($('ul',this),$('.latest',this));
    }, function(){
      hide_it($('ul',this));
    });
    
    function show_it (el,latest) {
      latest.fadeOut(450, function(){ $(this).remove(); });
      el.animate({'opacity':1},{queue:false});
    }
    function hide_it (el) {
      el.animate({'opacity':0},{queue:false});
    }
  },

  loadNew : function () {
    $('#new_text').click(function(){
      $('html,body').animate({scrollTop: $("#updates").offset().top - 20},'slow');
      for (i = 0; i < UI.updates.length; i++) {
        UI.template.render(new Update(UI.updates[i]),'new');
      }
      UI.updates = [];
      $(this).parent().animate({height:0});
    });
  },

  requestMoreUpdates : function () {
    load_more = $('#load_more');
    if (UI.isiPhone) {
      load_more.text('Load older Instagrams').click(function(){
        UI.requestMore();
      });
    } else {
      load_more.css('visibility','hidden').text('Loading older Instagrams...');
      var win = $(window);
      win.scroll(function(){
        if  (win.scrollTop() == $(document).height() - win.height()){
          if (!UI.loading) {
            UI.loading == true;
            load_more.css('visibility','visible');
            UI.requestMore();
          }
        }
      });
    }
  },

  requestMore: function(timestamp){
    timestamp = (typeof timestamp == 'undefined') ? $('.update:last').attr('data-timestamp') : timestamp;
    UI.socket.send('["more", '+timestamp+']');
  },

  receivedMessage: function(m){
    var data = m[1],
        i;
    switch (m[0]) {
      case 'start':
        for (i = 0; i < data.length; i++) {
          UI.template.render(new Update(data[i]),m[0]);
        }
        break;
      case 'new':
        UI.queueUpdates(data);
        break;
      case 'more':
        for (i = 0; i < data.length; i++) {
          UI.template.render(new Update(data[i]),m[0]);
        }
        break;
    }
    UI.loading == false;
  },

  queueUpdates: function (data) {
    for (i = 0; i < data.length; i++) {
      UI.updates.push(data[i]);
    }
    $('#new_count').text(UI.updates.length);
    $('#load_new').animate({height:73});
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

      if (UI.isiPhone) {
        addEventListener("load", function() {
          setTimeout('window.scrollTo(0, 1)', 0);
        }, false);
      }
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
    
    UI.loadNew();
    UI.requestMoreUpdates();

    if (UI.isiPad||UI.isiPhone) { UI.iDevice.start(); }
    
  }
};

$(document).ready(UI.start);

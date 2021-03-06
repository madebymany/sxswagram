var UI, Update, Template;

Update = function(data){
  this.data = data;
  this.type = data.type;
};

Update.prototype.forTemplate = function(){
  var d = this.data;
  if (this.type == 'image') {
    d.location_name = (d.location) ? d.location.name : null;
    d.image_url = d.images.low_resolution.url;
    d.username = d.user.username;
    d.caption_text = d.caption ? d.caption.text : null;
    d.tags = d.tags.join(' ');
  } else if (this.type == 'blog') {
    d.username = UI.avatar_map[d.author];
    d.id = d.created_time;
    d.author = UI.name_map[d.author];
  }
  return d;
};

Template = function(name){
  var script = $('#' + name);
  this.template = script.html();
  this.container = script.parent();
  script.remove();
};

Template.prototype.render = function(obj,type){
   
  var html = Mustache.to_html(this.template, obj.forTemplate());

  html = $(html);
  
  if (type == 'new') {
    this.container.prepend(html);
    if (obj.type !== 'clock') {
      html.prepend('<img src=/images/latest_post.png class=latest>');
    }
  } else {
    this.container.append(html);
  }
  
  html.hide().fadeIn();

  if (html.hasClass('hollergram')) {
      html.append('<a class="download" target="_blank" href="http://itunes.apple.com/us/app/holler-gram/id420666439?mt=8#">Download the app</a>');
    } else {
      UI.meta($('ul',html));
    }
  if (!UI.isiPhone) { $('#load_more').css('visibility','hidden'); }
};

UI = {

  //test for iPad/iPhone
  isiPad:   !!navigator.userAgent.match(/iPad/i),
  isiPhone: !!navigator.userAgent.match(/iPhone/i),

  updates : [],
  loading : false,

  avatar_map: {
    "malbonster": "malbonster",
    "wdowen": "william",
    "stueccles": "stueccles",
    "bobbyc": "isaac",
    "scandalousT": "scandaloust",
    "mikelaurie": "mike",
    "threedaymonk": "paulb",
    "olvado": "olvado",
    "saradotdub": "saradotdub",
    "Paul Sims": "pauls",
    "ninjabiscuit": "ninjabiscuit5",
    "juxtapozed": "juxtapozed",
    "crashtherocks": "crashtherocks",
    "ohrworm": "ohrworm",
    "James Higgs": "james",
    "conordelahunty": "conordelahunty",
    "anjali28": "anjali",
    "juzmcmuz": "juzmcmuz",
    "simonianson": "simon",
    "mattwilliams": "matt",
    "Antonica Thomas-Dumont": "antonica",
    "jgsjames": "julian",
    "suttree": "duncan",
    "Sophie Bastow-Dormon": "sophie",
    "diespeker": "diespeker"
  },
  name_map : {
    "malbonster": "Tim Malbon",
    "wdowen": "William Owen",
    "stueccles": "Stuart Eccles",
    "bobbyc": "Isaac Pinnock",
    "scandalousT": "Tara Bloom",
    "mikelaurie": "Mike Laurie",
    "threedaymonk": "Paul Battley",
    "olvado": "Oli Matthews",
    "saradotdub": "Sara Williams",
    "Paul Sims": "Paul Sims",
    "ninjabiscuit": "Andy Walker",
    "juxtapozed": "Tom Harding",
    "crashtherocks": "Charlotte Hillenbrand",
    "ohrworm": "Cath Richardson",
    "James Higgs": "James Higgs",
    "conordelahunty": "Conor Delahunty",
    "anjali28": "Anjali Ramachandran",
    "juzmcmuz": "Justin McMurray",
    "simonianson": "Simon I'Anson",
    "mattwilliams": "Matt Williams",
    "Antonica Thomas-Dumont": "Antonica Thomas-Dumont",
    "jgsjames": "Julian James",
    "suttree": "Duncan Gough",
    "Sophie Bastow-Dormon": "Sophie Bastow-Dormon"
  },

  time : {
    start: function () {
      var now = new Date();
      $('#local_time time').html(UI.time.formatTimeForOffset(now, -5)).attr('datetime', now);
      $('#london_time time').html(UI.time.formatTimeForOffset(now, 0)).attr('datetime', now);
      setTimeout(UI.time.start, 5000);
    },
    formatTimeForOffset: function(time, offset){
      var browserOffset = time.getTimezoneOffset();
      var adjustedTime = new Date(time.getTime() + (offset * 60 + browserOffset) * 60000);
      var h    = ((adjustedTime.getHours() + 11) % 12) + 1,
          m    = adjustedTime.getMinutes(),
          s    = adjustedTime.getSeconds(),
          ampm = (adjustedTime.getHours() > 11) ? "pm" : "am";

      m = UI.time.zeroPad(m);
      s = UI.time.zeroPad(s);
      return h+":"+m+" "+ampm;
    },
    zeroPad: function (i) {
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
        if (no_whitespace.length === 0) {
          item.text('').remove();
        }
        ih = ih + item.height();
      });
      $('li:first', meta).css('margin-top', (h - ih) / 2);
      if ($('li', meta).length === 0) {
        meta.remove();
      }
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
    $('#load_new').show();
    $('#new_text').click(function(){
      $('html,body').animate({scrollTop: $("#updates").offset().top - 20},'slow');
      for (i = 0; i < UI.updates.length; i++) {
        UI.renderTemplate(new Update(UI.updates[i]), 'new');
      }
      UI.updates = [];
      
      if (UI.isiPhone||UI.isiPad) {
        $(this).parent().animate({left:-94});
      } else {
        $(this).parent().animate({bottom:-73});
      }
      
    });
  },

  requestMoreUpdates : function () {
    var load_more = $('#load_more').show();
    if (UI.isiPhone) {
      load_more.text('Load older Instagrams').click(function(){
        UI.requestMore();
      });
    } else {
      load_more.css('visibility','hidden').text('Loading older Instagrams...');
      var win = $(window);
      win.scroll(function(){
        if (!UI.loading) {
          if  (win.scrollTop() == $(document).height() - win.height()){
            UI.loading = true;
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
    var type = m[0], data = m[1],
        i,
        load_more = $('#load_more');
    switch (type) {
      case 'start':
        load_more.show().css('visibility','visible');
        for (i = 0, ii = data.length; i < ii; i++) {
          UI.renderTemplate(new Update(data[i]), type);
        }
        break;
      case 'new':
        UI.queueUpdates(data);
        break;
      case 'more':
        for (i = 0, ii = data.length; i < ii; i++) {
          UI.renderTemplate(new Update(data[i]), type);
        }
        break;
    }
    if (!UI.isiPhone) {load_more.css('visibility','hidden');}
    UI.loading = false;
  },

  queueUpdates: function (data) {
    for (i = 0; i < data.length; i++) {
      UI.updates.push(data[i]);
    }
    $('#new_count').text(UI.updates.length);
    if (UI.isiPhone||UI.isiPad) {
      $('#load_new').css('top',window.pageYOffset + 20).animate({left:0});
    } else {
      $('#load_new').animate({bottom:0});
    }
  },

  connectToSocket: function(){
    var connected = false;
    var RETRY_INTERVAL = 10000;
    var options = {rememberTransport: false};

    // Firefox seems to be flaky with Flash, but xhr-multipart seems to work well
    if (navigator.userAgent.match(/Firefox/)) {
      options.transports = ['xhr-multipart', 'xhr-polling', 'jsonp-polling', 'websocket', 'htmlfile'];
    } else if (navigator.userAgent.match(/MSIE/)) {
      options.transports = ['xhr-multipart', 'xhr-polling', 'jsonp-polling', 'htmlfile'];
    }

    var socket = new io.Socket(document.domain, options);
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
      $('body').addClass('iDevice portrait ' + device);
      
      this.setOrientation();
      window.onorientationchange = this.setOrientation;

      if (UI.isiPhone) {
        addEventListener("load", function() {
          setTimeout(function(){window.scrollTo(0, 1);}, 0);
        }, false);
      }
    },
    setOrientation : function () {
      var body = $('body');
      if (orientation % 180 === 0) {
        body.addClass('portrait').removeClass('landscape');
      } else {
        body.addClass('landscape').removeClass('portrait');
      }
    }
  },

  renderTemplate: function(update, type){
    UI.templates[update.type].render(update, type);
  },

  start: function(){
    UI.time.start();
    UI.templates = {
      'image': new Template('image_template'),
      'blog': new Template('blog_template'),
      'clock': new Template('clock_template')
    };
    UI.connectToSocket();
    UI.repeating();
    
    UI.loadNew();
    UI.requestMoreUpdates();

    if (UI.isiPad||UI.isiPhone) { UI.iDevice.start(); }
    
  }
};

$(document).ready(UI.start);

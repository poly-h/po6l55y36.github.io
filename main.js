window.addEventListener('load', setting);

var canvas;
var cWidth = 500;
var cHeight = 640;
var whrate = cWidth / cHeight;
var images = {};
var time = 0;
var delta = 0;
// 0:title, 1:play, 2:gameover, 3:clear
var scene = 0;

var mzut = (function() {
  var x;
  var y;
  var size;
  var vx;
  var hp;
  var destrotime;
  return {
    init : function() {
      x = 0;
      y = 60;
      size = 24;
      vx = size/8;
      hp = 1;
      destrotime = 0;
    },
    draw : function(c) {
      if(hp > 0)
        drawImage(c, "mzut", x-size/2, y-size/2, size, size);
      if(hp <= 0 && destrotime < 2) {
        rgba(c, 250, 20, 0, 0.9);
        var exr = 20 + 100 * Math.abs(Math.sin(destrotime * Math.PI * 3 / 2));
        c.beginPath();
        c.arc(x, y, exr, 0, Math.PI*2, false);
        c.fill();
      }
    },
    update : function() {
      if(key.get(keyLeft) && x > -100 + size / 2 && hp > 0) {
        x -= vx;
      }
      if(key.get(keyRight) && x < 100 - size / 2 && hp > 0) {
        x += vx;
      }
      if(hp <= 0) {
      if(destrotime > 0.1) {
        fo.destroy();
      }
        destrotime += delta;
        if(destrotime > 3.0) {
          scene = 2;
        }
      }
    },
    shape : function() {
      var po = {};
      po.x = x;
      po.y = y;
      po.size = size/2;
      return po;
    },
    damage : function() {
      hp--;
    }
  }
})();

var honkan = (function() {
  var explodetime;
  var x;
  var y;
  var width;
  var height;
  var dx;
  var dy;
  var hp;
  var destrotime;
  return {
    init : function() {
      explodetime = 0;
      x = 0;
      y = -30;
      width = 180;
      height = width / 5 * 4;
      dx = 0;
      dy = 0;
      hp = 200;
      destrotime = 0;
    },
    draw : function(c) {
      if(destrotime < 0.5)
        drawImage(c, "honkan", x-width/2+dx, y-height/2+dy, width, height);
      if(hp <= 0 && destrotime < 2) {
        rgba(c, 250, 20, 0, 0.9);
        var exr = 50 + 400 * Math.abs(Math.sin(destrotime * Math.PI));
        c.beginPath();
        c.arc(x, y, exr, 0, Math.PI*2, false);
        c.fill();
      }
    },
    update : function() {
      if(explodetime > 0) {
        explodetime -= delta;
        var mag = explodetime * explodetime * 20 / (hp) * 40 * 5;
        dx = (Math.random() - 0.5) * mag;
        dy = (Math.random() - 0.5) * mag;
      } else {
        explodetime = 0;
        dx = 0;
        dy = 0;
      }
      if(hp <= 0) {
        destrotime += delta;
        if(destrotime > 0.1) {
          fo.destroy();
        }
        if(destrotime > 3.0) {
          scene = 3;
        }
      }
    },
    setExtime : function() {
      explodetime = 0.3;
      hp--;
    }
  }
})();

var foccatio = function(x1, y1, vx1, vy1){
  var x = x1;
  var y = y1;
  var vx = vx1;
  var vy = vy1;
  var r = 12;
  var dead = false;
  var explode = false;
  var explodetime = 0;
  var collision = function() {
    var dist = (x-mzut.shape().x)*(x-mzut.shape().x) + (y-mzut.shape().y)*(y-mzut.shape().y);
    return (dist < (r+mzut.shape().size)*(r+mzut.shape().size));
  };
  return {
    draw : function(c) {
      if(explodetime < 0.01)
        drawImage(c, "foccatio", x - r, y - r, r*2, r*2);
      if(explode) {
        rgba(c, 250, 20, 0, 0.8);
        var exr = r/2 + r * Math.abs(Math.sin(explodetime * Math.PI /6*10));
        c.beginPath();
        c.arc(x, y, exr, 0, Math.PI*2, false);
        c.fill();
      }
    },
    update : function() {
      if(!explode) {
        x += vx;
        y += vy;
      }
      if(y < 30 && !explode) {
        explode = true;
        honkan.setExtime();
      }
      if(explode) {
        explodetime += delta;
      }
      if(explodetime > 0.6) {
        dead = true;
      }
      if(collision() && !explode) {
        mzut.damage();
      }
    },
    destroy : function() {
      explode = true;
    },
    getDead : function() {
      return dead;
    }
  }
}

var fo = (function() {
  var list = [];
  var spawnwait = 0.3;
  return {
    generate : function(x, y, vx, vy) {
      list.push(foccatio(x, y, vx, vy));
    },
    destroy : function() {
      list.forEach(function(value){
        value.destroy();
      });
    },
    draw : function(c) {
      list.forEach(function(value){
        value.draw(c);
      });
    },
    update : function(){
      spawnwait -= delta;
      if(spawnwait < 0) {
        fo.generate(Math.random()*400-200, 600, Math.random() - 0.5, -0.2 - Math.random()*4);
        spawnwait = Math.random() * 0.3 + 0.1
      }

      var newList = [];
      list.forEach(function(value){
        value.update();
        if(!value.getDead()) {
          newList.push(value);
        }
      });
      list = newList;
    }
  }
})();
var key = (function() {
  var state = [];
  return {
    get : function(e) {
      return state[e];
    },
    set : function(e, b) {
      state[e] = b;
    }
  }
})();
var keySpace = 32;
var keyLeft = 37;
var keyUp = 38;
var keyRight = 39;
var keyDown = 40;
document.onkeyup = function(e) {
  key.set(e.keyCode, false);
}
document.onkeydown = function(e) {
  key.set(e.keyCode, true);
}


function drawImage(c, img, x, y, width, height) {
  c.transform(1, 0, 0, -1, 0, 0);
  c.drawImage(images[img], x, -y-height, width, height);
  c.transform(1, 0, 0, -1, 0, 0);
}

function loadImage(path, name) {
  images[name] = new Image();
  images[name].src = "img/" + path;
}

function rgba(c, r, g, b, a) {
  c.fillStyle = "rgba(" + r + ", " + g + ", " + b + ", " + a +")";
}

function rgb(c, r, g, b) {
  c.fillStyle = "rgb(" + r + ", " + g + ", " + b + ")";
}

function setting() {
  var ctx = document.getElementById('maincanvas');
  canvas = ctx.getContext('2d');
  ctx.width = cWidth;
  ctx.height = cHeight;
  loadImage("mzut.png", "mzut");
  loadImage("foccatio.png", "foccatio");
  loadImage("honkan.png", "honkan");
  loadImage("haikei.png", "haikei");
  loadImage("title.png", "title");
  loadImage("pressspace.png", "next");
  loadImage("gameclear.png", "clear");
  loadImage("gameover.png", "over");
  requestAnimationFrame(update);

  init();
}

function init() {
  honkan.init();
  mzut.init();
}

function update(timestamp) {
  delta = timestamp / 1000 - time;
  time = timestamp / 1000;

  render(canvas);
  requestAnimationFrame(update);

  mzut.update();
  honkan.update();
  if(scene == 0) {
    if(key.get(keySpace))
      scene = 1;
  }
  if(scene == 1) {
    fo.update();
  }
  if(scene == 2) {
    if(key.get(keySpace)) {
      scene = 0;
      key.set(keySpace, false);
      init();
    }
  }
  if(scene == 3) {
    if(key.get(keySpace)) {
      scene = 0;
      key.set(keySpace, false);
      init();
    }
  }
}

function render(c) {
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, canvas.width, canvas.height);
  c.fillStyle = 'rgb(0, 0, 0)';
  c.fillRect(0, 0, cWidth, cHeight);
  c.transform(cWidth/200, 0, 0, -cWidth/200, cWidth/2, cHeight);
  drawImage(c, "haikei", -100, 0, 200, 256);

  mzut.draw(c);
  honkan.draw(c);
  if(scene == 0){
    drawImage(c, "title", -95-Math.cos(time*2)*3, Math.sin(time*2)*5+10, 200+Math.cos(time*2)*6, 240);
    drawImage(c, "next", -10, 15+Math.sin(time*4.2)*5, 100, 20);
    c.translate(-64, 200);
    c.rotate(time*2);
    drawImage(c, "foccatio", -25, -25, 50, 50);
    c.rotate(-time*2);
    c.translate(64, 200);
  }
  if(scene == 1)
    fo.draw(c);
  if(scene == 2) {
    drawImage(c, "over", -100, 0, 200, 256);
    drawImage(c, "next", -10, 15+Math.sin(time*4.2)*5, 100, 20);
  }
  if(scene == 3){
    drawImage(c, "clear", -100, 0, 200, 256);
    drawImage(c, "next", -10, 15+Math.sin(time*4.2)*5, 100, 20);
  }
  // c.fillStyle = 'rgb(38, 69, 235)';
  // c.fillRect(-20, 0, 40, 40);
}

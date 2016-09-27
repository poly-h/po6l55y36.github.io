window.addEventListener('load', setting);

var canvas;
var cWidth = 500;
var cHeight = 640;
var whrate = cWidth / cHeight;
var images = {};
var time = 0;
var fps = 60;
var delta = 1/fps;
// 0:title, 1:play, 2:gameover, 3:clear
var scene = 0;
var gdr = 0;

var mzut = (function() {
  var x;
  var y;
  var size;
  var vx;
  var hp;
  var destrotime;
  var destroyed;
  return {
    init : function() {
      x = 0;
      y = 60;
      size = 24;
      vx = size/8;
      hp = 1;
      destrotime = 0;
      destroyed = false;
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
        if(!destroyed) {
          destroyed = true;
          exps.add(x, y, 100, 20, 2, 3);
          gdr = 100;
        }
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
    },
    setX : function(x1) {
      x = x1;
    },
    getSize : function() {
      return size;
    },
    getV : function() {
      return vx;
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
  var destroyed;
  return {
    init : function() {
      explodetime = 0;
      x = 0;
      y = -30;
      width = 180;
      height = width / 5 * 4;
      dx = 0;
      dy = 0;
      hp = 1200;
      destrotime = 0;
      destroyed = false;
    },
    draw : function(c) {
      if(destrotime < 0.5)
        drawImage(c, "honkan", x-width/2+dx, y-height/2+dy, width, height);
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
        if(!destroyed) {
          destroyed = true;
          exps.add(x, y, 400, 50, 2, 2);
          gdr = 200;
        }
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

var foccatio = function(f){
  var x = f(0).x;
  var y = f(0).y;
  var t = 0;
  var r = 12;
  var dead = false;
  var explode = false;
  var explodetime = 0;
  var rotate = Math.random() * 10;
  var collision = function(x, y, r) {
    var dist = (x-mzut.shape().x)*(x-mzut.shape().x) + (y-mzut.shape().y)*(y-mzut.shape().y);
    return (dist < (r+mzut.shape().size*0.5)*(r+mzut.shape().size*0.5));
  }
  return {
    draw : function(c) {
      if(explodetime < 0.01){
        c.translate(x, y);
        c.rotate(time*rotate);
        drawImage(c, "foccatio", -r, -r, r*2, r*2);
        c.rotate(-time*rotate);
        c.translate(-x, -y);
      }
    },
    update : function() {
      t += delta;
      if(!explode) {
        x = f(t).x;
        y = f(t).y;
      }
      if(y < fo.ylimit && !explode) {
        explode = true;
        honkan.setExtime();
        exps.add(x, y, r, r*2/3, 0.6, 1);
      }
      if(explode) {
        explodetime += delta;
      }
      if(explodetime > 0.6) {
        dead = true;
      }
      if(collision(x, y, r) && !explode) {
        mzut.damage();
      }
    },
    destroy : function() {
      explode = true;
      exps.add(x, y, r, r*2/3, 0.6, 1);
    },
    getDead : function() {
      return dead;
    },
    collision : collision
  }
}

var fo = (function() {
  var list;
  var spawnwait;
  var mzutorbit;
  var t;
  var dmzut;
  var mzutwait
  function fall(x, tlimit) {
    return function(t) {
      return {
        x : x,
        y : 390 + (fo.ylimit - 390) * t / tlimit
      }
    }
  }
  function line(x, tlimit, x1) {
    var v = Math.sqrt((x-x1)*(x-x1)+360*360)/tlimit;
    console.log(v);
    return function(t) {
      return {
        x : x + (x1 - x) * t / tlimit,
        y : 390 + (fo.ylimit - 390) * t / tlimit
      }
    }
  }
  function bezier2(x, tlimit, x1, y1, x2) {
    return function(t) {
      var t1 = t / tlimit;
      return {
        x : (1-t1)*(1-t1)*x + 2*(1-t1)*t1*x1 + t1*t1*x2,
        y : (1-t1)*(1-t1)*390 + 2*(1-t1)*t1*y1 + t1*t1*fo.ylimit
      }
    }
  }
  function bezier(x, tlimit, x1, y1, x2, y2, x3) {
    return function(t) {
      var t1 = t / tlimit;
      return {
        x : (1-t1)*(1-t1)*(1-t1)*x + 3*(1-t1)*(1-t1)*t1*x1 + 3*(1-t1)*t1*t1*x2 + t1*t1*t1*x3,
        y : (1-t1)*(1-t1)*(1-t1)*390 + 3*(1-t1)*(1-t1)*t1*y1 + 3*(1-t1)*t1*t1*y2 + t1*t1*t1*fo.ylimit
      }
    }
  }

  return {
    ylimit : 30,
    init : function() {
      list = [];
      spawnwait = 0.3;
      mzutorbit = [0];
      dmzut = 0;
      mzutwait = 0;
      for(var i = 1; i < fps*16; i++) {
        if(mzutwait < 0) {
          dmzut = mzut.getV() * (Math.floor(Math.random()*3)-1) * 0.5;
          mzutwait = Math.random()*0.2+0.1;
        }
        mzutwait -= delta;
        if(mzutorbit[i-1] + dmzut < -100+mzut.getSize()/2 || mzutorbit[i-1] + dmzut > 100-mzut.getSize()/2) {
          dmzut = -dmzut;
        }
        mzutorbit[i] = mzutorbit[i-1] + dmzut;
      }
      t = 0;
    },
    generate : function(tlimit) {
      // tlimit = Math.random() * Math.random() * 15.4 + 0.6;
      var flag = 0;
      if(Math.random() < 0.2){
        flag = 0;
      } else if(Math.random() < 0.5) {
        flag = 1;
      } else if(Math.random() < 0.4) {
        flag = 2;
      } else {
        flag = 3;
      }
      var max = -100000000;
      var min = 100000000;
      var po = 0.8;
      for(var i = Math.floor(tlimit * po * fps); i < tlimit * fps; i++) {
        max = Math.max(max, mzutorbit[i]);
        min = Math.min(min, mzutorbit[i]);
      }
      max += 26;
      min -= 26;
      var chakudan;
      var spawnx;
      if(Math.random() < 0.5) {
        chakudan = Math.random()*(min+120)-120;
        spawnx = Math.random()*(min+120)-120;
      } else {
        chakudan = Math.random()*(120-max)+max;
        spawnx = Math.random()*(120-max)+max;
      }
      // var chakudan = Math.random()*(240-(max-min))-120;
      // var spawnx = Math.random()*(120+min) - 120;
      // if(chakudan > min) {
      //   chakudan += max - min;
      //   spawnx = Math.random()*(120-max)+max;
      // }
      if(flag == 0) {
        list.push(foccatio(fall(chakudan, tlimit)));
      } else if(flag == 1) {
        var dsx = spawnx - chakudan;
        list.push(foccatio(line(chakudan + dsx * 1/(1-po), tlimit, chakudan)));
      } if(flag == 2) {
        list.push(foccatio(bezier2(Math.random()*240-120, tlimit, spawnx, 100+Math.random()*20, chakudan)));
      } else {
        list.push(foccatio(bezier(Math.random()*240-120, tlimit, Math.random()*240-120, Math.random()*180+100, spawnx, 100+Math.random()*20, chakudan)));
      }
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
      // mzut.setX(mzutorbit[0]);
      t += delta;
      spawnwait -= delta;
      if(spawnwait < 0) {
        // fo.generate(Math.random()*400-200, 600, Math.random() - 0.5, -0.2 - Math.random()*4);
        var tlimit = Math.random() * 15.4 + 0.6;
        fo.generate(tlimit);
        spawnwait = (Math.random() * 0.25 + 0.12)/16*tlimit;
      }

      var newList = [];
      list.forEach(function(value){
        value.update();
        if(!value.getDead()) {
          newList.push(value);
        }
      });
      list = newList;
      mzutwait -= delta;
      for(var i = 1; i < fps*16; i++) {
        mzutorbit[i-1] = mzutorbit[i];
      }
      if(mzutwait < 0) {
        dmzut = mzut.getV() * (Math.floor(Math.random()*3)-1) * 0.5;
        mzutwait = Math.random()*0.2+0.1;
      }
      if(mzutorbit[fps*16-2] + dmzut < -100+mzut.getSize()/2 || mzutorbit[fps*16-2] + dmzut > 100-mzut.getSize()/2) {
        dmzut = -dmzut;
      }
      mzutorbit[fps*16-1] = mzutorbit[fps*16-1] + dmzut;
    }
  }
})();

var explosion = function(x1, y1, r1, minr1, t1, n1) {
  var x = x1;
  var y = y1;
  var r = r1;
  var minr = minr1;
  var timelimit = t1;
  var n = n1;
  var t = 0;
  return {
    draw : function(c) {
      rgba(c, 250, 20, 0, 0.8);
      var exr = minr + r * Math.abs(Math.sin(t / timelimit * Math.PI * n));
      c.beginPath();
      c.arc(x, y, exr, 0, Math.PI*2, false);
      c.fill();
    },
    update : function() {
      t += delta;
    },
    getDead : function() {
      return (t > timelimit);
    }
  }
}
var exps = (function() {
  var list = [];
  return {
    add : function(x1, y1, r1, minr1, t1, n1) {
      list.push(explosion(x1, y1, r1, minr1, t1, n1));
    },
    draw : function(c) {
      list.forEach(function(value){
        value.draw(c);
      });
    },
    update : function(){
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
  fo.init();
}

function update(timestamp) {
  delta = timestamp / 1000 - time;
  time = timestamp / 1000;

  gdr *= 0.95;
  if(gdr < 0.01) {
    gdr = 0;
  }

  render(canvas);
  requestAnimationFrame(update);

  mzut.update();
  honkan.update();
  exps.update();
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
  var gdx = (Math.random() - 0.5) * 2 * gdr;
  var gdy = (Math.random() - 0.5) * 2 * gdr;
  c.transform(cWidth/200, 0, 0, -cWidth/200, cWidth/2 + gdx, cHeight + gdy);
  drawImage(c, "haikei", -100, 0, 200, 256);

  mzut.draw(c);
  honkan.draw(c);
  exps.draw(c);
  if(scene == 0){
    drawImage(c, "title", -95-Math.cos(time*2)*3, Math.sin(time*2)*5+10, 200+Math.cos(time*2)*6, 240);
    drawImage(c, "next", -10, 15+Math.sin(time*4.2)*5, 100, 20);
    c.translate(-64, 200);
    c.rotate(time*2);
    drawImage(c, "foccatio", -25, -25, 50, 50);
    c.rotate(-time*2);
    c.translate(64, -200);
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

window.addEventListener('load', setting);

var canvas;
var video = {};
var images = {};
var lastx = 0;
// var audio = {};
var cWidth = 500;
var cHeight = 640;
var whrate = cWidth / cHeight;
var time = 0;
var fps = 60;
var delta = 1/fps;
// 0:title, 1:play, 2:gameover, 3:clear
var scene = -1;
var level = 1;
var lvLabel = "normal";
var mzutmode = false;
var mzutmodewait = 0;
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
      x = lastx;
      y = 60;
      size = 24;
      vx = size/8;
      hp = 1;
      destrotime = 0;
      destroyed = false;
    },
    draw : function(c) {
      if(hp > 0) {
        var s = "koushou";
        if(mzutmodewait > 0.5){
          s = "mzut";
        }
        var csize = size * Math.cos(Math.PI/(mzutmodewait-0.5));
        drawImage(c, s, x-csize/2, y-size/2, csize, size);
      }
      if(hp <= 0 && destrotime < 2) {
        rgba(c, 250, 20, 0, 0.9);
        var exr = 20 + 100 * Math.abs(Math.sin(destrotime * Math.PI * 3 / 2));
        c.beginPath();
        c.arc(x, y, exr, 0, Math.PI*2, false);
        c.fill();
      }
    },
    update : function() {
      if(left && x > -100 + size / 2 && hp > 0) {
        x -= vx;
      }
      if(right && x < 100 - size / 2 && hp > 0) {
        x += vx;
      }
      if(hp <= 0) {
        if(!destroyed) {
          destroyed = true;
          exps.add(x, y, 100, 20, 2, 3, false);
          // audio.mzut.play();
          gdr = 100;
        }
        if(destrotime < 1.5) {
          if(Math.random() < 0.4) {
            exps.add(x+(Math.random()-0.5)*200, y+(Math.random()-0.5)*200, 50, 10, 0.5, 1, false);
            gdr += 10;
          }
        }
        if(destrotime > 0.1) {
          fo.destroy();
        }
        destrotime += delta;
        if(destrotime > 2.0 && destrotime < 3) {
          scene = 1+delta/5;
          destrotime = 4;
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
      if(scene == 1)
        hp--;
    },
    setX : function(x1) {
      x = x1;
    },
    getV : function() {
      return vx;
    },
    isLiving : function() {
      return hp > 0;
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
      maxHp = 120*level - Math.pow(2, -level)*70;
      hp = maxHp;
      destrotime = 0;
      destroyed = false;
    },
    draw : function(c) {
      if(destrotime < 0.5){
        drawImage(c, "honkan", x-width/2+dx, y-height/2+dy, width, height);
        c.globalAlpha = explodetime * explodetime;
        drawImage(c, "honkanred", x-width/2+dx, y-height/2+dy, width, height);
        c.globalAlpha = 1;
      }
    },
    update : function() {
      if(explodetime > 0) {
        explodetime -= delta;
        var mag = explodetime * explodetime * 6 / hp * maxHp;
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
          fo.destroy();
          exps.add(x, y, 800, 50, 2, 0.5, true);
          gdr = 500;
        }
        if(destrotime > 0.1) {
          fo.destroy();
        }
        if(destrotime > 1.0 && destrotime < 3.0) {
          scene = 2+delta;
          video.exp.play();
          destrotime = 5.0;
        }
      }
    },
    setExtime : function() {
      explodetime = 0.5;
      if(scene == 1)
        hp--;
    },
    getHp : function() {
      return hp;
    },
    getMaxHp : function() {
      return maxHp;
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
        exps.add(x, y, r, r*2/3, 0.6, 1, false);
        // audio.focca.play();
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
      if(!explode) {
        explode = true;
        exps.add(x, y, r, r*2/3, 0.6, 1, false);
      }
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
  var mzutwait;
  function fall(x, tlimit) {
    return function(t) {
      return {
        x : x,
        y : 390 + (fo.ylimit - 390) * t / tlimit
      }
    }
  }
  function line(x, tlimit, x1) {
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
    init : function(x) {
      list = [];
      spawnwait = 0.3;
      mzutorbit = [x];
      dmzut = 0;
      mzutwait = 0;
      for(var i = 1; i < fps*16; i++) {
        if(mzutwait < 0) {
          dmzut = mzut.getV() * (Math.floor(Math.random()*3)-1) * 0.5;
          mzutwait = Math.random()*0.2+0.1;
        }
        mzutwait -= delta;
        if(mzutorbit[i-1] + dmzut < -100+mzut.shape().size || mzutorbit[i-1] + dmzut > 100-mzut.shape().size) {
          dmzut = -dmzut;
        }
        mzutorbit[i] = mzutorbit[i-1] + dmzut;
      }
      t = 0;
    },
    generate : function(tlimit) {
      var flag = 0;
      var rand = Math.random() * Math.min((level+1)/3);
      if(rand < 0.2){
        flag = 0;
      } else if(rand < 0.4) {
        flag = 1;
      } else if(rand < 0.65) {
        flag = 2;
      } else {
        flag = 3;
      }
      var max = -80;
      var min = 80;
      var po1 = 4/5;
      // if(flag >= 1)
      //   po1 = 2/3;
      var po2 = 1;
      for(var i = Math.floor(tlimit * po1 * fps); i <= tlimit * fps * po2 && i < 16 * fps; i++) {
        max = Math.max(max, mzutorbit[i]);
        min = Math.min(min, mzutorbit[i]);
      }
      max += 30;
      min -= 30;
      if(flag >= 1) {
        max += 5;
        min -= 5;
      }
      var chakudan;
      var midx;
      var spawnx;
      if(Math.random() < (min+200)/(400-(max-min))) {
        chakudan = (1-Math.pow(Math.random(), Math.max(60/(max-min), 2)))*(min+120)-120;
        midx = Math.random()*(min+120)-120;
      } else {
        chakudan = Math.pow(Math.random(), Math.max(60/(max-min), 2))*(120-max)+max;
        midx =Math.random()*(120-max)+max;
      }
      spawnx = Math.sign(Math.random()-0.5)*(Math.random()-0.5)*(Math.random()-0.5)*4*400;

      if(flag == 0) {
        list.push(foccatio(fall(chakudan, tlimit)));
      } else if(flag == 1) {
        var dsx = midx - chakudan;
        list.push(foccatio(line(chakudan + dsx * po2/(po2-po1), tlimit, chakudan)));
      } else if(flag == 2) {
        list.push(foccatio(bezier2(Math.random()*240-120, tlimit, midx, 100+Math.random()*20, chakudan)));
      } else {
        list.push(foccatio(bezier(Math.random()*240-120, tlimit, spawnx, 270+(Math.random()-0.5)*30, midx, 150+(Math.random()-0.5)*30, chakudan)));
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
        var rand = Math.random();
        var mint = 2.0/(level+1) + 0.4;
        // var t = 8/(level*level*2+1);
        var t = 1.0/(1+level)+0.2;
        // var tlimit = rand*(rand*rand+t*rand+t)/(1+2*t)*(16-mint) + mint;
        var tlimit = Math.pow(1-Math.pow(1-rand, t), 1/t)*(12+4/(1+level)-mint) + mint;
        fo.generate(tlimit);
        spawnwait = (Math.random() * 0.3 + 0.1)*tlimit/(1.5+level*level*1.5);
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
        dmzut = mzut.getV() * (Math.floor(Math.random()*3)-1) * 0.4;
        mzutwait = Math.random()*0.2+0.1;
      }
      if(mzutorbit[fps*16-2] + dmzut < -100+mzut.shape().size || mzutorbit[fps*16-2] + dmzut > 100-mzut.shape().size) {
        dmzut = -dmzut;
      }
      mzutorbit[fps*16-1] = mzutorbit[fps*16-1] + dmzut;
    }
  }
})();

var explosion = function(x1, y1, r1, minr1, t1, n1, honkan) {
  var x = x1;
  var y = y1;
  var r = r1;
  var minr = minr1;
  var timelimit = t1;
  var n = n1;
  var t = 0;
  return {
    draw : function(c) {
      if(honkan)
        rgba(c, Math.floor(250+5*t), Math.floor(20+235*t), Math.floor(0+255*t), 0.8+0.2*t);
      else
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
    add : function(x1, y1, r1, minr1, t1, n1, h) {
      list.push(explosion(x1, y1, r1, minr1, t1, n1, h));
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
var keyEnter = 13;
var keyLeft = 37;
var keyUp = 38;
var keyRight = 39;
var keyDown = 40;
var keyA = 65;
var keyW = 87;
var keyD = 68;
var keyS = 83;
var keyR = 82;
var keyM = 77;
var keyZ = 90;
var keyU = 85;
var keyT = 84;
var keyC = 67;

var left = false;
var right = false;
var up = false;
var down = false;
var enter = false;

var mzucJudge = 0;
document.onkeyup = function(e) {
  key.set(e.keyCode, false);
}
document.onkeydown = function(e) {
  key.set(e.keyCode, true);
  switch(mzucJudge) {
    case 0:
      if(key.get(keyM)) {
        mzucJudge++;
      }
      break;
    case 1:
      if(key.get(keyZ)) {
        mzucJudge++;
      } else if(!key.get(keyM)) {
        mzucJudge = 0;
      }
      break;
    case 2:
      if(key.get(keyU)) {
        mzucJudge++;
      } else if(!key.get(keyZ)) {
        mzucJudge = 0;
      }
      break;
    case 3:
      if(key.get(keyT) || key.get(keyC)) {
        if(mzutmodewait == 0) {
          mzutmode = true;
          mzutmodewait += delta;
        } else if(mzutmodewait == 1) {
          mzutmode = false;
          mzutmodewait -= delta;
        }
      } else if(!key.get(keyU)) {
        mzucJudge = 0;
      }
      break;
    default:
      break;
  }
}


function drawImage(c, img, x, y, width, height) {
  c.transform(1, 0, 0, -1, 0, 0);
  c.drawImage(images[img], x, -y-height, width, height);
  c.transform(1, 0, 0, -1, 0, 0);
}

function drawVideo(c, v, x, y, width, height) {
  c.transform(1, 0, 0, -1, 0, 0);
  c.drawImage(video[v], x, -y-height, width, height);
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
  loadImage("koushou.png", "koushou");
  loadImage("mzut.png", "mzut");
  loadImage("foccatio.png", "foccatio");
  loadImage("honkan.png", "honkan");
  loadImage("honkanred.png", "honkanred");
  loadImage("haikei.png", "haikei");
  loadImage("title2.png", "title");
  loadImage("pressspace.png", "next");
  loadImage("gameclear.png", "clear");
  loadImage("gameover.png", "over");
  loadImage("easy.png", "easy");
  loadImage("normal.png", "normal");
  loadImage("hard.png", "hard");
  requestAnimationFrame(update);

  video.exp = document.getElementById("explosion");
  video.exp.playbackRate = video.exp.duration/5.0;
  // audio.mzut = document.getElementById("mzutburst");
  // audio.focca = document.getElementById("foccaburst");

  init();
}

function init() {
  scene = -1;
  level = 1;
  honkan.init();
  mzut.init();
  fo.init(0);
  video.exp.pause();
  video.exp.currentTime = 0;
}

function update(timestamp) {
  delta = timestamp / 1000 - time;
  time = timestamp / 1000;

  if(key.get(keySpace) || key.get(keyEnter)) {
    enter = true;
  } else {
    enter = false;
  }
  if(key.get(keyLeft) || key.get(keyA)) {
    left = true;
  } else {
    left = false;
  }
  if(key.get(keyUp) || key.get(keyW)) {
    up = true;
  } else {
    up = false;
  }
  if(key.get(keyRight) || key.get(keyD)) {
    right = true;
  } else {
    right = false;
  }
  if(key.get(keyDown) || key.get(keyS)) {
    down = true;
  } else {
    down = false;
  }

  gdr *= 0.96;
  if(gdr < 0.01) {
    gdr = 0;
  }

  render(canvas);
  requestAnimationFrame(update);

  mzut.update();
  honkan.update();
  exps.update();
  if(scene < 0) {
    if(scene + delta*2 >= 0)
      scene = 0;
    else
      scene += delta*2;
  } else if(scene == 0) {
    if(mzut.shape().x < -30) {
      level = 0.6;
      lvLabel = "easy";
    } else if(-30 <= mzut.shape().x && mzut.shape().x < 30) {
      level = 0.9;
      lvLabel = "normal";
    } else {
      level = 2.4;
      lvLabel = "hard";
    }
    if(mzutmode)
      level *= 8.10;
    honkan.init();

    if(mzutmode && mzutmodewait < 1) {
      mzutmodewait += delta;
      if(mzutmodewait >= 1)
        mzutmodewait = 1;
    } else if(!mzutmode && mzutmodewait > 0) {
      mzutmodewait -= delta;
      if(mzutmodewait <= 0)
        mzutmodewait = 0;
    }

    if(enter && (mzutmodewait == 1 || mzutmodewait == 0)) {
      scene += delta*2;
      fo.init(mzut.shape().x);
    }
  } else if (scene < 1) {
    if(scene + delta*2 >= 1){
      scene = 1;
      lastx = mzut.shape().x;
    } else
      scene += delta*2;
  } else if(scene == 1) {
    fo.update();
  } else if(scene < 2) {
    if(enter) {
      scene = 2 - delta*2;
    }

    if(scene + delta/2 >= 2)
      scene = 2;
    else
      scene += delta/2;
  } else if(scene == 2) {
    if(enter) {
      scene = -1;
      init();
    }
  } else if(scene < 3) {
    if(scene + delta/5 >= 3)
      scene = 3;
    else
      scene += delta/5;
  } else if(scene == 3) {
    if(enter) {
      scene = -1;
      init();
    }
  }

  if(key.get(keyR)) {
    init();
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

  honkan.draw(c);

  if(scene < 1) {
    var easing = Math.sign(scene)*scene*scene;
    var a = 0.9 * (1-Math.abs(easing));
    var easing2 = (2*scene-1)*(2*scene-1);
    var size = 10*(1-easing2);
    if(lvLabel == "easy") {
      c.globalAlpha = 0.25 * a;
      drawImage(c, "hard", 15, 40, 80, 40);
      drawImage(c, "normal", -40, 40, 80, 40);
      if(scene < 0.5) {
        c.globalAlpha = easing2;
        c.strokeStyle = "rgb(255, 255, 255)";
        c.strokeRect(-95-size*0.5, 40-size*0.5, 80+size, 40+size);
        if(scene < 0)
          c.globalAlpha = a;
        else
          c.globalAlpha = 0.9*Math.pow(Math.cos(Math.PI*scene/0.25), 2);
        drawImage(c, "easy", -95, 40, 80, 40);
      } else {
        c.globalAlpha = 0.9;
        drawImage(c, "easy", -95, 40+190*(scene-0.5)*2, 80*(1.5-scene), 40*(1.5-scene));
      }
    } else if(lvLabel == "normal") {
      c.globalAlpha = 0.25 * a;
      drawImage(c, "easy", -95, 40, 80, 40);
      drawImage(c, "hard", 15, 40, 80, 40);
      if(scene < 0.5) {
        c.globalAlpha = easing2;
        c.strokeStyle = "rgb(255, 255, 255)";
        c.strokeRect(-40-size*0.5, 40-size*0.5, 80+size, 40+size);
        if(scene < 0)
          c.globalAlpha = a;
        else
          c.globalAlpha = 0.9*Math.pow(Math.cos(Math.PI*scene/0.25), 2);
        drawImage(c, "normal", -40, 40, 80, 40);
      } else {
        c.globalAlpha = 0.9;
        drawImage(c, "normal", -40-55*(scene-0.5)*2, 40+190*(scene-0.5)*2, 80*(1.5-scene), 40*(1.5-scene));
      }
    } else {
      c.globalAlpha = 0.25 * a;
      drawImage(c, "easy", -95, 40, 80, 40);
      drawImage(c, "normal", -40, 40, 80, 40);
      if(0 <= scene && scene < 0.5) {
        c.globalAlpha = easing2;
        c.strokeStyle = "rgb(255, 255, 255)";
        c.strokeRect(15-size*0.5, 40-size*0.5, 80+size, 40+size);
        if(scene < 0)
          c.globalAlpha = a;
        else
          c.globalAlpha = 0.9*Math.pow(Math.cos(Math.PI*scene/0.25), 2);
        drawImage(c, "hard", 15, 40, 80, 40);
      } else {
        c.globalAlpha = 0.9;
        drawImage(c, "hard", 15-110*(scene-0.5)*2, 40+190*(scene-0.5)*2, 80*(1.5-scene), 40*(1.5-scene));
      }
    }
    c.globalAlpha = 1;
  }
  if(scene == 1) {
    var hprate = honkan.getHp()/honkan.getMaxHp();
    if(hprate < 0.2)
      rgba(c, 250, 50, 10, 0.8);
    else
      rgba(c, 20, 250, 50, 0.8);
    c.fillRect(-90, 2, 180*hprate, 3);
  }

  mzut.draw(c);
  exps.draw(c);

  if(scene < 1){
    var easing = Math.sign(scene)*scene*scene;
    c.translate(-64+200*easing, 200);
    c.rotate(time*2);
    drawImage(c, "foccatio", -25, -25, 50, 50);
    c.rotate(-time*2);
    c.translate(64-200*easing, -200);
    drawImage(c, "title", -100-Math.cos(time*2)*3, Math.sin(time*2)*5+20-300*easing, 200+Math.cos(time*2)*6, 240);
    drawImage(c, "next", -10-200*easing, 15+Math.sin(time*4.2)*5, 100, 20);
  } else if(scene == 1) {
    fo.draw(c);
    drawImage(c, lvLabel, -95, 230, 40, 20);
  } else if(scene <= 2) {
    drawImage(c, "over", -100, 256*(2-scene), 200, 256);
    drawImage(c, "next", -10+1000*(2-scene), 15+Math.sin(time*4.2)*5, 100, 20);
  } else if(scene <= 3) {
    drawVideo(c, "exp", -200, 0, 400, 256);
    drawImage(c, "clear", -100, 1000*(3-scene), 200, 256);
    drawImage(c, "next", -10+1000*(3-scene), 15+Math.sin(time*4.2)*5, 100, 20);
  }

  rgba(c, 250, 60, 10, 0.15*mzutmodewait);
  c.fillRect(-100, 0, 200, 256);
  // c.fillStyle = 'rgb(38, 69, 235)';
  // c.fillRect(-20, 0, 40, 40);
}

// var ease = {
//   outBounce : function(t) {
//     return
//   }
// }

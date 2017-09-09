/* Burak Kanber */
var bgm = new Howl({
  src: ['bgm.mp3']
});
bgm.play();


var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");
var width = canvas.width = window.innerWidth;
var height = canvas.height = window.innerHeight;
var initialised = false;

var cunt = {
  alive: document.getElementById('cunt'),
  dead: document.getElementById('cuntdead')
};
var dick = {
  alive: document.getElementById('dick'),
  dead: document.getElementById('dickdead')
};

var frameRate = 1/60; // Seconds
var frameDelay = frameRate * 1000; // ms
var loopTimer = false;
var deadFig = [];

var figPhy = {
  position: {x: width/2, y: height*0.25-60},
  velocity: {x: 5, y: -5},
  mass: 2, //kg
  radius: 40, // 1px = 1cm
  restitution: -0.2,
  spriteSet: cunt,
  locked: true
};

var Cd = 0.47;  // Dimensionless
var rho = 1.22; // kg / m^3
var A = Math.PI * figPhy.radius * figPhy.radius / (10000); // m^2
var ag = 50;  // m / s^2
var mouse = {x: 0, y: 0, isDown: false};

var randomSound = function() {
  if (initialised) {
    var sound = new Howl({
      src: ['sfx'+Math.floor(Math.random()*7)+'.mp3']
    });
    sound.play();
  }
}
var getMousePosition = function(e) {
  mouse.x = e.pageX - canvas.offsetLeft;
  mouse.y = e.pageY - canvas.offsetTop;
}
var mouseDown = function(e) {
  if (e.which == 1) {
    getMousePosition(e);
    mouse.isDown = true;
    figPhy.position.x = mouse.x;
    figPhy.position.y = mouse.y;
    figPhy.locked = false;
  }
}
var mouseUp = function(e) {
  if (e.which == 1) {
    mouse.isDown = false;
    figPhy.velocity.y = (figPhy.position.y - mouse.y) /30;
    figPhy.velocity.x = (figPhy.position.x - mouse.x) / 30;
    randomSound();
  }
}
var getTouchPosition = function(e) {
  mouse.x = e.targetTouches[0].pageX - canvas.offsetLeft;
  mouse.y = e.targetTouches[0].pageY - canvas.offsetTop;
  e.preventDefault();
}
var touchStart = function(e) {
  getTouchPosition(e);
  mouse.isDown = true;
  figPhy.position.x = mouse.x;
  figPhy.position.y = mouse.y;
  figPhy.locked = false;
}
var touchEnd = function(e) {
  mouse.isDown = false;
  figPhy.velocity.y = (figPhy.position.y - mouse.y) /10;
  figPhy.velocity.x = (figPhy.position.x - mouse.x) / 30;
  randomSound();
}

canvas.onmousemove = getMousePosition;
canvas.onmousedown = mouseDown;
document.onmouseup = mouseUp;

canvas.addEventListener('touchmove', getTouchPosition);
canvas.addEventListener('touchstart', touchStart);
document.addEventListener('touchend', touchEnd);

var reset = function (){
  var lastFigPhy = {
    position: {x: figPhy.position.x, y: figPhy.position.y},
    sprite: figPhy.sprite
  };
  deadFig.push(lastFigPhy);

  figPhy.spriteSet = ((Math.random() >= 1/3) ? cunt : dick);
  figPhy.position = {x: width/2, y: height*0.25-60};
  figPhy.velocity = {x: 0, y: 0};
  figPhy.locked = true;

}

var loop = function() {
  if ( ! mouse.isDown && !figPhy.locked) {
    // Do physics
    // Drag force: Fd = -1/2 * Cd * A * rho * v * v
    var Fx = -0.5 * Cd * A * rho * figPhy.velocity.x * figPhy.velocity.x * figPhy.velocity.x / Math.abs(figPhy.velocity.x);
    var Fy = -0.5 * Cd * A * rho * figPhy.velocity.y * figPhy.velocity.y * figPhy.velocity.y / Math.abs(figPhy.velocity.y);

    Fx = (isNaN(Fx) ? 0 : Fx);
    Fy = (isNaN(Fy) ? 0 : Fy);

    // Calculate acceleration ( F = ma )
    var ax = Fx / figPhy.mass;
    var ay = ag + (Fy / figPhy.mass);
    // Integrate to get velocity
    figPhy.velocity.x += ax*frameRate;
    figPhy.velocity.y += ay*frameRate;

    // Integrate to get position
    figPhy.position.x += figPhy.velocity.x*frameRate*100;
    figPhy.position.y += figPhy.velocity.y*frameRate*100;
  }
  // Handle enviorment collisions
  if (figPhy.position.y > height - figPhy.radius -20) {
    figPhy.velocity.y *= figPhy.restitution;
    figPhy.velocity.x *= -figPhy.restitution;
    figPhy.position.y = height - figPhy.radius -20 ;
  }
  if (figPhy.position.x > width - figPhy.radius) {
    figPhy.velocity.x *= figPhy.restitution;
    figPhy.position.x = width - figPhy.radius;
  }
  if (figPhy.position.x < figPhy.radius) {
    figPhy.velocity.x *= figPhy.restitution;
    figPhy.position.x = figPhy.radius;
  }

  // Handdle rotation
  if (figPhy.position.y < height/4*2) {
    figPhy.rotation = 0;
    figPhy.sprite = figPhy.spriteSet.alive;
  }
  if (figPhy.position.y > height/4*2 && figPhy.position.y < height/4*3) {
    figPhy.rotation = -45;
    figPhy.sprite = figPhy.spriteSet.alive;
  }
  if (figPhy.position.y > height/4*3) {
    figPhy.rotation = 0;
    figPhy.sprite = figPhy.spriteSet.dead;
  }

  // Handdle death
  if (figPhy.position.y > height - figPhy.radius -21 && figPhy.velocity.y) {
    reset();
  }

  // Draw the figPhy
  context.clearRect(0,0,width,height);
  context.fillStyle = 'red';
  context.strokeStyle = 'rgba(255, 128, 0, 0.3)';
  context.lineWidth = 5;

  deadFig.forEach(function(figPhy) {
    context.save();
    context.translate(figPhy.position.x, figPhy.position.y);
    context.rotate(figPhy.rotation*Math.PI/180);
    context.drawImage(figPhy.sprite, -40, -40, 80, 80);
    context.restore();
  });

  context.save();
  context.translate(figPhy.position.x, figPhy.position.y);
  context.rotate(figPhy.rotation*Math.PI/180);
  context.drawImage(figPhy.sprite, -40, -40, 80, 80);
  context.restore();

  // Draw the slingshot
  if (mouse.isDown) {
    context.beginPath();
    context.moveTo(figPhy.position.x-15, figPhy.position.y);
    context.lineTo(mouse.x, mouse.y);
    context.stroke();
    context.closePath();
  }
}
loopTimer = setInterval(loop, frameDelay);

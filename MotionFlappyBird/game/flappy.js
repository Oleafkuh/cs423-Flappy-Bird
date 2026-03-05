import { drawGame } from "./DisplayGame/renderGame.js";

// Flappy Bird 

  //Canvas setup 
  const canvas = document.getElementById("gameCanvas");
  const gameArea = document.getElementById("gameArea");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  canvas.style.imageRendering = "pixelated";
  canvas.style.textRendering = "pixelated";
  canvas.style.msInterpolationMode = "nearest-neighbor";

  //resolution
  const GAME_WIDTH = 1080;
  const GAME_HEIGHT = 608;
  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;

  function resizeCanvas() {
    const availableWidth = gameArea ? gameArea.clientWidth : window.innerWidth;
    const availableHeight = gameArea ? gameArea.clientHeight : window.innerHeight;
    canvas.style.width = availableWidth + "px";
    canvas.style.height = availableHeight + "px";
    canvas.style.imageRendering = "pixelated";
    canvas.style.textRendering = "pixelated";
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  const ASSET_PATH = "flappy-bird-assets/";

  const assetFiles = {
    bgDay: "background-day.png",
    bgNight: "background-night.png",
    base: "base.png",
    pipeGreen: "pipe-green.png",
    pipeRed: "pipe-red.png",
    birdDown: "yellowbird-downflap.png",
    birdMid: "yellowbird-midflap.png",
    birdUp: "yellowbird-upflap.png",
    message: "message.png",
    gameover: "gameover.png",
    reset: "reset.png",
    egg: "egg.png",
    brokenEgg: "broken-egg.png",
    d0: "0.png",
    d1: "1.png",
    d2: "2.png",
    d3: "3.png",
    d4: "4.png",
    d5: "5.png",
    d6: "6.png",
    d7: "7.png",
    d8: "8.png",
    d9: "9.png",
  };

  const img = {};
  let assetsLoaded = 0;
  const totalAssets = Object.keys(assetFiles).length;

  function loadAssets(callback) {
    for (const key in assetFiles) {
      img[key] = new Image();
      img[key].onload = function () {
        assetsLoaded++;
        if (assetsLoaded === totalAssets) callback();
      };
      img[key].src = ASSET_PATH + assetFiles[key];
    }
  }
  // Sound  
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;

  function ensureAudio() {
    if (!audioCtx) audioCtx = new AudioCtx();
  }

  function playTone(freq, duration, type) {
    try {
      ensureAudio();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type || "square";
      osc.frequency.value = freq;
      gain.gain.value = 0.08;
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) { /* No audio available */ }
  }

  function sfxFlap() { playTone(600, 0.1, "square"); }
  function sfxScore() { playTone(880, 0.15, "sine"); setTimeout(() => playTone(1200, 0.15, "sine"), 80); }
  function sfxHit() { playTone(200, 0.2, "sawtooth"); }
  function sfxDie() { playTone(150, 0.4, "sawtooth"); }

  //  Game constants (matching original physics) 
  const GRAVITY = 0.24;          // pixels/frame²  (original ~0.5 at 30fps-equivalent)
  const FLAP_VELOCITY = -7.5;     // upward velocity on flap
  const MAX_FALL_SPEED = 5;    // terminal velocity
  const BIRD_X = GAME_WIDTH * .33333;            // fixed horizontal position
  const BIRD_WIDTH = 34;
  const BIRD_HEIGHT = 24;

  const EGG_RADIUS = 15;
  const BROKEN_EGG_DURATION_MS = 1000;

  const PIPE_WIDTH = 58
  let PIPE_GAP = 200;         // vertical gap between top and bottom pipes (RANDOMIZED DURING GAME)
  const PIPE_SPEED = 1.8;         // horizontal scroll speed
  const PIPE_SPAWN_INTERVAL = 175; // frames between pipe spawns (~1.5s at 60fps equiv)

  const BASE_HEIGHT = 112;      // ground sprite height
  const BASE_Y = GAME_HEIGHT - BASE_HEIGHT;

  const BIRD_ROTATION_UP = -25 * (Math.PI / 180);
  const BIRD_ROTATION_DOWN = 90 * (Math.PI / 180);

  // Game state 
  const STATE_MENU = 0;
  const STATE_PLAYING = 1;
  const STATE_DYING = 2;
  const STATE_DEAD = 3;

  let state = STATE_MENU;
  let score = 0;
  let bestScore = parseInt(localStorage.getItem("flappyBest") || "0", 10);

  // Bird
  let birdY = 0;
  let birdVelocity = 0;
  let birdRotation = 0;
  let birdFlapFrame = 0;
  let birdFlapCounter = 0;
  const FLAP_CYCLE = [0, 1, 2, 1]; 

  // Pipes
  let pipes = [];
  let pipeTimer = 0;

  // Single egg dropped by player input (null when no egg is active)
  let egg = null;
  let brokenEgg = null;

  // Ground scroll
  let baseX = 0;

  // Frame counter for animation timing
  let frameCount = 0;

  function resetGame() {
    birdY = GAME_HEIGHT / 2 - 20;
    birdVelocity = 0;
    birdRotation = 0;
    birdFlapFrame = 0;
    birdFlapCounter = 0;
    pipes = [];
    pipeTimer = 0;
    egg = null;
    brokenEgg = null;
    score = 0;
    baseX = 0;
    frameCount = 0;
  }

export function spawnEgg() {
    if (state !== STATE_PLAYING || egg) { //only one egg can be spawned at a time
      return;
    }

    const eggVal = birdVelocity < 0 ? 0 : birdVelocity + 2; //if the bird is going up egg is dropped at normal speed, if bird is going down egg is dropped with added velocity
    egg = {
      x: BIRD_X,
      y: birdY + BIRD_HEIGHT / 2,
      velocity: eggVal,
    };
  }

  function showBrokenEggAt(x, y) {
    brokenEgg = {
      x,
      y,
      expiresAt: performance.now() + BROKEN_EGG_DURATION_MS,
    };
  }

  function updateBrokenEgg() {
    if (!brokenEgg) {
      return;
    }

    if (performance.now() >= brokenEgg.expiresAt) {
      brokenEgg = null;
    }
  }

  //updates egg properies and checks if it hit the ground or a pipe
  function updateEgg() {
    if (!egg) {
      return;
    }

    //adjust position based on velocity
    egg.velocity += GRAVITY;
    if (egg.velocity > MAX_FALL_SPEED) egg.velocity = MAX_FALL_SPEED;
    egg.y += egg.velocity;

    if (egg.y + EGG_RADIUS >= BASE_Y) {
      showBrokenEggAt(egg.x, BASE_Y - EGG_RADIUS);
      egg = null;
      return;
    }

    //pipe intersection logic
    let shouldRemove = false;
    for (let j = 0; j < pipes.length; j++) {
      const p = pipes[j];
      const overlapsPipeX = egg.x + EGG_RADIUS > p.x && egg.x - EGG_RADIUS < p.x + PIPE_WIDTH;
      if (!overlapsPipeX) {
        continue;
      }

      const landedOnBottomPipe =
        egg.velocity >= 0 &&
        egg.y - EGG_RADIUS < p.bottomStart &&
        egg.y + EGG_RADIUS >= p.bottomStart;

      if (landedOnBottomPipe) {
        score += 3;
        sfxScore();
        shouldRemove = true;
        break;
      }

      const hitTopPipe = egg.y - EGG_RADIUS <= p.topEnd;
      const hitBottomPipeBody = egg.y + EGG_RADIUS >= p.bottomStart;

      if (hitTopPipe || hitBottomPipeBody) {
        showBrokenEggAt(egg.x, egg.y);
        shouldRemove = true;
        break;
      }
    }

    if (shouldRemove) {
      egg = null;
    }
  }

  function randomPipeY() {
    const minTop = 50;
    const maxTop = BASE_Y - PIPE_GAP - 50;
    return Math.floor(Math.random() * (maxTop - minTop)) + minTop;
  }

  function spawnPipe() {
    const topEnd = randomPipeY();
    pipes.push({
      x: GAME_WIDTH,
      topEnd: topEnd,         
      bottomStart: topEnd + PIPE_GAP, 
      scored: false,
    });
  }

  // Bird sprite 
  function getBirdSprite() {
    const idx = FLAP_CYCLE[birdFlapFrame];
    if (idx === 0) return img.birdMid;
    if (idx === 1) return img.birdUp;
    return img.birdDown;
  }

  function checkCollision() {
    if (birdY + BIRD_HEIGHT >= BASE_Y) {
      birdY = BASE_Y - BIRD_HEIGHT;
      return true;
    }
    if (birdY <= 0) {
      birdY = 0;
    }

    for (let i = 0; i < pipes.length; i++) {
      const p = pipes[i];
      if (
        BIRD_X + BIRD_WIDTH > p.x + 2 &&
        BIRD_X < p.x + PIPE_WIDTH - 2
      ) {
        if (birdY < p.topEnd - 2) return true;
        if (birdY + BIRD_HEIGHT > p.bottomStart + 2) return true;
      }
    }
    return false;
  }

  function update() {
    updateBrokenEgg();
    frameCount++;

    if (state === STATE_MENU) {
      birdY = GAME_HEIGHT / 2 - 20 + Math.sin(frameCount * 0.08) * 8;
      birdFlapCounter++;
      if (birdFlapCounter >= 8) {
        birdFlapCounter = 0;
        birdFlapFrame = (birdFlapFrame + 1) % 4;
      }
      baseX = (baseX - PIPE_SPEED) % 24;
      return;
    }

    if (state === STATE_PLAYING) {
      birdVelocity += GRAVITY;
      if (birdVelocity > MAX_FALL_SPEED) birdVelocity = MAX_FALL_SPEED;
      birdY += birdVelocity;

      if (birdVelocity < 0) {
        birdRotation = BIRD_ROTATION_UP;
      } else {
        birdRotation += 0.04;
        if (birdRotation > BIRD_ROTATION_DOWN) birdRotation = BIRD_ROTATION_DOWN;
      }

      birdFlapCounter++;
      if (birdFlapCounter >= 6) {
        birdFlapCounter = 0;
        birdFlapFrame = (birdFlapFrame + 1) % 4;
      }

      pipeTimer++;
      if (pipeTimer >= PIPE_SPAWN_INTERVAL) {
        pipeTimer = 0;
        PIPE_GAP = Math.floor(Math.random() * 61) + 140;  //random number between 150 to 200
        spawnPipe();
      }

      for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= PIPE_SPEED;

        if (!pipes[i].scored && pipes[i].x + PIPE_WIDTH < BIRD_X) {
          pipes[i].scored = true;
          score++;
          sfxScore();
        }

        if (pipes[i].x + PIPE_WIDTH < -10) {
          pipes.splice(i, 1);
        }
      }

      if (brokenEgg) {
        brokenEgg.x -= PIPE_SPEED;
      }

      updateEgg();

      baseX = (baseX - PIPE_SPEED) % 24;

      if (checkCollision()) {
        state = STATE_DYING;
        sfxHit();
        setTimeout(sfxDie, 100);
      }
      return;
    }

    if (state === STATE_DYING) {
      birdVelocity += GRAVITY;
      if (birdVelocity > MAX_FALL_SPEED) birdVelocity = MAX_FALL_SPEED;
      birdY += birdVelocity;
      birdRotation = BIRD_ROTATION_DOWN;

      if (birdY + BIRD_HEIGHT >= BASE_Y) {
        birdY = BASE_Y - BIRD_HEIGHT;
        state = STATE_DEAD;
        if (score > bestScore) {
          bestScore = score;
          localStorage.setItem("flappyBest", bestScore.toString());
        }
      }
    }
  }

  function draw() {
    drawGame({
      ctx,
      img,
      pipes,
      baseX,
      birdY,
      birdRotation,
      score,
      bestScore,
      state,
      gameWidth: GAME_WIDTH,
      gameHeight: GAME_HEIGHT,
      baseY: BASE_Y,
      baseHeight: BASE_HEIGHT,
      birdX: BIRD_X,
      birdWidth: BIRD_WIDTH,
      birdHeight: BIRD_HEIGHT,
      pipeWidth: PIPE_WIDTH,
      egg,
      brokenEgg,
      getBirdSprite,
      STATE_MENU,
      STATE_PLAYING,
      STATE_DYING,
      STATE_DEAD,
    });
  }

// Input handling 
export function flap() {
    if (state === STATE_MENU) {
      resetGame();
      state = STATE_PLAYING;
      birdVelocity = FLAP_VELOCITY;
      sfxFlap();
      return;
    }
    if (state === STATE_PLAYING) {
      birdVelocity = FLAP_VELOCITY;
      sfxFlap();
      return;
    }
    if (state === STATE_DEAD) {
      state = STATE_MENU;
      resetGame();
      return;
    }
  }

export function isDeadState() {
  return state === STATE_DEAD;
}

export function goToMenuFromDead() {
  if (state !== STATE_DEAD) {
    return;
  }

  state = STATE_MENU;
  resetGame();
}

export function restartFromDead() {
  if (state !== STATE_DEAD) {
    return;
  }

  resetGame();
  state = STATE_MENU;
  birdVelocity = FLAP_VELOCITY;
  sfxFlap();
}

//Used for keyboard testing
document.addEventListener("keydown", function (e) {
  if (e.code === "Space" || e.code === "ArrowUp") {
    e.preventDefault();
    flap();
    return;
  }

  if (e.code === "KeyX" && state === STATE_PLAYING) {
    e.preventDefault();
    spawnEgg();
  }
});

// Mouse / Touch
canvas.addEventListener("mousedown", function (e) {
  e.preventDefault();
  flap();
});
canvas.addEventListener("touchstart", function (e) {
  e.preventDefault();
  flap();
});

//  Game loop 
const TARGET_FPS = 60;
const FRAME_DURATION = 1000 / TARGET_FPS;
let lastTime = 0;
let accumulator = 0;

function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const delta = timestamp - lastTime;
  lastTime = timestamp;
  accumulator += delta;

  // Fixed timestep so physics stay consistent
  while (accumulator >= FRAME_DURATION) {
    update();
    accumulator -= FRAME_DURATION;
  }

  draw();
  requestAnimationFrame(gameLoop);
}

//  Boot 
loadAssets(function () {
  resetGame();
  requestAnimationFrame(gameLoop);
});

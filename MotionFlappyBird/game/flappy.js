// Flappy Bird 

  //Canvas setup 
  const canvas = document.getElementById("gameCanvas");
  const gameArea = document.getElementById("gameArea");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

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


  function digitImg(n) {
    return img["d" + n];
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

  const PIPE_WIDTH = 60
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
    score = 0;
    baseX = 0;
    frameCount = 0;
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

  //  Drawing
  function draw() {
    ctx.imageSmoothingEnabled = false; //ensures no smoothing of pixel textures
    ctx.drawImage(img.bgDay, 0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Pipes
    for (let i = 0; i < pipes.length; i++) {
      const p = pipes[i];
      const pipeImg = img.pipeGreen;

      ctx.save();
      ctx.translate(p.x + PIPE_WIDTH / 2, p.topEnd);
      ctx.scale(1, -1);
      ctx.drawImage(pipeImg, -PIPE_WIDTH / 2, 0, PIPE_WIDTH, pipeImg.height);
      ctx.restore();

      ctx.drawImage(pipeImg, p.x, p.bottomStart, PIPE_WIDTH, pipeImg.height);
    }

    // Ground
    const baseWidth = img.base.width;
    for (let x = baseX; x < GAME_WIDTH; x += baseWidth) {
      ctx.drawImage(img.base, x, BASE_Y, baseWidth, BASE_HEIGHT);
    }
    if (baseX < 0) {
      ctx.drawImage(img.base, baseX - baseWidth + baseWidth, BASE_Y, baseWidth, BASE_HEIGHT);
    }

    // Bird
    ctx.save();
    ctx.translate(BIRD_X + BIRD_WIDTH / 2, birdY + BIRD_HEIGHT / 2);
    ctx.rotate(birdRotation);
    ctx.drawImage(getBirdSprite(), -BIRD_WIDTH / 2, -BIRD_HEIGHT / 2, BIRD_WIDTH, BIRD_HEIGHT);
    ctx.restore();

    // Score 
    if (state === STATE_PLAYING || state === STATE_DYING || state === STATE_DEAD) {
      drawScore(score, GAME_WIDTH / 2, 30);
    }

    // Menu overlay
    if (state === STATE_MENU) {
      const msgW = img.message.width * 2;
      const msgH = img.message.height * 2;
      ctx.drawImage(img.message, (GAME_WIDTH - msgW) / 2 + 200, (GAME_HEIGHT - msgH) / 2 , msgW, msgH);
    }

    // Game-over overlay
    if (state === STATE_DEAD) {
      const goW = img.gameover.width;
      const goH = img.gameover.height;
      ctx.drawImage(img.gameover, (GAME_WIDTH - goW) / 2, GAME_HEIGHT / 2 - 80);

      // Score panel
      drawScorePanel();
    }
  }

  function drawScore(val, cx, y) {
    const digits = val.toString().split("");
    const digitW = 24;
    const digitH = 36;
    const totalW = digits.length * digitW;
    let startX = cx - totalW / 2;
    for (let i = 0; i < digits.length; i++) {
      ctx.drawImage(digitImg(parseInt(digits[i])), startX + i * digitW, y, digitW, digitH);
    }
  }

  function drawScorePanel() {
    const panelW = 220;
    const panelH = 100;
    const panelX = (GAME_WIDTH - panelW) / 2;
    const panelY = GAME_HEIGHT / 2 - 30;

    ctx.fillStyle = "rgba(222, 216, 149, 0.95)";
    ctx.strokeStyle = "#543847";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#543847";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Score", panelX + 20, panelY + 32);
    ctx.fillText("Best", panelX + 20, panelY + 72);

    ctx.textAlign = "right";
    ctx.fillText(score.toString(), panelX + panelW - 20, panelY + 32);
    ctx.fillText(bestScore.toString(), panelX + panelW - 20, panelY + 72);

    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.font = "14px Arial";
    ctx.fillText("Tap or press Space to restart", GAME_WIDTH / 2, panelY + panelH + 30);
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

// Keyboard
document.addEventListener("keydown", function (e) {
  if (e.code === "Space" || e.code === "ArrowUp") {
    e.preventDefault();
    flap();
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

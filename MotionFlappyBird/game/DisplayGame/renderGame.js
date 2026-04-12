const PIXEL_FONT = {
  "A": ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  "B": ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  "C": ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  "E": ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  "G": ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
  "I": ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  "K": ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  "L": ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  "M": ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  "N": ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  "O": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  "P": ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  "R": ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  "S": ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  "T": ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  "U": ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  "Y": ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  " ": ["000", "000", "000", "000", "000", "000", "000"],
};

const POST_DEATH_ACTIONS_ID = "postDeathActions";

function getPostDeathActionsContainer() {
  return document.getElementById(POST_DEATH_ACTIONS_ID);
}

function removePostDeathActions() {
  const actions = getPostDeathActionsContainer();
  if (actions) {
    actions.remove();
  }
}

function configureActionButton(button) {
  button.style.minWidth = "300px";
  button.style.height = "150px";
  button.style.fontSize = "34px";
  button.style.fontWeight = "900";
  button.style.fontFamily = "'Arial Black', Arial, sans-serif";
  button.style.color = "#ffffff";
  button.style.background = "#16a34a";
  button.style.border = "4px solid #0f7a38";
  button.style.borderRadius = "18px";
  button.style.cursor = "pointer";
  button.style.boxShadow = "0 10px 0 #0d6f33";
}


//creates style and logic for the two buttons displayed when the user dies  ( MENU &  PLAY AGAIN )
function createPostDeathActions() {
  const actions = document.createElement("div");
  actions.id = POST_DEATH_ACTIONS_ID;
  actions.style.position = "fixed";
  actions.style.left = "50%";
  actions.style.bottom = "100px";
  actions.style.transform = "translateX(-50%)";
  actions.style.zIndex = "1000";
  actions.style.display = "flex";
  actions.style.gap = "40px";

  const menuButton = document.createElement("button");
  menuButton.id = "menuFromDeadButton";
  menuButton.textContent = "MENU";

  const playAgainButton = document.createElement("button");
  playAgainButton.id = "playAgainFromDeadButton";
  playAgainButton.textContent = "PLAY AGAIN";

  configureActionButton(menuButton);
  configureActionButton(playAgainButton);

  menuButton.addEventListener("click", async () => {
    const { goToMenuFromDead } = await import("../flappy.js");
    goToMenuFromDead();
    document.body.dataset.postDeathActionsReady = "false";
    window.dispatchEvent(new CustomEvent("flappyPostDeathAction", { detail: { action: "menu" } }));
    actions.remove();
    window.location.reload();
  });

  playAgainButton.addEventListener("click", async () => {
    const { restartFromDead } = await import("../flappy.js");
    restartFromDead();
    document.body.dataset.postDeathActionsReady = "false";
    window.dispatchEvent(new CustomEvent("flappyPostDeathAction", { detail: { action: "playAgain" } }));
    actions.remove();
  });

  actions.appendChild(menuButton);
  actions.appendChild(playAgainButton);
  document.body.appendChild(actions);
}

function drawMenuandPlayAgainButtons() {
  const isReady = document.body.dataset.postDeathActionsReady === "true";
  if (!isReady) {
    removePostDeathActions();
    return;
  }

  if (!getPostDeathActionsContainer()) {
    createPostDeathActions();
  }
}

function digitImg(img, n) {
  return img["d" + n];
}

function drawScore(ctx, img, val, cx, y) {
  const digits = val.toString().split("");
  const digitW = 48;
  const digitH = 72;
  const totalW = digits.length * digitW;
  let startX = cx - totalW / 2;
  for (let i = 0; i < digits.length; i++) {
    ctx.drawImage(digitImg(img, parseInt(digits[i], 10)), startX + i * digitW, y, digitW, digitH);
  }
}

function drawPixelText(ctx, text, x, y, scale, color, align) {
  const upper = text.toUpperCase();
  const glyphSpacing = scale;
  let width = 0;

  for (let i = 0; i < upper.length; i++) {
    const glyph = PIXEL_FONT[upper[i]] || PIXEL_FONT[" "];
    width += glyph[0].length * scale;
    if (i < upper.length - 1) width += glyphSpacing;
  }

  let startX = x;
  if (align === "center") startX = x - width / 2;
  if (align === "right") startX = x - width;

  const px = Math.round(startX);
  const py = Math.round(y);
  ctx.fillStyle = color;

  let cursorX = px;
  for (let i = 0; i < upper.length; i++) {
    const glyph = PIXEL_FONT[upper[i]] || PIXEL_FONT[" "];
    for (let row = 0; row < glyph.length; row++) {
      for (let col = 0; col < glyph[row].length; col++) {
        if (glyph[row][col] === "1") {
          ctx.fillRect(cursorX + col * scale, py + row * scale, scale, scale);
        }
      }
    }
    cursorX += glyph[0].length * scale + glyphSpacing;
  }
}

function drawScorePanel(ctx, score, bestScore, gameWidth, gameHeight, img) {
  const panelW = 440;
  const panelH = 200;
  const panelX = (gameWidth - panelW) / 2;
  const panelY = gameHeight / 2 - panelH / 2 - 15;

  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "rgba(222, 216, 149, 0.95)";
  ctx.fillRect(panelX, panelY, panelW, panelH);

  const border = 3;
  ctx.fillStyle = "#543847";
  ctx.fillRect(panelX, panelY, panelW, border);
  ctx.fillRect(panelX, panelY + panelH - border, panelW, border);
  ctx.fillRect(panelX, panelY, border, panelH);
  ctx.fillRect(panelX + panelW - border, panelY, border, panelH);

  const TextX = panelX + 20;

  drawPixelText(ctx, "SCORE", TextX + 20, panelY + 20, 7, "#543847", "left");
  drawPixelText(ctx, "BEST", TextX + 20, panelY + 100, 7, "#543847", "left");

  drawScore(ctx, img, score, TextX + 300, panelY + 15);
  drawScore(ctx, img, bestScore, TextX + 300, panelY + 95);
}

export function drawGame(renderState) {
  const {
    ctx,
    img,
    pipes,
    baseX,
    birdY,
    birdRotation,
    score,
    bestScore,
    state,
    gameWidth,
    gameHeight,
    baseY,
    baseHeight,
    birdX,
    birdWidth,
    birdHeight,
    pipeWidth,
    egg,
    brokenEgg,
    getBirdSprite,
    STATE_MENU,
    STATE_PLAYING,
    STATE_DYING,
    STATE_DEAD,
  } = renderState;

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img.bgDay, 0, 0, gameWidth, gameHeight);

  for (let i = 0; i < pipes.length; i++) {
    const p = pipes[i];
    const pipeImg = img.pipeGreen;

    ctx.save();
    ctx.translate(p.x + pipeWidth / 2, p.topEnd);
    ctx.scale(1, -1);
    ctx.drawImage(pipeImg, -pipeWidth / 2, 0, pipeWidth, pipeImg.height);
    ctx.restore();

    ctx.drawImage(pipeImg, p.x, p.bottomStart, pipeWidth, pipeImg.height);
  }

  const baseWidth = img.base.width;
  for (let x = baseX; x < gameWidth; x += baseWidth) {
    ctx.drawImage(img.base, x, baseY, baseWidth, baseHeight);
  }
  if (baseX < 0) {
    ctx.drawImage(img.base, baseX - baseWidth + baseWidth, baseY, baseWidth, baseHeight);
  }

  ctx.save();
  ctx.translate(birdX + birdWidth / 2, birdY + birdHeight / 2);
  ctx.rotate(birdRotation);
  ctx.drawImage(getBirdSprite(), -birdWidth / 2, -birdHeight / 2, birdWidth, birdHeight);
  ctx.restore();

  if (egg) {
    ctx.drawImage(img.egg, egg.x, egg.y, img.egg.width, img.egg.height);
  }

  if (brokenEgg) {
    const brokenEggW = img.brokenEgg.width;
    const brokenEggH = img.brokenEgg.height;
    ctx.drawImage(img.brokenEgg, brokenEgg.x - brokenEggW / 2, brokenEgg.y - brokenEggH / 2, brokenEggW, brokenEggH);
  }

  if (state === STATE_PLAYING || state === STATE_DYING || state === STATE_DEAD) {
    drawScore(ctx, img, score, gameWidth / 2, 30);
  }

  if (state === STATE_MENU) {
    const msgW = img.message.width * 2;
    const msgH = img.message.height * 2;
    ctx.drawImage(img.message, (gameWidth - msgW) / 2 + 200, (gameHeight - msgH) / 2, msgW, msgH);
  }

  if (state === STATE_DEAD) {
    const goW = img.gameover.width * 2;
    ctx.drawImage(img.gameover, (gameWidth - goW) / 2, gameHeight / 2 - 200, goW, img.gameover.height * 2);

    drawScorePanel(ctx, score, bestScore, gameWidth, gameHeight, img);
    drawMenuandPlayAgainButtons();
  } else {
    removePostDeathActions();
  }
}
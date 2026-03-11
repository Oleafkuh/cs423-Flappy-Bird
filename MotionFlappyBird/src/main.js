import { initHandTracking, stopHandTracking } from "./mediapipe/handTracking.js";
import { isPinching } from "./mediapipe/pinchDetector.js";
import { renderSettingsView } from "./Menu_Components/settings.js";
import { renderLeaderboardView, showNameGeneratorModal } from "./Menu_Components/leaderboard.js";
import { getCurrentUser, saveScore } from "./Menu_Components/login.js";

const cursor = document.createElement("div");
cursor.style.position = "fixed";
cursor.style.width = "20px";
cursor.style.height = "20px";
cursor.style.background = "red";
cursor.style.borderRadius = "50%";
cursor.style.pointerEvents = "none";
cursor.style.zIndex = "999";
document.body.appendChild(cursor);

const screenRoot = document.createElement("div");
screenRoot.id = "screenRoot";
document.body.appendChild(screenRoot);

let gameStarted = false;
let wasPinchingLastFrame = false;
let isHandTrackingRunning = false;
let currentUsername = getCurrentUser();

const sharedVideo = document.getElementById("video");
const sharedCanvas = document.getElementById("canvas");

async function ensureHandTrackingRunning() {
  if (isHandTrackingRunning || !sharedVideo || !sharedCanvas) {
    return;
  }

  await initHandTracking(sharedVideo, sharedCanvas, handleHandTrackingResults);
  isHandTrackingRunning = true;
}

/**
 * Finds the currently hovered button in the active menu/component screen.
 *
 * @param {number} x - Cursor x position in viewport coordinates.
 * @param {number} y - Cursor y position in viewport coordinates.
 * @returns {HTMLButtonElement|null} The hovered visible button, if any.
 */
function getHoveredMenuButton(x, y) {
  const nameGenOverlay = document.getElementById("nameGenOverlay");
  const containers = nameGenOverlay ? [nameGenOverlay, screenRoot] : [screenRoot];

  for (const container of containers) {
    const buttons = container.querySelectorAll("button");
    for (const button of buttons) {
      const style = window.getComputedStyle(button);
      if (style.display === "none" || style.visibility === "hidden" || button.disabled) {
        continue;
      }

      const rect = button.getBoundingClientRect();
      const isHovering = x > rect.left && x < rect.right && y > rect.top && y < rect.bottom;

      if (isHovering) {
        return button;
      }
    }
  }

  return null;
}

/**
 * Sets visibility for the hand-tracking camera overlay used in menu screens.
 *
 * @param {boolean} isVisible - Whether to display the menu camera overlays.
 */
function setMenuTrackingOverlayVisibility(isVisible) {
  const displayValue = isVisible ? "block" : "none";

  cursor.style.display = displayValue;
}

/**
 * Renders the main menu.
 *
 * Creates a centered menu with Start, Settings, and Leaderboard buttons,
 * then connects each button to its corresponding screen action.
 */
function renderMainMenu() {
  gameStarted = false;
  wasPinchingLastFrame = false;
  setMenuTrackingOverlayVisibility(true);
  ensureHandTrackingRunning().catch((error) => {
    console.error("Failed to start hand tracking:", error);
  });
  currentUsername = getCurrentUser();
  const userGreeting = currentUsername ? `Welcome, ${currentUsername}!` : "Not logged in";

  screenRoot.innerHTML = `
    <div id="mainMenu" class="menuScreen">
      <div class="userStatus">${userGreeting}</div>
      <img src="./flappy-bird-assets/logo.png" alt="Motion Flappy Bird" class="menuLogo" />
      <div class="menuControlsRow">
        <img src="./flappy-bird-assets/pinch.png" alt="Pinch gesture" class="menuPinchArt" />

        <div class="menuButtonGrid">
          <button id="startGameButton" class="menuButton primary">Start</button>

          <div class="menuSecondaryRow">
            <button id="settingsButton" class="menuButton secondary">Settings</button>
            <button id="leaderboardButton" class="menuButton secondary">Leaderboard</button>
          </div>
        </div>

        <img src="./flappy-bird-assets/pinch.png" alt="Pinch gesture" class="menuPinchArt" />
      </div>
      <div class="menuInstruction">Pinch to select</div>
    </div>
  `;

  const startGameButton = document.getElementById("startGameButton");
  const settingsButton = document.getElementById("settingsButton");
  const leaderboardButton = document.getElementById("leaderboardButton");

  startGameButton?.addEventListener("click", () => {
    startMotionFlappyBird();
  });

  settingsButton?.addEventListener("click", () => {
    renderSettingsView(screenRoot, renderMainMenu);
  });

  leaderboardButton?.addEventListener("click", () => {
    renderLeaderboardView(screenRoot, renderMainMenu);
  });
}

/**
 * Renders the Motion Flappy Bird interface.
 *
 * Builds the in-game screen with a game canvas, top-right camera feed,
 * and motion status HUD.
 */
function renderMotionFlappyLayout() {
  screenRoot.innerHTML = `
    <div id="gameArea">
      <canvas id="gameCanvas"></canvas>
    </div>

    <div id="hud">
      <div id="PersonInFrame" style="color: rgb(255, 0, 0); display: block;"></div>
    </div>
    <img id="squatGuide" src="./flappy-bird-assets/squat.png" alt="Squat gesture guide" />
  `;
}

/**
 * Starts the Motion Flappy Bird game flow.
 *
 * Replaces the start screen with the game layout, dynamically imports the
 * MoveNet detector module, and initializes pose detection.
 */
async function startMotionFlappyBird() {
  gameStarted = true;
  setMenuTrackingOverlayVisibility(false);

  if (isHandTrackingRunning) {
    await stopHandTracking();
    isHandTrackingRunning = false;
  }

  renderMotionFlappyLayout();
  const { startDetector } = await import("./movenet/detector.js");
  await startDetector();
  
  // Import and start the game
  const { flap } = await import("../game/flappy.js");
  
  // Override the game's score saving to use our system
  const originalLocalStorageSet = localStorage.setItem;
  localStorage.setItem = function(key, value) {
    if (key === "flappyBest") {
      const score = parseInt(value, 10);
      if (currentUsername && score > 0) {
        saveScore(score);
      }
    }
    return originalLocalStorageSet.call(this, key, value);
  };
}

/**
 * Processes hand-tracking results to drive the start-button interaction.
 *
 * Tracks the index fingertip to move a visual cursor, checks whether the
 * cursor is hovering over the start button, and starts the game when a pinch
 * gesture is detected.
 *
 * @param {object} results - MediaPipe hand-tracking output for the current frame.
 */
async function handleHandTrackingResults(results) {
  const nameGenOpen = !!document.getElementById("nameGenOverlay");
  if (!results.multiHandLandmarks || (gameStarted && !nameGenOpen)) {
    wasPinchingLastFrame = false;
    return;
  }

  const landmarks = results.multiHandLandmarks[0];
  if (!Array.isArray(landmarks)) {
    return;
  }

  const indexTip = landmarks[8];

  const x = (1 - indexTip.x) * window.innerWidth;
  const y = indexTip.y * window.innerHeight;

  cursor.style.left = `${x}px`;
  cursor.style.top = `${y}px`;

  const hoveredButton = getHoveredMenuButton(x, y);
  const isPinchActive = isPinching(landmarks);
  const isFreshPinch = isPinchActive && !wasPinchingLastFrame;

  if (hoveredButton && isFreshPinch) {
    if (hoveredButton.id === "startGameButton") {
      hoveredButton.innerText = "Loading...";
      console.log("Start selected via pinch!");
      await startMotionFlappyBird();
      wasPinchingLastFrame = false;
      return;
    }

    hoveredButton.click();
  }

  wasPinchingLastFrame = isPinchActive;
}

renderMainMenu();

window.addEventListener("flappyDied", (e) => {
  const finalScore = e.detail.score;
  setMenuTrackingOverlayVisibility(true);
  wasPinchingLastFrame = false;
  ensureHandTrackingRunning().catch((error) => {
    console.error("Failed to start hand tracking for modal:", error);
  });
  showNameGeneratorModal(finalScore, async () => {
    setMenuTrackingOverlayVisibility(false);
    wasPinchingLastFrame = false;
    if (isHandTrackingRunning) {
      await stopHandTracking();
      isHandTrackingRunning = false;
    }
    const { resetDetector } = await import("./movenet/detector.js");
    await resetDetector();
  });
});

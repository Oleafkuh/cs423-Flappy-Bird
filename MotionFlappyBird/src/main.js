import { initHandTracking } from "./mediapipe/handTracking.js";
import { isPinching } from "./mediapipe/pinchDetector.js";
import { renderSettingsView } from "./Menu_Components/settings.js";
import { renderLeaderboardView } from "./Menu_Components/leaderboard.js";

const video = document.createElement("video");

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

/**
 * Finds the currently hovered button in the active menu/component screen.
 *
 * @param {number} x - Cursor x position in viewport coordinates.
 * @param {number} y - Cursor y position in viewport coordinates.
 * @returns {HTMLButtonElement|null} The hovered visible button, if any.
 */
function getHoveredMenuButton(x, y) {
  const buttons = screenRoot.querySelectorAll("button");

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

  return null;
}

/**
 * Sets visibility for the hand-tracking camera overlay used in menu screens.
 *
 * @param {boolean} isVisible - Whether to display the menu camera overlays.
 */
function setMenuTrackingOverlayVisibility(isVisible) {
  const handTrackingVideo = document.getElementById("handTrackingVideo");
  const handTrackingCanvas = document.getElementById("handTrackingCanvas");
  const displayValue = isVisible ? "block" : "none";

  if (handTrackingVideo) {
    handTrackingVideo.style.display = displayValue;
  }

  if (handTrackingCanvas) {
    handTrackingCanvas.style.display = displayValue;
  }

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

  screenRoot.innerHTML = `
    <div id="mainMenu" class="menuScreen">
      <img src="./flappy-bird-assets/logo.png" alt="Motion Flappy Bird" class="menuLogo" />
      <button id="startGameButton" class="menuButton primary">Start</button>
      <button id="settingsButton" class="menuButton secondary">Settings</button>
      <button id="leaderboardButton" class="menuButton secondary">Leaderboard</button>
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

    <div id="cameraFeed">
      <video id="video" autoplay playsinline></video>
      <canvas id="canvas"></canvas>
    </div>

    <div id="hud">
      <div class="hudRow">
        <div class="hudLabel">RESET:</div>
        <div id="ResetLabel" style="color: rgb(255, 0, 0);">False</div>
      </div>
      <div id="PersonInFrame" style="color: rgb(255, 0, 0); display: block;"></div>
    </div>
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
  renderMotionFlappyLayout();
  const { startDetector } = await import("./movenet/detector.js");
  await startDetector();
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
  if (!results.multiHandLandmarks || gameStarted) {
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

initHandTracking(video, handleHandTrackingResults);
renderMainMenu();

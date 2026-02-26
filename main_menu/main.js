import { initHandTracking } from "./handTracking.js";
import { isPinching } from "./pinchDetector.js";

// ===============================
// CREATE UI
// ===============================

// Video element (camera feed)
const video = document.createElement("video");

// Cursor
const cursor = document.createElement("div");
cursor.style.position = "absolute";
cursor.style.width = "20px";
cursor.style.height = "20px";
cursor.style.background = "red";
cursor.style.borderRadius = "50%";
cursor.style.pointerEvents = "none";
cursor.style.zIndex = "999";
document.body.appendChild(cursor);

// Start Button
const startButton = document.createElement("button");
startButton.innerText = "START GAME";
startButton.style.position = "absolute";
startButton.style.left = "40%";
startButton.style.top = "40%";
startButton.style.fontSize = "30px";
startButton.style.padding = "20px";
startButton.style.zIndex = "10";
document.body.appendChild(startButton);

let gameStarted = false;

// ===============================
// HAND TRACKING
// ===============================
initHandTracking(video, (results) => {

  if (!results.multiHandLandmarks || gameStarted) return;

  const landmarks = results.multiHandLandmarks[0];
  const indexTip = landmarks[8];

  const x = (1 - indexTip.x) * window.innerWidth;
  const y = indexTip.y * window.innerHeight;

  cursor.style.left = `${x}px`;
  cursor.style.top = `${y}px`;

  const rect = startButton.getBoundingClientRect();

  const hovering =
    x > rect.left &&
    x < rect.right &&
    y > rect.top &&
    y < rect.bottom;

  if (hovering && isPinching(landmarks)) {
    gameStarted = true;
    startButton.innerText = "Loading...";
    console.log("Start selected via pinch!");
  }
});
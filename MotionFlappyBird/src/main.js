import { initHandTracking } from "./mediapipe/handTracking.js";
import { isPinching } from "./mediapipe/pinchDetector.js";

const video = document.createElement("video");

const cursor = document.createElement("div");
cursor.style.position = "absolute";
cursor.style.width = "20px";
cursor.style.height = "20px";
cursor.style.background = "red";
cursor.style.borderRadius = "50%";
cursor.style.pointerEvents = "none";
cursor.style.zIndex = "999";
document.body.appendChild(cursor);

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

function renderMotionFlappyLayout() {
  document.body.innerHTML = `
    <div id="appLayout">
      <div id="gameArea">
        <canvas id="gameCanvas"></canvas>
      </div>

      <aside id="hudBar">
        <div id="cameraFeed">
          <video id="video" autoplay playsinline></video>
          <canvas id="canvas"></canvas>
        </div>

        <div id="hud">
          <div class="hudRow">
            <div class="hudLabel">Flaps:</div>
            <div id="FlapCounter" style="color: rgb(34, 157, 30);">0</div>
          </div>
          <div class="hudRow">
            <div class="hudLabel">RESET:</div>
            <div id="ResetLabel" style="color: rgb(255, 0, 0);">False</div>
          </div>
          <div id="PersonInFrame" style="color: rgb(34, 255, 0); display: block;"></div>
        </div>
      </aside>
    </div>
  `;
}

async function startMotionFlappyBird() {
  renderMotionFlappyLayout();
  const { startDetector } = await import("./movenet/detector.js");
  await startDetector();
}

initHandTracking(video, async (results) => {
  if (!results.multiHandLandmarks || gameStarted) {
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
    await startMotionFlappyBird();
  }
});

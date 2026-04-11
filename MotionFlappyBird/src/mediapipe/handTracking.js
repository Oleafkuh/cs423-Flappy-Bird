const CAMERA_WIDTH = 1280;
const CAMERA_HEIGHT = 720;
let activeStream = null;
let activeCamera = null;
let activeHands = null;
let activeCanvas = null;
let activeCtx = null;

export async function initHandTracking(videoElement, canvasElement, onResultsCallback) {
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { exact: CAMERA_WIDTH },
        height: { exact: CAMERA_HEIGHT }
      }
    });
  } catch {
    // Fallback keeps gameplay working on devices that cannot hard-lock exact constraints.
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: CAMERA_WIDTH },
        height: { ideal: CAMERA_HEIGHT }
      }
    });
  }

  activeStream = stream;
  videoElement.srcObject = stream;
  videoElement.autoplay = true;
  videoElement.playsInline = true;

  await videoElement.play();

  canvasElement.width = CAMERA_WIDTH;
  canvasElement.height = CAMERA_HEIGHT;

  const ctx = canvasElement.getContext("2d");
  activeCanvas = canvasElement;
  activeCtx = ctx;

  const hands = new window.Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });
  activeHands = hands;

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
  });

  hands.onResults((results) => {
    if (!activeCtx || !activeCanvas) {
      return;
    }

    activeCtx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);

    if (results.multiHandLandmarks?.length > 0) {
      const landmarks = results.multiHandLandmarks[0];

      window.drawConnectors(
        activeCtx,
        landmarks,
        window.HAND_CONNECTIONS,
        { color: "#00FF00", lineWidth: 3 }
      );

      landmarks.forEach((landmark, index) => {
      let circleSize = 3;
      let color =  "#ffffff"; 
        if (index === 5) {// Index 5 base of index finger
           color = "#FF0000";
           circleSize = 7;
        }
        activeCtx.fillStyle = color;
        activeCtx.beginPath();
        activeCtx.arc(landmark.x * activeCanvas.width, landmark.y * activeCanvas.height, circleSize, 0, 2 * Math.PI);
        activeCtx.fill();
      });
    }


    console.log("Hand Tracking is running");
    onResultsCallback(results);
  });

  const camera = new window.Camera(videoElement, {
    onFrame: async () => {
      await hands.send({ image: videoElement });
    },
    width: CAMERA_WIDTH,
    height: CAMERA_HEIGHT
  });
  activeCamera = camera;

  camera.start();
}

export async function stopHandTracking() {
  if (activeCamera?.stop) {
    activeCamera.stop();
  }

  if (activeStream) {
    activeStream.getTracks().forEach((track) => track.stop());
  }

  if (activeHands?.close) {
    await activeHands.close();
  }

  if (activeCtx && activeCanvas) {
    activeCtx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
  }

  activeStream = null;
  activeCamera = null;
  activeHands = null;
  activeCanvas = null;
  activeCtx = null;

 console.log("Hand Tracking disabled");
}

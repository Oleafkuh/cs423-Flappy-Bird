export async function initHandTracking(videoElement, onResultsCallback) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 640, height: 480 }
  });

  videoElement.srcObject = stream;
  videoElement.autoplay = true;
  videoElement.playsInline = true;
  videoElement.style.transform = "scaleX(-1)";
  document.body.appendChild(videoElement);

  await videoElement.play();

  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  canvas.style.position = "absolute";
  canvas.style.top = videoElement.offsetTop + "px";
  canvas.style.left = videoElement.offsetLeft + "px";
  canvas.style.transform = "scaleX(-1)";
  canvas.style.pointerEvents = "none";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  const hands = new window.Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
  });

  hands.onResults((results) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks?.length > 0) {
      const landmarks = results.multiHandLandmarks[0];

      window.drawConnectors(
        ctx,
        landmarks,
        window.HAND_CONNECTIONS,
        { color: "#00FF00", lineWidth: 3 }
      );

      window.drawLandmarks(
        ctx,
        landmarks,
        { color: "#FF0000", lineWidth: 2 }
      );
    }

    onResultsCallback(results);
  });

  const camera = new window.Camera(videoElement, {
    onFrame: async () => {
      await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480
  });

  camera.start();
}

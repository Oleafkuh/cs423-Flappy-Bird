export async function initHandTracking(videoElement, onResultsCallback) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 640, height: 480 }
  });

  videoElement.srcObject = stream;
  videoElement.id = "handTrackingVideo";
  videoElement.autoplay = true;
  videoElement.playsInline = true;
  videoElement.style.position = "fixed";
  videoElement.style.top = "16px";
  videoElement.style.left = "16px";
  videoElement.style.width = "320px";
  videoElement.style.height = "240px";
  videoElement.style.objectFit = "cover";
  videoElement.style.border = "2px solid #ffffff";
  videoElement.style.zIndex = "30";
  videoElement.style.transform = "scaleX(-1)";
  document.body.appendChild(videoElement);

  await videoElement.play();

  const canvas = document.createElement("canvas");
  canvas.id = "handTrackingCanvas";
  canvas.width = 640;
  canvas.height = 480;
  canvas.style.position = "fixed";
  canvas.style.top = "16px";
  canvas.style.left = "16px";
  canvas.style.width = "320px";
  canvas.style.height = "240px";
  canvas.style.transform = "scaleX(-1)";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "31";
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

      landmarks.forEach((landmark, index) => {
      let circleSize = 3;
      let color =  "#ffffff"; 
        if (index === 8) {// Index 8 is the index finger tip
           color = "#FF0000";
           circleSize = 7;
        }
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, circleSize, 0, 2 * Math.PI);
        ctx.fill();
      });
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

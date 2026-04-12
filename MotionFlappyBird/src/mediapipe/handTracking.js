const CAMERA_WIDTH = 1280;
const CAMERA_HEIGHT = 720;
let activeStream = null;
let activeCamera = null;
let activeHands = null;
let activeCanvas = null;
let activeCtx = null;
const WristDistanceThreshold = 0.2;
let setHand = null


//On every frame grabs hand info.  If both hands are in frame it will pick the hand that is raised (assuming the user will raise their dominent hand to select menu icons)
function getPreferredHandLandmarks(results) {

  if (!results?.multiHandLandmarks?.length) { //no hands recognized in frame
    return null;
  }
  if (results.multiHandLandmarks.length === 1) {
    if  ( results.multiHandedness[0].label == setHand || setHand == null) { //1 hand recognized in frame
    return results.multiHandLandmarks[0];
  }
  return null; //single hand displayed is not the picked tracking hand
}
  const firstLandmarks = results.multiHandLandmarks[0];
  const secondLandmarks = results.multiHandLandmarks[1];

  //if hand is already set default to just choosing left or right hand
  if (setHand && results.multiHandedness[0].label == setHand) {
    return firstLandmarks;
  }
  
  if (setHand && results.multiHandedness[1].label == setHand) {
    return secondLandmarks;
  }
  ////////////////  if setHand is null (not set yet)  ///////////////////

  const firstWristY = firstLandmarks?.[0]?.y;
  const secondWristY = secondLandmarks?.[0]?.y;
 
  //return the hand that is higher than the other  (Due to mirrored screen a right hand in the system is actually a left hand)
  if (!setHand && firstWristY + WristDistanceThreshold < secondWristY) {
    setHand = results.multiHandedness[0].label; 
     console.log(setHand);
     return firstLandmarks;
  } else if ( secondWristY + WristDistanceThreshold < firstWristY){
    setHand = results.multiHandedness[1].label;
     console.log(setHand);
    return secondLandmarks;
  }
  else {
    return null;
  }
}

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
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
  });

  hands.onResults((results) => {
    if (!activeCtx || !activeCanvas) {
      return;
    }

    activeCtx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);

     const selectedHandLandmarks = getPreferredHandLandmarks(results); //select left or right hand to track

    if (selectedHandLandmarks) {
      window.drawConnectors(
        activeCtx,
        selectedHandLandmarks,
        window.HAND_CONNECTIONS,
        { color: "#00FF00", lineWidth: 3 }
      );

      selectedHandLandmarks.forEach((landmark, index) => {
        let circleSize = 3;
        let color = "#ffffff";
        if (index === 5) {
          // Index 5 is the base of the index finger.
          color = "#FF0000";
          circleSize = 7;
        }
        activeCtx.fillStyle = color;
        activeCtx.beginPath();
        activeCtx.arc(landmark.x * activeCanvas.width, landmark.y * activeCanvas.height, circleSize, 0, 2 * Math.PI);
        activeCtx.fill();
      });
    }

    onResultsCallback({
      ...results,
      multiHandLandmarks: selectedHandLandmarks ? [selectedHandLandmarks] : []
    });
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
  setHand = null;

 console.log("Hand Tracking disabled");
}

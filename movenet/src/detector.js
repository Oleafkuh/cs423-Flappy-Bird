// Import TensorFlow.js and the MoveNet pose detection model.
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';
import {isPositionAFlap} from './movement-calculations';
import { drawSkeleton, drawKeypoints, incrementFlapCounter} from './draw';


// Use the GPU-accelerated backend for faster inference.
await tf.setBackend('webgl');

// Grab the video and canvas elements used for rendering.
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

export {ctx};

// Request webcam access and wait until the video metadata is ready.
async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 1920, height: 1080 },
    audio: false
  });
  video.srcObject = stream;

  return new Promise(resolve => {
    video.onloadedmetadata = () => resolve(video);
  });
}

//creates map for keypoints for easy manipulation of data.  Uses name as key
function keypointsToMap(keypoints) {
  const map = {};
  for (const kp of keypoints) {
    map[kp.name] = kp;
  }
  return map;
}



// Main setup: initialize camera, canvas, model, and the render loop.
async function main() {
  await setupCamera();

  // Match the canvas size to the live video feed.
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  // Create a MoveNet detector (single-person, lightweight model).
  const detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
    }
  );
  console.log("detector up and running");

  // Render loop: run pose estimation and draw each frame.
  async function render() {
    const poses = await detector.estimatePoses(video);

    // Clear previous frame and draw current keypoints.
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pose = poses[0];

    drawKeypoints(pose?.keypoints || []);

    const kp = keypointsToMap(pose?.keypoints || []);

    drawSkeleton(kp);

    if (isPositionAFlap(kp)) {
        incrementFlapCounter();
    }

   requestAnimationFrame(render); //draws the new frame on the next broswer repaint and calls render continuing the loop
  }

  render();
}

// Kick off the app.
main();

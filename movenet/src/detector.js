// Import TensorFlow.js and the MoveNet pose detection model.
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';
import {isRightArmRaised} from './movement-calculations';


// Use the GPU-accelerated backend for faster inference.
await tf.setBackend('webgl');

// Grab the video and canvas elements used for rendering.
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

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

// Draw visible keypoints (joints) on the canvas.
function drawKeypoints(keypoints) {
  ctx.fillStyle = 'red';

  keypoints.forEach(kp => {
    if (kp.score > 0.4) {
      ctx.beginPath();
      ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
  });
}

// Draw a simple status indicator circle.
function drawStatusCircle(color) {
  ctx.beginPath();
  ctx.arc(30, 30, 12, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
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

  // Render loop: run pose estimation and draw each frame.
  async function render() {
    const poses = await detector.estimatePoses(video);

    // Clear previous frame and draw current keypoints.
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pose = poses[0];
    drawKeypoints(pose?.keypoints || []);

    const kp = keypointsToMap(pose?.keypoints || []);

    if (isRightArmRaised(kp)) {
        drawStatusCircle('green');

    } else {
      drawStatusCircle('red');
    }

    requestAnimationFrame(render); //draws the new frame on the next broswer repaint and calls render continuing the loop
  }

  render();
}

// Kick off the app.
main();

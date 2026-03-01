// All functions related to drawing on screen for visualizing skelecton

//  How 2D graph is layed out
//       x   1920   --------    --  - - - - - - 0
//    y
//    
//    0
//    |
//    |
//    |
//   1080

let ctx = null;

export function setDrawContext(context) {
  ctx = context;
}


const SKELETON = [
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],

  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
];

const ValidDrawPoints = { 'left_shoulder': true, 'right_shoulder': true, 'left_elbow': true, 'right_elbow': true, 'left_wrist': true, 'right_wrist': true, 'left_hip': true, 'right_hip': true };

export function drawFlapLine(lineYPos, XofLeftShoulder, XofRightShoulder, color) {
  if (!ctx) return;
  ctx.lineWidth = 4;
  ctx.strokeStyle = color;
   ctx.beginPath();
    ctx.moveTo( XofLeftShoulder + 100, lineYPos);
    ctx.lineTo( XofRightShoulder - 100, lineYPos);
    ctx.stroke();
}

// Draw visible keypoints (joints) on the canvas.
export function drawKeypoints(keypoints) {
  if (!ctx) return;
  keypoints.forEach(kp => {
    if (kp.score > 0.4 && ValidDrawPoints[kp.name]) {
      ctx.fillStyle =
        kp.score > 0.6 ? 'lime' :
        'yellow';

      ctx.beginPath();
      ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
      ctx.fill();
      //console.log(kp.name,kp.x,kp.y);
    }
  });
}

export function drawSkeleton(kp) {
  if (!ctx) return;
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'white';

  SKELETON.forEach(([a, b]) => {
    const p1 = kp[a];
    const p2 = kp[b];

    // Confidence gating (IMPORTANT)
    if (!p1 || !p2) return;
    if (p1.score < 0.4 || p2.score < 0.4) return;

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  });
}

// display true or false for flap reset
export function setResetLabel(reset) {
  const resetLabel = document.getElementById('ResetLabel');
   resetLabel.style.color = reset ? "green" : "red";
  resetLabel.textContent = reset ? "TRUE" : "FALSE";
}

export function PersonInFrameLabel(bool) {
  const label = document.getElementById('PersonInFrame');
  label.textContent = bool ? "" : "GET IN FRAME";
}
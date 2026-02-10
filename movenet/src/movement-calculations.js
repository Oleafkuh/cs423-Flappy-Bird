import { drawFlapLine, setResetLabel} from './draw.js';

let reset = false;  //global variable tracking if flap has been reset

export function isPositionAFlap(kp) {
    try {
  if (kp.right_wrist.score < 0.4 || kp.right_shoulder.score < 0.4) {
    return false;
  }

  let flapHitLineY = (kp.right_shoulder.y + kp.right_hip.y) / 2;
  let flapResetLineY = (kp.left_shoulder.y + kp.right_shoulder.y) / 2;
  let rightShoulderX = kp.right_shoulder.x; let leftShoulderX = kp.left_shoulder.x;

  drawFlapLine(flapHitLineY, leftShoulderX, rightShoulderX, 'green');
  drawFlapLine(flapResetLineY, leftShoulderX, rightShoulderX, 'red');

  // Takes lowest point (either elbow or wrist) for determining if flap occured
const flapPos = kp.right_wrist.y > kp.right_elbow.y ? kp.right_wrist.y : kp.right_elbow.y;

if (flapPos < flapResetLineY) { reset = true;  setResetLabel(reset); }

  if (reset && flapPos > flapHitLineY) {
    reset = false;
    setResetLabel(reset);
    return true;
  }
  return false;
}
catch (e) {
    console.log(e);
 return false;
}
}
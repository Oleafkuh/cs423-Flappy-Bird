/*
  Calculations of all movements
*/

import { drawFlapLine, setResetLabel, PersonInFrameLabel} from './draw.js';

let reset = false;  //global variable tracking if flap has been reset


//draws invisiable lines on each frame that determines if a flap was complished or not
//  uncomment drawFlapLine Function to see lines
export function isPositionAFlap(kp) {
    try {
  let shoulderYAver = (kp.left_shoulder.y + kp.right_shoulder.y) / 2;
  let hipYAver = (kp.left_hip.y + kp.right_hip.y) / 2;
  let flapHitLineY = (shoulderYAver + hipYAver) / 2;
  let flapResetLineY = (shoulderYAver + hipYAver) / 2.5;
  let rightShoulderX = kp.right_shoulder.x; let leftShoulderX = kp.left_shoulder.x;

  drawFlapLine(flapHitLineY, leftShoulderX, rightShoulderX, 'green'); // User must get purple line below green to register a flap, if they have reset their stance
  drawFlapLine(flapResetLineY, leftShoulderX, rightShoulderX, 'red'); // rest line below shoulders.  User must reset before each counted flap

 
//const averages out the Y distance of the wrists and the elbows
const flapPos = (((kp.right_wrist.y + kp.left_wrist.y) /2 ) + ((kp.right_elbow.y + kp.left_elbow.y) /2)) / 2

 drawFlapLine(flapPos, leftShoulderX, rightShoulderX, 'purple'); //line the represents the position of where the flap is

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

//checks to see if every point used for calculation is in frame
export function isPersonInFrame(kp) {
  const requiredKeypoints = ['right_wrist', 'left_wrist', 'right_shoulder', 'left_shoulder', 'right_elbow', 'left_elbow'];

   try{
   if (requiredKeypoints.every(kp_name => kp[kp_name].score > 0.4)) {
   //console.log("person is fully in frame");
   PersonInFrameLabel(true);
   return true;
  }
  else {
    PersonInFrameLabel(false);
       return false;
  }
}
  catch { //if key point doesn't exist it will throw an error and we simply return false
    PersonInFrameLabel(false);
       return false;
   
  }
  
}

// In dead-state selection mode:
// - left wrist above left shoulder => return "left"
// - right wrist above right shoulder => return "right"
// if both are up return null, this stops accidental inputs
export function getDeadStateWristSelection(kp) {
  try {
    const hasConfidence =
      kp.left_wrist.score > 0.4 &&
      kp.right_wrist.score > 0.4 &&
      kp.left_shoulder.score > 0.4 &&
      kp.right_shoulder.score > 0.4;

    if (!hasConfidence) {
      return null;
    }

    const leftRaised = kp.left_wrist.y < kp.left_shoulder.y;
    const rightRaised = kp.right_wrist.y < kp.right_shoulder.y;

    // Only allow side selection when exactly one wrist is raised.
    if (leftRaised && !rightRaised) {
      return "left";
    }

    if (rightRaised && !leftRaised) {
      return "right";
    }

    return null;
  } catch {
    return null;
  }
}
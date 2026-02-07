export  function isRightArmRaised(kp) {
  if (kp.right_wrist.score < 0.4 || kp.right_shoulder.score < 0.4) {
    return false;
  }

  return kp.right_wrist.y < kp.right_shoulder.y;
}
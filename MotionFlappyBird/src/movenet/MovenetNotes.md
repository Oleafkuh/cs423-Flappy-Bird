

Each frame is we run this and grab the pose estimated by the machine learning algorithm

        const poses = await detector.estimatePoses(video);

By default this will give us one pose so we can get this out of the list with

        const pose = poses[0];
        const keypoints = pose.keypoints;

Keypoints are the dots and represent each joint/body part the computer detected.  


Keypoint data example:
        {
        name: 'right_wrist',
        x: 412.3,
        y: 218.9,
        score: 0.97  -confidence it's in the correct position
        }


There are 17 keypoints that can be detected:
        [
        'nose',
        'left_eye', 'right_eye',
        'left_ear', 'right_ear',
        'left_shoulder', 'right_shoulder',
        'left_elbow', 'right_elbow',
        'left_wrist', 'right_wrist',
        'left_hip', 'right_hip',
        'left_knee', 'right_knee',
        'left_ankle', 'right_ankle'
        ]

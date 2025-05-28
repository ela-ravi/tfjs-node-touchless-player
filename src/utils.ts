
// Below constant is taken from node_modules/@tensorflow-models/hand-pose-detection/dist/constants.js
const MEDIAPIPE_CONNECTED_KEYPOINTS_PAIRS = [
    [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7],
    [7, 8], [0, 9], [9, 10], [10, 11], [11, 12], [0, 13], [13, 14],
    [14, 15], [15, 16], [0, 17], [17, 18], [18, 19], [19, 20]
];
const FINGER_LOOKUP_INDICES = {
    thumb: [0, 1, 2, 3, 4],
    indexFinger: [0, 5, 6, 7, 8],
    middleFinger: [0, 9, 10, 11, 12],
    ringFinger: [0, 13, 14, 15, 16],
    pinky: [0, 17, 18, 19, 20],
} as const;

type FINGER = keyof typeof FINGER_LOOKUP_INDICES;

export { MEDIAPIPE_CONNECTED_KEYPOINTS_PAIRS, FINGER_LOOKUP_INDICES, FINGER }
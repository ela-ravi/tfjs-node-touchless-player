import { GESTURES_ENUM } from "./enums";

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


const triggerAction = (gesture: GESTURES_ENUM, video: HTMLVideoElement, audio: HTMLAudioElement) => {
    console.log(`Gesture detected: ${gesture}`);
    audio.play(); // To inform user that a gesture is detected or an action is triggered (can be null gesture / action as well)
    switch (gesture) {
        case GESTURES_ENUM.play:
            video.play();
            break;
        case GESTURES_ENUM.pause:
            video.pause();
            break;
        case GESTURES_ENUM.volumeUp:
            video.volume = Math.min(1, video.volume + 0.1);
            break;
        case GESTURES_ENUM.volumeDown:
            video.volume = Math.max(0, video.volume - 0.1);
            break;
        case GESTURES_ENUM.forward:
            video.currentTime += 5;
            break;
        case GESTURES_ENUM.backward:
            video.currentTime -= 5;
            break;
    }
}


export { MEDIAPIPE_CONNECTED_KEYPOINTS_PAIRS, FINGER_LOOKUP_INDICES, triggerAction }
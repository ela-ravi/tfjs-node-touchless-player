import * as handPoseDetection from "@tensorflow-models/hand-pose-detection";
import "@tensorflow/tfjs-backend-webgl";
import { FINGER, FINGER_ENUM, MEDIAPIPE_CONNECTED_KEYPOINTS_PAIRS } from "./utils";
import { FingersClip } from "./fingersClip";

let lastGesture = null;
let gestureStart = 0;

const vod = document.getElementById("video") as HTMLVideoElement;
const live = document.getElementById("mirror") as HTMLVideoElement;
// TODO: Check for Canvas support on curremt user browser
const canvas = document.getElementById("output") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");
const audioClick = document.getElementById("audio-click") as HTMLAudioElement;

// const select = document.getElementById("videos") as HTMLSelectElement;
// select.addEventListener("change", (e: Event) => {
//     const target = e.target as HTMLSelectElement;
//     const selectedValue = target.value;
//     const sourceElement = document.querySelector("source");
//     if (sourceElement && selectedValue) {
//         sourceElement.src = `./${selectedValue}.mp4`;
//         vod.load(); // Reload the video element to reflect the new source
//     }
// })
const model: handPoseDetection.SupportedModels = handPoseDetection.SupportedModels.MediaPipeHands;

const modelConfig: handPoseDetection.MediaPipeHandsTfjsModelConfig = {
    runtime: "tfjs",
}

function drawHand(predictions: handPoseDetection.Hand[]) {
    const keypoints2D = predictions[0].keypoints;
    MEDIAPIPE_CONNECTED_KEYPOINTS_PAIRS.forEach((pairs, index) => {
        const fingerPoint1 = keypoints2D[pairs[0]];
        const fingerPoint2 = keypoints2D[pairs[1]];
        if (ctx) {
            ctx.beginPath();
            ctx.moveTo(fingerPoint1.x, fingerPoint1.y);
            ctx.lineTo(fingerPoint2.x, fingerPoint2.y);
            ctx.strokeStyle = "green";
            ctx.stroke();

            ctx.beginPath(); // This is to draw below with separate style otherwise above drawn path will be applied to the styles defined below
            ctx.moveTo(fingerPoint2.x, fingerPoint2.y);
            ctx.strokeStyle = "red";
            ctx.arc(fingerPoint2.x, fingerPoint2.y, 2, 0, 2 * Math.PI)
            ctx.stroke();
            if (index >= 4 && index <= 7) {
                ctx.beginPath();
                ctx.strokeStyle = "black";
                ctx.strokeText(`${fingerPoint2.x.toFixed(0)}, ${fingerPoint2.y.toFixed(0)}`, fingerPoint2.x, fingerPoint2.y)
            }
        }

    })
}
async function detectHands(video: HTMLVideoElement) {
    const detector = await handPoseDetection.createDetector(model, modelConfig);
    const predictions = await detector.estimateHands(video, { flipHorizontal: true });
    if (ctx) {
        console.log("Estimated Hand Points:", predictions);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (predictions.length > 0) {
            drawHand(predictions);
            const handedness = predictions[0].handedness;
            const landmarks = predictions[0].keypoints;
            const gesture = getGesture(landmarks, handedness);
            console.log("getGesture:", gesture, handedness);
            const now = Date.now();
            // if (gesture && now - gestureStart > 1000) {
            //     gestureStart = now;
            //     lastGesture = now + 2000;
            //     console.log("GestureStart:", gestureStart);
            //     console.log("LastGesture:", lastGesture);
            // }
            // if (gesture && now - gestureStart > 1000) {
            //     console.log("Triggering action:", gesture);
            //     triggerAction(gesture);
            //     gestureStart = now + 2000;
            // }
            triggerAction(gesture);
        }

    }
    requestAnimationFrame(() => detectHands(live));
}

function getGesture(landmarks: handPoseDetection.Keypoint[], handedness: handPoseDetection.Hand["handedness"]) {

    const thumbTip = landmarks[4];
    const fingersClip = new FingersClip(landmarks, handedness);
    console.log("Hand:", fingersClip.getHandedness(), "\tFront:", fingersClip.isFront() ? "Front" : "Back");

    const isOpenPalm = () => {
        // TODO: try with array.every
        console.log("isOpenPalm:");
        // Thumb
        if (!fingersClip.fingerStraightDirections(FINGER_ENUM.thumb)?.up || fingersClip.containedInFourFingers(thumbTip)) return false;
        console.log("Thumb Straight up");
        // Index Finger
        if (!fingersClip.fingerStraightDirections(FINGER_ENUM.indexFinger)?.up) return false;
        console.log("Index Straight up");
        // Middle Finger
        if (!fingersClip.fingerStraightDirections(FINGER_ENUM.middleFinger)?.up) return false;
        console.log("Middle Straight up");
        // Ring Finger
        if (!fingersClip.fingerStraightDirections(FINGER_ENUM.ringFinger)?.up) return false;
        console.log("Ring Straight up");
        // Pinky Finger
        const p = fingersClip.fingerStraightDirections(FINGER_ENUM.pinky)?.up;
        if (p)
            console.log("Pinky Straight up");
        return p;

    }
    const isClosedFist = () => {
        // Check if fourFingers curled and thumb curled
        const isFourFingersCurledDown = fingersClip.isFourFingersCurledDown();
        const isThumbCurled = fingersClip.containedInFourFingers(thumbTip);
        console.log("isClosedFist: ", isFourFingersCurledDown, isThumbCurled);
        return isFourFingersCurledDown && isThumbCurled;
    }
    const isThumbsUp = () => {
        if (fingersClip.getHandedness() === "Right") {
            const isFourFingersCurledLeft = fingersClip.isFourFingersCurledLeft();
            const isThumbUp = fingersClip.fingerStraightDirections(FINGER_ENUM.thumb)?.up && !fingersClip.containedInFourFingers(thumbTip);
            console.log(`${fingersClip.getHandedness()} isThumbsUp: `, isFourFingersCurledLeft, isThumbUp);
            return isFourFingersCurledLeft && isThumbUp;
        } else {
            const isFourFingersCurledRight = fingersClip.isFourFingersCurledRight();
            const isThumbUp = fingersClip.fingerStraightDirections(FINGER_ENUM.thumb)?.up && !fingersClip.containedInFourFingers(thumbTip);
            console.log(`${fingersClip.getHandedness()} isThumbsUp: `, isFourFingersCurledRight, isThumbUp);
            return isFourFingersCurledRight && isThumbUp;
        }
    }

    const isThumbsDown = () => {
        if (fingersClip.getHandedness() === "Right") {
            const isFourFingersCurledLeft = fingersClip.isFourFingersCurledLeft();
            const isThumbDown = fingersClip.fingerStraightDirections(FINGER_ENUM.thumb)?.down && !fingersClip.containedInFourFingers(thumbTip)
            console.log(`${fingersClip.getHandedness()} isThumbsDown: `, isFourFingersCurledLeft, isThumbDown);
            return isFourFingersCurledLeft && isThumbDown;
        } else {
            const isFourFingersCurledRight = fingersClip.isFourFingersCurledRight();
            const isThumbDown = fingersClip.fingerStraightDirections(FINGER_ENUM.thumb)?.down && !fingersClip.containedInFourFingers(thumbTip)
            console.log(`${fingersClip.getHandedness()} isThumbsDown: `, isFourFingersCurledRight, isThumbDown);
            return isFourFingersCurledRight && isThumbDown;
        }
    }
    const isPointLeft = () => {
        const threeFingers = [FINGER_ENUM.middleFinger, FINGER_ENUM.ringFinger, FINGER_ENUM.pinky];
        if (fingersClip.getHandedness() === "Right") {
            const isThreeFingersCurledLeft = threeFingers.every((finger) => {
                return fingersClip.fingerCurledDirections(finger as FINGER)?.left
            });
            const isIndexPointLeft = fingersClip.fingerStraightDirections(FINGER_ENUM.indexFinger)?.left;
            console.log(`${fingersClip.getHandedness()} isPointLeft: `, isThreeFingersCurledLeft, isIndexPointLeft);
            return isThreeFingersCurledLeft && isIndexPointLeft;
        } else {
            const isThreeFingersCurledLeft = threeFingers.every((finger) => {
                return fingersClip.fingerCurledDirections(finger as FINGER)?.left
            });
            const isIndexPointLeft = fingersClip.fingerStraightDirections(FINGER_ENUM.indexFinger)?.left;
            console.log(`${fingersClip.getHandedness()} isPointLeft: `, isThreeFingersCurledLeft, isIndexPointLeft);
            return isThreeFingersCurledLeft && isIndexPointLeft;
        }
    }

    const isPointRight = () => {
        const threeFingers = [FINGER_ENUM.middleFinger, FINGER_ENUM.ringFinger, FINGER_ENUM.pinky];
        if (fingersClip.getHandedness() === "Right") {

            const isThreeFingersCurledRight = threeFingers.every((finger) => {
                return fingersClip.fingerCurledDirections(finger as FINGER)?.right
            });
            const isIndexPointRight = fingersClip.fingerStraightDirections(FINGER_ENUM.indexFinger)?.right;
            console.log(`${fingersClip.getHandedness()} isPointRight: `, isThreeFingersCurledRight, isIndexPointRight);
            return isThreeFingersCurledRight && isIndexPointRight;
        } else {
            const isThreeFingersCurledRight = threeFingers.every((finger) => {
                return fingersClip.fingerCurledDirections(finger as FINGER)?.right
            });
            const isIndexPointRight = fingersClip.fingerStraightDirections(FINGER_ENUM.indexFinger)?.right;
            console.log(`${fingersClip.getHandedness()} isPointRight: `, isThreeFingersCurledRight, isIndexPointRight);
            return isThreeFingersCurledRight && isIndexPointRight;
        }
    }

    const openPalm = isOpenPalm();
    const closedFist = isClosedFist();
    const thumbsUp = isThumbsUp();
    const thumbsDown = isThumbsDown();
    const pointLeft = isPointLeft();
    const pointRight = isPointRight();

    if (openPalm) return "play";
    if (closedFist) return "pause";
    if (thumbsUp) return "volume-up";
    if (thumbsDown) return "volume-down";
    if (pointRight) return "forward";
    if (pointLeft) return "backward";

    return null;
}

function triggerAction(gesture: any) {
    console.log(`Gesture detected: ${gesture}`);
    audioClick.play(); // To inform user that a gesture is detected or an action is triggered (can be null gesture / action as well)
    switch (gesture) {
        case "play":
            vod.play();
            break;
        case "pause":
            vod.pause();
            break;
        case "volume-up":
            vod.volume = Math.min(1, vod.volume + 0.1);
            break;
        case "volume-down":
            vod.volume = Math.max(0, vod.volume - 0.1);
            break;
        case "forward":
            vod.currentTime += 5;
            break;
        case "backward":
            vod.currentTime -= 5;
            break;
    }
}
navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
    live.srcObject = stream;
    live.play();
    detectHands(live);
});

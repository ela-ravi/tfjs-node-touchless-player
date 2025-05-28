import * as handPoseDetection from "@tensorflow-models/hand-pose-detection";
// import { Camera } from "@mediapipe/camera_utils";
import * as handpose from "@tensorflow-models/handpose";
import "@tensorflow/tfjs-backend-webgl";
import { FINGER, FINGER_LOOKUP_INDICES, MEDIAPIPE_CONNECTED_KEYPOINTS_PAIRS } from "./utils";
import { FingersClip } from "./fingersClip";

let lastGesture = null;
let gestureStart = 0;
const POINTS_PER_FINGER = 4;
const vod = document.getElementById("video") as HTMLVideoElement;
const live = document.getElementById("mirror") as HTMLVideoElement;
// TODO: Check for Canvas support on curremt user browser
const canvas = document.getElementById("output") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");

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
            const landmarks = predictions[0].keypoints;
            const gesture = getGesture(landmarks);
            console.log("getGesture:", gesture);
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

function getGesture(landmarks: handPoseDetection.Keypoint[]) {

    const thumbTip = landmarks[4];
    const pinkyMCP = landmarks[17];
    const fourFingersClip = new FingersClip(landmarks);

    // Move this isFingerStraight to fingersClip and make use of it from there.
    const isFingerStraight = (fingerPoints: handPoseDetection.Keypoint[]): boolean => {
        // Implement is StraightLeft, isStraightRight, isStraightDown
        let isStraightUp = fingerPoints.every((currentPoint, index, array) => {
            if (index < array.length - 1) {
                const nextPoint = array[index + 1];
                return currentPoint.y > nextPoint.y;
            }
            return true;  // The last point always passes
        })
        return isStraightUp;
    }
    const isOpenPalm = () => {

        const thumbFingerPoints = FINGER_LOOKUP_INDICES.thumb.map(index => landmarks[index]);
        if (!isFingerStraight(thumbFingerPoints) || fourFingersClip.contains(thumbTip)) return false;

        const indexFingerPoints = FINGER_LOOKUP_INDICES.indexFinger.map(index => landmarks[index]);
        if (!isFingerStraight(indexFingerPoints)) return false;


        const middleFingerPoints = FINGER_LOOKUP_INDICES.middleFinger.map(index => landmarks[index]);
        if (!isFingerStraight(middleFingerPoints)) return false;


        const ringFingerPoints = FINGER_LOOKUP_INDICES.ringFinger.map(index => landmarks[index]);
        if (!isFingerStraight(ringFingerPoints)) return false;


        const pinkyFingerPoints = FINGER_LOOKUP_INDICES.pinky.map(index => landmarks[index]);
        return isFingerStraight(pinkyFingerPoints);


    }
    const isClosedFist = () => {
        // Check if fourFingers curled and thumb curled
        const isFourFingersCurled = fourFingersClip.isFourFingersCurled();
        const isThumbCurled = fourFingersClip.contains(thumbTip);

        return isFourFingersCurled && isThumbCurled;
    }
    const isThumbsUp = () => {
        const isFourFingersCurled = fourFingersClip.isFourFingersCurled();
        console.log("isFourFingersCurled:", isFourFingersCurled);
        const boundingBox = fourFingersClip.getBoundingBox();
        const isThumUp =
            boundingBox
            && !fourFingersClip.contains(thumbTip)
            && thumbTip.y < boundingBox.top.y;
        return isFourFingersCurled && isThumUp;
    }
    const isThumbsDown = () => {
        const isFourFingersCurled = fourFingersClip.isFourFingersCurled();
        const boundingBox = fourFingersClip.getBoundingBox();
        const isThumDown =
            boundingBox
            && !fourFingersClip.contains(thumbTip)
            && thumbTip.y > boundingBox.top.y
            && thumbTip.y > pinkyMCP.y
        return isFourFingersCurled && isThumDown;
    }
    const isPointLeft = () => {
        const threeFingers = Object.keys(FINGER_LOOKUP_INDICES).filter(finger => !(["thumb", "indexFinger"].includes(finger)));
        const threeFingersCurled = threeFingers.every((finger) => {
            return fourFingersClip.isFingerCurled(finger as FINGER)
        });

        const isIndexPointLeft = isFingerStraight(FINGER_LOOKUP_INDICES.indexFinger.map(index => landmarks[index]))

    }
    // const isThumbUp =
    //     thumbTip.y < palmBase.y && Math.abs(indexTip.x - thumbTip.x) > 40;
    // const isThumbDown =
    //     thumbTip.y > palmBase.y && Math.abs(indexTip.x - thumbTip.x) > 40;
    // const isPointRight = indexTip.x > palmBase.x + 40 && middleTip.y > palmBase.y;
    // const isPointLeft = indexTip.x < palmBase.x - 40 && middleTip.y > palmBase.y;
    const openPalm = isOpenPalm();
    const closedFist = isClosedFist();
    const thumbsUp = isThumbsUp();
    const thumbsDown = isThumbsDown();
    console.log("isClosedFist:", closedFist);

    if (openPalm) return "play";
    if (closedFist) return "pause";
    if (thumbsUp) return "volume-up";
    if (thumbsDown) return "volume-down";
    // if (isPointRight) return "forward";
    // if (isPointLeft) return "backward";

    return null;
}

function triggerAction(gesture: any) {
    // console.log(`Gesture detected: ${gesture}`);
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
            vod.currentTime - +5;
            break;
    }
}
navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
    live.srcObject = stream;
    live.play();
    detectHands(live);
});

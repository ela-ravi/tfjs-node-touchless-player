import * as handPoseDetection from "@tensorflow-models/hand-pose-detection";
import "@tensorflow/tfjs-backend-webgl";
import { drawHand } from "./drawings";
import { GESTURES_ENUM } from "./enums";
import { triggerAction } from "./utils";
import { getGesture } from "./gestureCalculations";

let lastGesture: GESTURES_ENUM;
let gestureStart = 0;
// let timestamp = null;
let detector: handPoseDetection.HandDetector | null = null;
let animationFrameId = 0;
const gestureDebounceMs = 1000;

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
};

const initializeApp = async () => {

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        live.srcObject = stream;
        live.play();
        console.log("Initializing Handpose detector");
        detector = await handPoseDetection.createDetector(model, modelConfig);
        console.log("HandPose Detector loaded");
        detectHands(live);

    } catch (e) {
        console.error("Initialization error:", e)
    }
}
initializeApp();
if (animationFrameId) cancelAnimationFrame(animationFrameId)

const detectHands = async (video: HTMLVideoElement) => {
    if (detector) {
        const predictions = await detector.estimateHands(video, { flipHorizontal: true });
        if (ctx) {
            // console.log("Estimated Hand Points:", predictions);
            ctx.clearRect(0, 0, canvas.width, canvas.height); // To clear previously drawn hand
            if (predictions.length > 0) {
                drawHand(ctx, predictions);
                const handedness = predictions[0].handedness;
                const landmarks = predictions[0].keypoints;
                const gesture = getGesture(landmarks, handedness);
                console.log("getGesture:", gesture, handedness);
                const now = Date.now();

                const allowGestureChange = [GESTURES_ENUM.play, GESTURES_ENUM.pause].includes(lastGesture) ? lastGesture !== gesture : true;

                if (gesture && allowGestureChange && now - gestureStart > gestureDebounceMs) {
                    triggerAction(gesture, vod, audioClick);
                    lastGesture = gesture;
                    gestureStart = now;
                }
            }
        }
    }
    animationFrameId = requestAnimationFrame((/*time*/) => {
        // console.log("Frame time:", time);
        // timestamp = time;
        detectHands(live);
    });
}
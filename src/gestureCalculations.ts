import { Keypoint, Hand } from "@tensorflow-models/hand-pose-detection";
import { FINGER_ENUM, GESTURES_ENUM } from "./enums";
import { FingersClip } from "./fingersClip";
import { FINGER } from "./types";

const getGesture = (landmarks: Keypoint[], handedness: Hand["handedness"]): GESTURES_ENUM | null => {

    const thumbTip = landmarks[4];
    const fingersClip = new FingersClip(landmarks, handedness);
    console.log("Hand:", fingersClip.getHandedness(), "\tFront:", fingersClip.isFront() ? "Front" : "Back");

    const isOpenPalm = () => {
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
        const pinky = fingersClip.fingerStraightDirections(FINGER_ENUM.pinky)?.up;
        if (pinky)
            console.log("Pinky Straight up");
        return pinky;

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

    if (openPalm) return GESTURES_ENUM.play;
    if (closedFist) return GESTURES_ENUM.pause;
    if (thumbsUp) return GESTURES_ENUM.volumeUp;
    if (thumbsDown) return GESTURES_ENUM.volumeDown;
    if (pointRight) return GESTURES_ENUM.forward;
    if (pointLeft) return GESTURES_ENUM.backward;

    return null;
}

export { getGesture }
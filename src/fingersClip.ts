/**
 * This should return
 * - isFingerStraight
 * - isFingerCurled
 * - isFourFingersCurled (boolean)
 * - isThumbCurled
 * - boundingBox (For both front and back of hand)
 * - contains
 * - isFront
 */
//  TODO: Work on handposes that should not work and initmate user to change like curled left all fingers (user might test feature to move backward) (Try to add threhold to indexfinger points x difference so that if its satisfied, go for backward only when index is straight left() )
import * as handPoseDetection from "@tensorflow-models/hand-pose-detection";
import { FINGER_LOOKUP_INDICES, FINGER, FINGER_ENUM, DIRECTIONS } from "./utils";

export class FingersClip {
    private keyPoints: handPoseDetection.Keypoint[];
    private handedness: handPoseDetection.Hand["handedness"];

    constructor(keyPoints: handPoseDetection.Keypoint[], handedness: handPoseDetection.Hand["handedness"]) {
        this.keyPoints = keyPoints;
        this.handedness = handedness;
    }

    isFront(): boolean {
        if (this.keyPoints.length <= 0) {
            console.error("There are no predictions by handpose model. Please check if modal is loaded or not");
            return false; // TODO throw error
        }
        const index_pip = this.keyPoints[6];
        const pinky_pip = this.keyPoints[18];
        const rightHandFront = (this.handedness === "Right") && index_pip.x < pinky_pip.x;
        const leftHandFront = (this.handedness === "Left") && index_pip.x > pinky_pip.x;
        return rightHandFront || leftHandFront;
    }
    getHandedness() {
        return this.handedness;
    }

    fingerStraightDirections(finger: FINGER, consoleIt = false): DIRECTIONS | null {
        // TODO: Solve when a finger is 45% eg: left up 45% etc..,
        if (this.keyPoints.length <= 0) {
            console.error("There are no predictions by handpose model. Please check if modal is loaded or not")
            return null; // TODO throw error
        }
        const fingerIndices = FINGER_LOOKUP_INDICES[finger as FINGER];
        const fingerPoints = fingerIndices.map(index => this.keyPoints[index]);

        // Straight UP
        const isStraightUp = fingerPoints.every((currentPoint, index, array) => {
            if (index < array.length - 1) {
                const nextPoint = array[index + 1];
                return currentPoint.y > nextPoint.y;
            }
            return true;  // The last point always passes
        })

        // Straight Down
        const isStraightDown = fingerPoints.every((currentPoint, index, array) => {
            if (index < array.length - 1) {
                const nextPoint = array[index + 1];
                return currentPoint.y < nextPoint.y;
            }
            return true;  // The last point always passes
        })

        // Straight Left
        const isStraightLeft = fingerPoints.every((currentPoint, index, array) => {
            if (index < array.length - 1) {
                const nextPoint = array[index + 1];
                return currentPoint.x > nextPoint.x;
            }
            return true;  // The last point always passes
        })

        // Straight Right
        const isStraightRight = fingerPoints.every((currentPoint, index, array) => {
            if (index < array.length - 1) {
                const nextPoint = array[index + 1];
                return currentPoint.x < nextPoint.x;
            }
            return true;  // The last point always passes
        })
        const directions: DIRECTIONS = {
            up: isStraightUp,
            down: isStraightDown,
            left: isStraightLeft,
            right: isStraightRight
        }
        if (consoleIt) console.log("fingerStraightDirections: ", directions);
        return directions

    }

    private isFingerCurledDown(pip: handPoseDetection.Keypoint, dip: handPoseDetection.Keypoint, tip: handPoseDetection.Keypoint, consoleIt = false) {
        // pip.y < dip.y < tip.y;
        // differences between pip, dip and tip X's should be < threshold(15)
        const curledDownXThreshold = 15;
        const isXSatisfied = (Math.abs(pip.x - dip.x) < curledDownXThreshold) && (Math.abs(dip.x - tip.x) < curledDownXThreshold);
        const isYSatisfied = (pip.y < dip.y) && (dip.y < tip.y);
        if (consoleIt)
            console.log("x and y: ", isXSatisfied, isYSatisfied);
        return isXSatisfied && isYSatisfied;
    }
    private isFingerCurledLeft(pip: handPoseDetection.Keypoint, dip: handPoseDetection.Keypoint, tip: handPoseDetection.Keypoint, consoleIt = false) {
        // pip.x < dip.x < tip.x
        // differences between pip, dip and tip Y's should be < threshold(15)
        const curledLeftYThreshold = 15;
        const isXSatisfied = (pip.x < dip.x) && (dip.x < tip.x);
        const isYSatisfied = (Math.abs(pip.y - dip.y) < curledLeftYThreshold) && (Math.abs(dip.y - tip.y) < curledLeftYThreshold);
        if (consoleIt)
            console.log("x and y: ", isXSatisfied, isYSatisfied);
        return isXSatisfied && isYSatisfied;
    }
    private isFingerCurledRight(pip: handPoseDetection.Keypoint, dip: handPoseDetection.Keypoint, tip: handPoseDetection.Keypoint, consoleIt = false) {
        // pip.x > dip.x > tip.x
        // differences between pip, dip and tip Y's should be < threshold(15)
        const curledLeftYThreshold = 15;
        const isXSatisfied = (pip.x > dip.x) && (dip.x > tip.x);
        const isYSatisfied = (Math.abs(pip.y - dip.y) < curledLeftYThreshold) && (Math.abs(dip.y - tip.y) < curledLeftYThreshold);
        if (consoleIt)
            console.log("isFingerCurledRight x and y : ", isXSatisfied, isYSatisfied);
        return isXSatisfied && isYSatisfied;
    }

    fingerCurledDirections(finger: FINGER, consoleIt = false): DIRECTIONS | null {
        if (this.keyPoints.length <= 0) {
            console.error("There are no predictions by handpose model. Please check if modal is loaded or not")
            return null; // TODO throw error
        }
        const fingerIndices = FINGER_LOOKUP_INDICES[finger as FINGER];
        const pip = this.keyPoints[fingerIndices[2]];
        const dip = this.keyPoints[fingerIndices[3]];
        const tip = this.keyPoints[fingerIndices[4]];


        const isCurledDownwards = this.isFingerCurledDown(pip, dip, tip, consoleIt);

        //  6------<--    |   6-----<-    |   6----<---8   |    6 - Index_PIP
        //   \___7        |    \__7___8   |    \___7       |    7 - Index_DIP
        //        \__8    |               |                |    8 - Index_TIP
        const isCurledLeftSidewards = this.isFingerCurledLeft(pip, dip, tip, consoleIt);
        const isCurledRightSidewards = this.isFingerCurledRight(pip, dip, tip, consoleIt);

        const directions: DIRECTIONS = {
            up: false, // its difficult to curl fingers UP while sitting
            down: isCurledDownwards,
            left: isCurledLeftSidewards,
            right: isCurledRightSidewards
        }
        if (consoleIt) {
            // console.log(finger, " - pip: ", pip);
            // console.log(finger, " - dip: ", dip);
            // console.log(finger, " - tip: ", tip);
            console.log("fingerCurledDirections: ", directions);
        }

        return directions
    }

    /**
     * @returns boolean
     * LOGIC:
     * Check below predicate for fourFingers (meaning except thumb).
     * - if all PIP.y > all DIP.y and all DIP.y > all TIP.y
     */
    fourFingersCurledDirections(consoleIt = false) {
        if (this.keyPoints.length <= 0) {
            console.error("There are no predictions by handpose model. Please check if modal is loaded or not")
            return null; // TODO throw error
        }
        return {
            [FINGER_ENUM.indexFinger]: this.fingerCurledDirections(FINGER_ENUM.indexFinger, consoleIt),
            [FINGER_ENUM.middleFinger]: this.fingerCurledDirections(FINGER_ENUM.middleFinger, consoleIt),
            [FINGER_ENUM.ringFinger]: this.fingerCurledDirections(FINGER_ENUM.ringFinger, consoleIt),
            [FINGER_ENUM.pinky]: this.fingerCurledDirections(FINGER_ENUM.pinky, consoleIt),
        }
    }
    isFourFingersCurledDown(consoleIt = false) {
        const fourFingers = this.fourFingersCurledDirections(consoleIt);
        if (fourFingers) {
            return (Object.values(fourFingers) as DIRECTIONS[]).every(direction => direction.down)
        }
        console.error("There are no predictions by handpose model. Please check if modal is loaded or not")
        return false; // TODO throw error
    }
    isFourFingersCurledLeft(consoleIt = false) {
        const fourFingers = this.fourFingersCurledDirections(consoleIt);
        if (fourFingers) {
            return (Object.values(fourFingers) as DIRECTIONS[]).every(direction => direction.left)
        }
        console.error("There are no predictions by handpose model. Please check if modal is loaded or not")
        return false; // TODO throw error
    }
    isFourFingersCurledRight(consoleIt = false) {
        const fourFingers = this.fourFingersCurledDirections(consoleIt);
        if (fourFingers) {
            return (Object.values(fourFingers) as DIRECTIONS[]).every(direction => direction.right)
        }
        console.error("There are no predictions by handpose model. Please check if modal is loaded or not")
        return false; // TODO throw error
    }
    /**
     * 
     * @returns {top: pixel, right: pixel, bottom: pixel, left: pixel, }
     * LOGIC:
     * -----------------   Front hand --------------------
     * find lowest x value in index finger for left bounding box
     * find highest x vale in pinky finger for right bounding box
     * find lowest y value in all the fingers for top bounding box
     * Wrist value for bottom bounding box
     * -----------------  Back hand ----------------------
     * find lowest x value in pinky finger for left bounding box
     * find highest x vale in index finger for right bounding box
     * find lowest y value in all the fingers for top bounding box
     * Wrist value for bottom bounding box
     */
    getBoundingBox(consoleIt = false) {
        const boundingBox = {
            top: { x: 0, y: 0 },
            right: { x: 0, y: 0 },
            bottom: { x: 0, y: 0 },
            left: { x: 0, y: 0 }
        }

        if (this.keyPoints.length <= 0) {
            console.error("There are no predictions by handpose model. Please check if modal is loaded or not")
            return null;
        }

        // ------------------------ COMMON to front and back hand -----------------------------

        //   find lowest y value in all the fingers for top bounding box
        //   Wrist value for bottom bounding box


        // Top bounding box => find lowest y value in all the fingers
        const fourFingersIndices = Array(16).fill(5).map(n => n + 1); // Fingers without thumb
        const fourFingersPoints = fourFingersIndices.map(index => this.keyPoints[index]);
        const lowestYPoint = fourFingersPoints.reduce((minYPoint, currentPoint) => {
            return currentPoint.y < minYPoint.y ? currentPoint : minYPoint;
        }, fourFingersPoints[0])

        boundingBox.top.x = lowestYPoint.x;
        boundingBox.top.y = lowestYPoint.y;

        // Bottom bounding box => Wrist value
        boundingBox.bottom.x = this.keyPoints[0].x;
        boundingBox.bottom.y = this.keyPoints[0].y;

        // -----------------------------------------------------------------------------------

        // LeftHand Front === RightHand back
        // LeftHand Back === RightHand Front

        const leftHandFront = this.handedness === "Left" && this.isFront();
        const rightHandBack = this.handedness === "Right" && !this.isFront();
        const leftHandBack = this.handedness === "Left" && !this.isFront();
        const rightHandFront = this.handedness === "Right" && this.isFront();


        if (rightHandFront || leftHandBack) {

            // find lowest x value in index finger for left bounding box
            // find highest x vale in pinky finger for right bounding box

            // Left bounding box => find lowest x value in index finger
            const indexFingerIndices = FINGER_LOOKUP_INDICES.indexFinger.slice(1); // Ignoring wrist joint => [5,6,7,8]
            const indexFingerPoints = indexFingerIndices.map(index => this.keyPoints[index]);
            const lowestXPoint = indexFingerPoints.reduce((minXPoint, currentPoint) => {
                return currentPoint.x < minXPoint.x ? currentPoint : minXPoint;

            }, indexFingerPoints[0])

            boundingBox.left.x = lowestXPoint.x;
            boundingBox.left.y = lowestXPoint.y;

            // Right bounding box => find highest x value in pinky finger
            const pinkyFingerIndices = FINGER_LOOKUP_INDICES.pinky.slice(1);
            const pinkyFingerPoints = pinkyFingerIndices.map(index => this.keyPoints[index]);
            const highestXPoint = pinkyFingerPoints.reduce((maxXPoint, currentPoint) => {
                return currentPoint.x > maxXPoint.x ? currentPoint : maxXPoint;
            }, pinkyFingerPoints[0]);

            boundingBox.right.x = highestXPoint.x;
            boundingBox.right.y = highestXPoint.y;
            if (consoleIt) {
                console.log("rightHandFront || leftHandBack");
                console.log("boundingBox:", boundingBox);
            }
            return boundingBox;
        } else if (leftHandFront || rightHandBack) {
            // find lowest x value in pinky finger for left bounding box
            // find highest x vale in index finger for right bounding box

            // Left bounding box => find lowest x value in pinky finger
            const pinkyIndices = FINGER_LOOKUP_INDICES.pinky.slice(1); // Ignoring wrist joint => [5,6,7,8]
            const pinkyPoints = pinkyIndices.map(index => this.keyPoints[index]);
            const lowestXPoint = pinkyPoints.reduce((minXPoint, currentPoint) => {
                return currentPoint.x < minXPoint.x ? currentPoint : minXPoint;

            }, pinkyPoints[0])

            boundingBox.left.x = lowestXPoint.x;
            boundingBox.left.y = lowestXPoint.y;

            // Right bounding box => find highest x value in index finger
            const indexFingerIndices = FINGER_LOOKUP_INDICES.indexFinger.slice(1);
            const indexFingerPoints = indexFingerIndices.map(index => this.keyPoints[index]);
            const highestXPoint = indexFingerPoints.reduce((maxXPoint, currentPoint) => {
                return currentPoint.x > maxXPoint.x ? currentPoint : maxXPoint;
            }, indexFingerPoints[0]);

            boundingBox.right.x = highestXPoint.x;
            boundingBox.right.y = highestXPoint.y;
            if (consoleIt) {
                console.log("leftHandFront || rightHandBack");
                console.log("boundingBox:", boundingBox);
            }
            return boundingBox;
        }
    }

    containedInFourFingers(point: handPoseDetection.Keypoint) {
        const boundingBox = this.getBoundingBox();
        console.log(boundingBox, point);
        if (this.keyPoints.length > 0 && boundingBox)
            return point.x > boundingBox.left.x
                && point.x < boundingBox.right.x
                && point.y > boundingBox.top.y
                && point.y < boundingBox.bottom.y

        console.error("There are no predictions by handpose model. Please check if modal is loaded or not")
        return false; // TODO throw error

    }
}
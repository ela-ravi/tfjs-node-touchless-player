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
import { FINGER_LOOKUP_INDICES, FINGER, FINGER_ENUM, DIRECTION } from "./utils";

export class FingersClip {
    keyPoints: handPoseDetection.Keypoint[];

    constructor(keyPoints: handPoseDetection.Keypoint[]) {
        this.keyPoints = keyPoints;
    }

    isFront(): boolean {
        if (this.keyPoints.length <= 0) {
            console.error("There are no predictions by handpose model. Please check if modal is loaded or not");
            return false; // TODO throw error
        }
        const index_pip = this.keyPoints[6];
        const pinky_pip = this.keyPoints[18];
        if (index_pip.x < pinky_pip.x) {
            return true;
        }
        return false;
    }

    isFingerStraight(finger: FINGER): DIRECTION | null {
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

        return {
            up: isStraightUp,
            down: isStraightDown,
            left: isStraightLeft,
            right: isStraightRight
        }

    }

    private isFingerCurledDown(pip: handPoseDetection.Keypoint, dip: handPoseDetection.Keypoint, tip: handPoseDetection.Keypoint) {
        // pip.y < dip.y < tip.y;
        // differences between pip, dip and tip X's should be < threshold(15)
        const curledDownXThreshold = 15;
        const isXSatisfied = (Math.abs(pip.x - dip.x) < curledDownXThreshold) && (Math.abs(dip.x - tip.x) < curledDownXThreshold);
        const isYSatisfied = (pip.y < dip.y) && (dip.y < tip.y);
        return isXSatisfied && isYSatisfied;
    }
    private isFingerCurledLeft(pip: handPoseDetection.Keypoint, dip: handPoseDetection.Keypoint, tip: handPoseDetection.Keypoint) {
        // pip.x < dip.x < tip.x
        // differences between pip, dip and tip Y's should be < threshold(15)
        const curledLeftYThreshold = 15;
        const isXSatisfied = (pip.x < dip.x) && (dip.x < tip.x);
        const isYSatisfied = (Math.abs(pip.y - dip.y) < curledLeftYThreshold) && (Math.abs(dip.y - tip.y) < curledLeftYThreshold);
        return isXSatisfied && isYSatisfied;
    }
    private isFingerCurledRight(pip: handPoseDetection.Keypoint, dip: handPoseDetection.Keypoint, tip: handPoseDetection.Keypoint) {
        // pip.x > dip.x > tip.x
        // differences between pip, dip and tip Y's should be < threshold(15)
        const curledLeftYThreshold = 15;
        const isXSatisfied = (pip.x > dip.x) && (dip.x > tip.x);
        const isYSatisfied = (Math.abs(pip.y - dip.y) < curledLeftYThreshold) && (Math.abs(dip.y - tip.y) < curledLeftYThreshold);
        return isXSatisfied && isYSatisfied;
    }

    fingerCurledDirections(finger: FINGER): DIRECTION | null {
        if (this.keyPoints.length <= 0) {
            console.error("There are no predictions by handpose model. Please check if modal is loaded or not")
            return null; // TODO throw error
        }
        const fingerIndices = FINGER_LOOKUP_INDICES[finger as FINGER];
        const pip = this.keyPoints[fingerIndices[2]];
        const dip = this.keyPoints[fingerIndices[3]];
        const tip = this.keyPoints[fingerIndices[4]];

        // console.log(finger, " - pip: ", pip);
        // console.log(finger, " - dip: ", dip);
        // console.log(finger, " - tip: ", tip);

        const isCurledDownwards = this.isFingerCurledDown(pip, dip, tip);
        console.log(finger, " - isCurledDownwards:", isCurledDownwards);

        //  6------<--    |   6-----<-    |   6----<---8   |    6 - Index_PIP
        //   \___7        |    \__7___8   |    \___7       |    7 - Index_DIP
        //        \__8    |               |                |    8 - Index_TIP
        const isCurledLeftSidewards = this.isFingerCurledLeft(pip, dip, tip);
        console.log(finger, " - isCurledLeftSidewards:", isCurledLeftSidewards);

        const isCurledRightSidewards = this.isFingerCurledRight(pip, dip, tip);
        console.log(finger, " - isCurledRightSidewards:", isCurledRightSidewards);
        return {
            up: false,
            down: isCurledDownwards,
            left: isCurledLeftSidewards,
            right: isCurledRightSidewards
        }
    }

    /**
     * @returns boolean
     * LOGIC:
     * Check below predicate for fourFingers (meaning except thumb).
     * - if all PIP.y > all DIP.y and all DIP.y > all TIP.y
     */
    fourFingersCurledDirections() {
        if (this.keyPoints.length <= 0) {
            console.error("There are no predictions by handpose model. Please check if modal is loaded or not")
            return null; // TODO throw error
        }
        return {
            [FINGER_ENUM.indexFinger]: this.fingerCurledDirections(FINGER_ENUM.indexFinger),
            [FINGER_ENUM.middleFinger]: this.fingerCurledDirections(FINGER_ENUM.middleFinger),
            [FINGER_ENUM.ringFinger]: this.fingerCurledDirections(FINGER_ENUM.ringFinger),
            [FINGER_ENUM.pinky]: this.fingerCurledDirections(FINGER_ENUM.pinky),
        }
    }
    isFourFingersCurledDown() {
        const fourFingers = this.fourFingersCurledDirections();
        if (fourFingers) {
            return (Object.values(fourFingers) as DIRECTION[]).every(direction => direction.down)
        }
        console.error("There are no predictions by handpose model. Please check if modal is loaded or not")
        return false; // TODO throw error
    }
    isFourFingersCurledLeft() {
        const fourFingers = this.fourFingersCurledDirections();
        if (fourFingers) {
            return (Object.values(fourFingers) as DIRECTION[]).every(direction => direction.left)
        }
        console.error("There are no predictions by handpose model. Please check if modal is loaded or not")
        return false; // TODO throw error
    }
    isFourFingersCurledRight() {
        const fourFingers = this.fourFingersCurledDirections();
        if (fourFingers) {
            return (Object.values(fourFingers) as DIRECTION[]).every(direction => direction.right)
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
    getBoundingBox() {
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
        const fourFingersIndeces = Array(16).fill(5).map(n => n + 1); // Fingers without thumb
        const fourFingersPoints = fourFingersIndeces.map(index => this.keyPoints[index]);
        const lowestYPoint = fourFingersPoints.reduce((minYPoint, currentPoint) => {
            return currentPoint.y < minYPoint.y ? currentPoint : minYPoint;
        }, fourFingersPoints[0])

        boundingBox.top.x = lowestYPoint.x;
        boundingBox.top.y = lowestYPoint.y;

        // Bottom bounding box => Wrist value
        boundingBox.bottom.x = this.keyPoints[0].x;
        boundingBox.bottom.y = this.keyPoints[0].y;

        // -----------------------------------------------------------------------------------

        if (this.isFront()) {

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

            return boundingBox;
        } else {
            // find lowest x value in pinky finger for left bounding box
            // find highest x vale in index finger for right bounding box

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

            return boundingBox;
        }
    }

    containedInFourFingers(point: handPoseDetection.Keypoint) {
        const boundingBox = this.getBoundingBox();
        if (this.keyPoints.length > 0 && boundingBox)
            return point.x > boundingBox.left.x
                && point.x < boundingBox.right.x
                && point.y > boundingBox.top.y
                && point.y < boundingBox.bottom.y

        console.error("There are no predictions by handpose model. Please check if modal is loaded or not")
        return false; // TODO throw error

    }
}
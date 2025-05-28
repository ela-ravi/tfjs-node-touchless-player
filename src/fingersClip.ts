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
import * as handPoseDetection from "@tensorflow-models/hand-pose-detection";
import { FINGER_LOOKUP_INDICES, FINGER } from "./utils";

export class FingersClip {
    keyPoints: handPoseDetection.Keypoint[];
    fingersCurled: boolean;

    constructor(keyPoints: handPoseDetection.Keypoint[]) {
        this.fingersCurled = false;
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
    isFingerCurled(finger: FINGER) {
        const fingerIndeces = FINGER_LOOKUP_INDICES[finger as FINGER];
        console.log(`${finger}:`, (this.keyPoints[fingerIndeces[2]].y < this.keyPoints[fingerIndeces[3]].y), (this.keyPoints[fingerIndeces[3]].y < this.keyPoints[fingerIndeces[4]].y));
        const isCurledDownwards = ((this.keyPoints[fingerIndeces[2]].y < this.keyPoints[fingerIndeces[3]].y)
            && (this.keyPoints[fingerIndeces[3]].y < this.keyPoints[fingerIndeces[4]].y))
        const isCurledLeftSidewards = ((this.keyPoints[fingerIndeces[2]].y < this.keyPoints[fingerIndeces[3]].y)
            && (this.keyPoints[fingerIndeces[2]].y < this.keyPoints[fingerIndeces[4]].y))

        //  6------<--    |   6-----<-    |   6----<---8   |    6 - Index_PIP
        //   \___7        |    \__7___8   |    \___7       |    7 - Index_DIP
        //        \__8    |               |                |    8 - Index_TIP
        const isCurledRightSidewards = ((this.keyPoints[fingerIndeces[2]].y < this.keyPoints[fingerIndeces[3]].y)
            && ((this.keyPoints[fingerIndeces[2]].y < this.keyPoints[fingerIndeces[4]].y)
                || (this.keyPoints[fingerIndeces[4]].y < this.keyPoints[fingerIndeces[3]].y)
            ))
        return isCurledDownwards || isCurledLeftSidewards || isCurledRightSidewards;

    }

    /**
     * @returns boolean
     * LOGIC:
     * Check below predicate for fourFingers (meaning except thumb).
     * - if all PIP.y > all DIP.y and all DIP.y > all TIP.y
     */
    isFourFingersCurled(): boolean {
        if (this.keyPoints.length <= 0) {
            console.error("There are no predictions by handpose model. Please check if modal is loaded or not")
            return false; // TODO throw error
        }
        const fourFingers = Object.keys(FINGER_LOOKUP_INDICES).filter((fingerName) => (fingerName as FINGER) !== "thumb");
        console.log("curledDownwards");
        // const curledDownwards = fourFingers.every(finger => {
        //     const fingerIndeces = FINGER_LOOKUP_INDICES[finger as FINGER];
        //     console.log(`${finger}:`, (this.keyPoints[fingerIndeces[2]].y < this.keyPoints[fingerIndeces[3]].y), (this.keyPoints[fingerIndeces[3]].y < this.keyPoints[fingerIndeces[4]].y));
        //     return ((this.keyPoints[fingerIndeces[2]].y < this.keyPoints[fingerIndeces[3]].y)
        //         && (this.keyPoints[fingerIndeces[3]].y < this.keyPoints[fingerIndeces[4]].y))
        // })
        // console.log("curledSideWards");
        // const curledLeftSideWards = fourFingers.every(finger => {
        //     const fingerIndeces = FINGER_LOOKUP_INDICES[finger as FINGER];
        //     console.log(`${finger}:`, (this.keyPoints[fingerIndeces[2]].y < this.keyPoints[fingerIndeces[3]].y), (this.keyPoints[fingerIndeces[2]].y < this.keyPoints[fingerIndeces[4]].y));
        //     return ((this.keyPoints[fingerIndeces[2]].y < this.keyPoints[fingerIndeces[3]].y)
        //         && (this.keyPoints[fingerIndeces[2]].y < this.keyPoints[fingerIndeces[4]].y))
        // })
        // //  6------<--    |   6-----<-    |   6----<---8   |    6 - Index_PIP
        // //   \___7        |    \__7___8   |    \___7       |    7 - Index_DIP
        // //        \__8    |               |                |    8 - Index_TIP
        // const curledRightSideWards = fourFingers.every(finger => {
        //     const fingerIndeces = FINGER_LOOKUP_INDICES[finger as FINGER];
        //     console.log(`${finger}:`, (this.keyPoints[fingerIndeces[2]].y < this.keyPoints[fingerIndeces[3]].y), (this.keyPoints[fingerIndeces[2]].y < this.keyPoints[fingerIndeces[4]].y));
        //     return ((this.keyPoints[fingerIndeces[2]].y < this.keyPoints[fingerIndeces[3]].y)
        //         && ((this.keyPoints[fingerIndeces[2]].y < this.keyPoints[fingerIndeces[4]].y)
        //             || (this.keyPoints[fingerIndeces[4]].y < this.keyPoints[fingerIndeces[3]].y)
        //         ))
        // })
        // return curledDownwards || curledLeftSideWards || curledRightSideWards;
        return fourFingers.every(finger => {
            return this.isFingerCurled(finger as FINGER);
        })
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

    contains(point: handPoseDetection.Keypoint) {
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
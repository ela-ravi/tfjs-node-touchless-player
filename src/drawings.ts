import * as handPoseDetection from "@tensorflow-models/hand-pose-detection";
import { MEDIAPIPE_CONNECTED_KEYPOINTS_PAIRS } from "./utils";

const drawHand = (ctx: CanvasRenderingContext2D, predictions: handPoseDetection.Hand[]) => {
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
            // if (index >= 4 && index <= 7) {
            //     ctx.beginPath();
            //     ctx.strokeStyle = "black";
            //     ctx.strokeText(`${fingerPoint2.x.toFixed(0)}, ${fingerPoint2.y.toFixed(0)}`, fingerPoint2.x, fingerPoint2.y)
            // }
        }

    })
}

export { drawHand }
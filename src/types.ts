import { FINGER_LOOKUP_INDICES } from "./utils";

type FINGER = keyof typeof FINGER_LOOKUP_INDICES;
type DIRECTIONS = {
    up: boolean,
    down: boolean,
    left: boolean,
    right: boolean
}

export { FINGER, DIRECTIONS }

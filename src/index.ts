import SerialPort from "serialport";
import { connectBrick, findBrickPort } from "./utils";

export async function connectBrickByPort(portName: string) {
    return connectBrick(new SerialPort(portName, { autoOpen: false }));
}

export async function connectBrickById(brickId: string) {
    return connectBrickByPort(findBrickPort(await SerialPort.list(), brickId));
}

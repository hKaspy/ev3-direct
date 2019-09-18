import SerialPort from "serialport";
import { EV3 as EV3Brick } from "./EV3";

export async function connectBrick(brickPort: string) {
    const brick = new EV3Brick(brickPort);
    await brick.connect();
    const fwVersion = await brick.getFWVersion();
    // tslint:disable-next-line: no-console
    if (fwVersion !== "V1.09H") { console.warn(`Warning! This package is tested only on Firmware V1.09H. Your version (${fwVersion}) might not be supported.`); }
    return brick;
}

// "BTHENUM\{00001101-0000-1000-8000-00805F9B34FB}_LOCALMFG&0002\7&D82B5DB&0&00165360A4A3_C00000000"
export async function findBrickPort(brickId: string): Promise<string> {
    const regex = RegExp(`\\&${brickId.toUpperCase()}\\_`);
    const ports = await SerialPort.list();

    const brickPort = ports.find((port) => {
        if (port.pnpId === undefined) { return false; }
        return regex.test(port.pnpId);
    });

    if (brickPort === undefined) {
        throw new Error("Cannot find EV3 Brick with ID " + brickId);
    } else {
        return brickPort.comName;
    }
}

import SerialPort from "serialport";
import { EV3 } from "./EV3";

export async function connectBrick(sp: SerialPort) {
    const brick = new EV3(sp);
    await brick.connect();
    const fwVersion = await brick.getFWVersion();
    // tslint:disable-next-line: no-console
    if (fwVersion !== "V1.09H") { console.warn(`Warning! This package is tested only on Firmware V1.09H. Your version (${fwVersion}) might not be supported.`); }
    return brick;
}

export function findBrickPort(ports: SerialPort.PortInfo[], brickId: string): string {
    const regex = RegExp(`\\&${brickId.toUpperCase()}\\_`);

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

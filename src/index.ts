import SerialPort from "serialport";
import { EV3 } from "./EV3";

export { EV3, SerialPort };

export async function connectBrickByPort(portName: string): Promise<EV3> {
    return exports.connectBrick(new exports.SerialPort(portName, { autoOpen: false }));
}

export async function connectBrickById(brickId: string): Promise<EV3> {
    return exports.connectBrickByPort(exports.findBrickPort(await exports.SerialPort.list(), brickId));
}

export async function connectBrick(sp: SerialPort): Promise<EV3> {
    const brick: EV3 = new exports.EV3(sp);
    await brick.connect();

    const fwVersion = await Promise.race([
        brick.getFWVersion(),
        new Promise((resolve: (val: string) => void) => setTimeout(() => resolve("timeout"), 5000)),
    ]);

    if (fwVersion === "timeout") { throw new Error("Timeout waiting for response from EV3 Brick. Check conection."); }
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

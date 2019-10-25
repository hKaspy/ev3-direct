import SerialPort from "serialport";
import cmdcodes from "./cmdcodes";
import { EV3 } from "./EV3";
import opcodes from "./opcodes";

export { EV3, SerialPort, opcodes, cmdcodes };

/**
 * Connect to the EV3 Brick by specifying serial port name
 * @param portName something like "COM3" on Windows and "/dev/tty-usbserial1" on Linux
 */
export async function connectBrickByPort(portName: string): Promise<EV3> {
    return exports.connectBrick(new exports.SerialPort(portName, { autoOpen: false }));
}

/**
 * Connect to the EV3 Brick by specifying Brick ID
 * @param brickId 12 hexadecimal characters, found by navigating the EV3 Brick display: settings tab (🔧) -> Brick Info -> ID
 */
export async function connectBrickById(brickId: string): Promise<EV3> {
    return exports.connectBrickByPort(exports.findBrickPort(await exports.SerialPort.list(), brickId));
}

/**
 * Connect to the EV3 Brick by providing SerialPort instance
 * @param sp SerialPort instance
 * @param timeoutMS miliseconds to wait for control response from the EV3 Brick
 */
export async function connectBrick(sp: SerialPort, timeoutMS = 5000): Promise<EV3> {
    const brick: EV3 = new exports.EV3(sp);
    await brick.connect();

    const fwVersion = await Promise.race([
        brick.getFWVersion(),
        new Promise((resolve: (val: string) => void) => setTimeout(() => resolve("timeout"), timeoutMS)),
    ]);

    if (fwVersion === "timeout") { throw new Error("Timeout waiting for response from EV3 Brick. Check conection."); }
    // tslint:disable-next-line: no-console
    if (fwVersion !== "V1.09H") { console.warn(`Warning! This package is tested only on Firmware V1.09H. Your version (${fwVersion}) might not be supported.`); }
    return brick;
}

/**
 * Walk the provided ports array and find the one connected to EV3 Brick
 * @param ports array of ports from SerialPort.list()
 * @param brickId usually 12 hex characters
 */
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

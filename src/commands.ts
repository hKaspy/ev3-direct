import { ICommand } from "./utils";

export function batteryLevel(): ICommand {
    return {
        opcode: 0x81,
        params: [
            0x12,
            {
                allocSize: 1,
                data: 0,
                index: "global",
                length: 0,
                type: "variable",
            },
        ],
    };
}

export function batteryVoltage(): ICommand {
    return {
        opcode: 0x81,
        params: [
            0x01,
            {
                allocSize: 4,
                data: 0,
                index: "global",
                length: 1,
                type: "variable",
            },
        ],
    };
}

export function subFileCount(path: string): ICommand {
    return {
        opcode: 0xc0,
        params: [
            0x0d,
            {
                data: path,
                length: path.length,
                type: "constant",
            },
            {
                allocSize: 1,
                data: 0,
                index: "global",
                length: 0,
                type: "variable",
            },
        ],
    };
}

export function subFileName(dirPath: string, index: number): ICommand {
    return {
        opcode: 0xc0,
        params: [
            0x0f,
            {
                data: dirPath,
                length: dirPath.length,
                type: "constant",
            },
            {
                data: index,
                length: 1,
                type: "constant",
            },
            {
                data: 64,
                length: 1,
                type: "constant",
            },
            {
                allocSize: 64,
                data: 0,
                index: "global",
                length: 0,
                type: "variable",
            },
        ],
    };
}

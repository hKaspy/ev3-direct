import cmdc from "./cmdcodes";
import { EV3Base } from "./EV3Base";
import opc from "./opcodes";

export class EV3 extends EV3Base {

    public async doNothing() {
        // preserve returning Promise<void>
        await this.sendRequest([opc.nop]);
    }

    public async getBatteryCurrent() {
        const resp = await this.sendRequest([
            opc.uiRead,
            cmdc.uiRead.GET_IBATT,
            {
                bytes: 4,
                scope: "global",
                type: "float",
            },
        ]);

        return resp[0] as number;
    }

    public async getBatteryPercent() {
        const resp = await this.sendRequest([
            opc.uiRead,
            cmdc.uiRead.GET_LBATT,
            {
                bytes: 1,
                scope: "global",
                type: "int",
            },
        ]);

        return resp[0] as number;
    }

    public async getBatteryVoltage() {
        const resp = await this.sendRequest([
            opc.uiRead,
            cmdc.uiRead.GET_VBATT,
            {
                bytes: 4,
                scope: "global",
                type: "float",
            },
        ]);

        return resp[0] as number;
    }

    public async getBrickname() {
        const resp = await this.sendRequest([
            opc.comGet,
            cmdc.comGet.GET_BRICKNAME,
            {
                bytes: 0,
                value: 30,
            },
            {
                bytes: 30,
                scope: "global",
                type: "string",
            },
        ]);

        return resp[0] as string;
    }

    public async getFWVersion() {
        const resp = await this.sendRequest([
            opc.uiRead,
            cmdc.uiRead.GET_FW_VERS,
            {
                bytes: 0,
                value: 30,
            },
            {
                bytes: 30,
                scope: "global",
                type: "string",
            },
        ]);

        return resp[0] as string;
    }

    public async getHWVersion() {
        const resp = await this.sendRequest([
            opc.uiRead,
            cmdc.uiRead.GET_HW_VERS,
            {
                bytes: 0,
                value: 30,
            },
            {
                bytes: 30,
                scope: "global",
                type: "string",
            },
        ]);

        return resp[0] as string;
    }

    public async getOSVersion() {
        const resp = await this.sendRequest([
            opc.uiRead,
            cmdc.uiRead.GET_OS_VERS,
            {
                bytes: 0,
                value: 30,
            },
            {
                bytes: 30,
                scope: "global",
                type: "string",
            },
        ]);

        return resp[0] as string;
    }

    /**
     * Get total size of the file/folder in kB
     * @param path file path
     */
    public async getFileSize(path: string) {
        const resp = await this.sendRequest([
            opc.filename,
            cmdc.filename.TOTALSIZE,
            path,
            {
                bytes: 4,
                scope: "global",
                type: "int",
            },
            {
                bytes: 4,
                scope: "global",
                type: "int",
            },
        ]);

        return resp[2] as number;
    }

    public async getSubfolders(path: string) {
        const count = await this.getSubfolderCount(path);
        const subs: string[] = [];

        for (let i = 0; i < count; i++) {
            subs.push(await this.getSubfolderName(path, i + 1));
        }

        return subs;
    }

    public async getSubfolderCount(path: string) {
        const resp = await this.sendRequest([
            opc.file,
            cmdc.file.GET_FOLDERS,
            path,
            {
                bytes: 1,
                scope: "global",
                type: "int",
            },
        ]);

        return resp[0] as number;
    }

    public async getSubfolderName(dirPath: string, index: number) {
        const resp = await this.sendRequest([
            opc.file,
            cmdc.file.GET_SUBFOLDER_NAME,
            dirPath,
            {
                bytes: 1,
                value: index,
            },
            {
                bytes: 1,
                value: 64,
            },
            {
                bytes: 64,
                scope: "global",
                type: "string",
            },
        ]);

        return resp[0] as string;
    }

    public async fileExists(path: string) {
        const resp = await this.sendRequest([
            opc.filename,
            cmdc.filename.EXIST,
            path,
            {
                bytes: 1,
                scope: "global",
                type: "int",
            },
        ]);

        return (resp[0] as number) === 1;
    }

    /**
     * Set Brick button backlight color
     * @param color backlight color
     * @param cycle lighting effect
     */
    public async setButtonLight(color: "off" | "green" | "orange" | "red", cycle: "still" | "flash" | "pulse" = "still") {
        let flag: number;

        if (color === "off") {
            flag = 0;
        } else {
            flag = color === "green" ? 1 : color === "red" ? 2 : 3;
            flag += cycle === "still" ? 0 : cycle === "flash" ? 3 : 6;
        }

        await this.sendRequest([
            opc.uiWrite,
            cmdc.uiWrite.LED,
            {
                bytes: 1,
                value: flag,
            },
        ]);
    }

    /**
     * Set Brick volume
     * @param percent volume 0 - 100%
     */
    public async setVolume(percent: number) {
        if (percent < 0 || percent > 100) { throw new RangeError("Argument 'percent' must be >= 0 and <= 100."); }
        await this.sendRequest([
            opc.info,
            cmdc.info.SET_VOLUME,
            {
                bytes: 1,
                value: percent,
            },
        ]);
    }
}

import { EV3Brick } from "./EV3Brick";

export class EV3 extends EV3Brick {

    public async doNothing() {
        await this.sendRequest([0x01]);
    }

    public async getBatteryPercent() {
        const resp = await this.sendRequest([
            0x81,
            0x12,
            {
                bytes: 1,
                scope: "global",
                type: "int",
            },
        ]);

        return resp[0].value as number;
    }

    public async getBatteryVoltage() {
        const resp = await this.sendRequest([
            0x81,
            0x01,
            {
                bytes: 4,
                scope: "global",
                type: "float",
            },
        ]);

        return resp[0].value as number;
    }

    public async getBatteryCurrent() {
        const resp = await this.sendRequest([
            0x81,
            0x02,
            {
                bytes: 4,
                scope: "global",
                type: "float",
            },
        ]);

        return resp[0].value as number;
    }

    public async getBrickname() {
        const resp = await this.sendRequest([
            0xd3,
            0x0d,
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

        return resp[0].value as number;
    }

    public async getFWVersion() {
        const resp = await this.sendRequest([
            0x81,
            0x0a,
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

        return resp[0].value as string;
    }

    public async getHWVersion() {
        const resp = await this.sendRequest([
            0x81,
            0x09,
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

        return resp[0].value as string;
    }

    public async getOSVersion() {
        const resp = await this.sendRequest([
            0x81,
            0x03,
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

        return resp[0].value as string;
    }

    public async getSubfolders(path: string) {
        const count = await this._getSubfolderCount(path);
        const subs: string[] = [];

        for (let i = 1; i < count; i++) {
            subs.push(await this._getSubfolderName(path, i));
        }

        return subs;
    }

    public async _getSubfolderCount(path: string) {
        const resp = await this.sendRequest([
            0xc0,
            0x0d,
            path,
            {
                bytes: 1,
                scope: "global",
                type: "int",
            },
        ]);

        return resp[0].value as number;
    }

    public async _getSubfolderName(dirPath: string, index: number) {
        const resp = await this.sendRequest([
            0xc0,
            0x0f,
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

        return resp[0].value as string;
    }
}

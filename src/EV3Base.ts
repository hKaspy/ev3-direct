import SerialPort from "serialport";
import { Broker } from "./Broker";
import { createPointerMap, decodeResponseBody, decodeResponseHead, encodeRequestBody, encodeRequestHead, RequestParam} from "./cmd";
import { Response } from "./cmd";
import { IResponseValue } from "./cmdutils";
import { ResponseGlue } from "./ResponseGlue";

export class EV3Base {

    private _broker: Broker<Response> = new Broker();
    private _msgCounter: number = 0;
    private _port: SerialPort;

    constructor(port: SerialPort) {
        this._port = port;

        this._port
            .pipe(new ResponseGlue())
            .on("response", (buff) => {
                const response = decodeResponseHead(buff);
                this._broker.registerResponse(response.counter, response);
            });
    }

    public async sendRequest(params: RequestParam[], ack?: true): Promise<IResponseValue[]>;
    public async sendRequest(params: RequestParam[], ack: false): Promise<void>;
    public async sendRequest(params: RequestParam[], ack: boolean = true) {
        const counter = this._msgCounter++;

        const buffReqBody = encodeRequestBody(params);
        const buffReqHead = encodeRequestHead(counter, buffReqBody.length, ack);

        const prResp = ack === true ? this._broker.awaitResponse(counter) : null;

        await this.portWrite(Buffer.concat([buffReqHead, buffReqBody]));

        if (prResp === null) {
            return Promise.resolve();
        } else {
            const resp = await prResp;
            if (resp.status === "error") { return Promise.reject(); }

            const pointerMap = createPointerMap(params);
            return decodeResponseBody(resp.payload, pointerMap);
        }
    }

    public async connect() {
        return new Promise((resolve, reject) => {
            if (this._port.isOpen === true) { resolve(); }
            this._port.open((err) => {
                if (err) { reject(err); } else { resolve(); }
            });
        });
    }

    public async disconnect() {
        return new Promise((resolve, reject) => {
            if (this._port.isOpen === false) { resolve(); }
            this._port.close((err) => {
                if (err) { reject(err); } else { resolve(); }
            });
        });
    }

    public isConnected() {
        return this._port.isOpen === true;
    }

    private async portWrite(buff: Buffer): Promise<void> {
        return new Promise((resolve, reject) => {
            this._port.write(buff, (err) => {
                if (err) { reject(err); } else { resolve(); }
            });
        });
    }
}

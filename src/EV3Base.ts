import SerialPort from "serialport";
import { Broker } from "./Broker";
import { createPointerMap, decodeResponseBody, decodeResponseHead, encodeRequestBody, encodeRequestHead, RequestParam} from "./cmd";
import { IResponseValue } from "./cmdutils";
import { ResponseGlue } from "./ResponseGlue";

export class EV3Base {

    private broker: Broker = new Broker();
    private msgCounter: number = 0;
    private port: SerialPort;

    constructor(port: SerialPort) {
        this.port = port;

        this.port
            .pipe(new ResponseGlue())
            .on("response", (buff) => {
                const response = decodeResponseHead(buff);
                this.broker.registerResponse(response);
            });

        process.on("SIGINT", () => {
            if (this.port.isOpen) {
                this.port.close();
            }
        });
    }

    public async sendRequest(params: RequestParam[], ack?: true): Promise<IResponseValue[]>;
    public async sendRequest(params: RequestParam[], ack: false): Promise<void>;
    public async sendRequest(params: RequestParam[], ack: boolean = true) {
        const counter = this.msgCounter++;

        const buffReqBody = encodeRequestBody(params);
        const buffReqHead = encodeRequestHead(counter, buffReqBody.length, ack);

        const prResp = ack === true ? this.broker.awaitResponse(counter) : null;

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
            this.port.open((err) => {
                if (err) { reject(err); } else { resolve(); }
            });
        });
    }

    public async disconnect() {
        return new Promise((resolve, reject) => {
            if (this.port.isOpen === false) { resolve(); }
            this.port.close((err) => {
                if (err) { reject(err); } else { resolve(); }
            });
        });
    }

    public isConnected() {
        return this.port.isOpen === true;
    }

    private async portWrite(buff: Buffer): Promise<void> {
        return new Promise((resolve, reject) => {
            this.port.write(buff, (err) => {
                if (err) {
                    err.name = "ConnectionError";
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}

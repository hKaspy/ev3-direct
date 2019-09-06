import { Writable } from "stream";

declare module "stream" {
    // tslint:disable-next-line: interface-name
    interface Writable {
        emit(event: "response", reponse: Buffer): boolean;
        on(event: "response", listener: (response: Buffer) => void): this;
    }
}

/*
 * Glue chunks of data coming from EV3 Brick into full response messages
 */
export class ResponseGlue extends Writable {

    private buffArr: Buffer[] = [];
    private buffLength: number = 0;
    private messageLength: number = Infinity;

    constructor() {
        super();
    }

    public _write(chunk: Buffer, _: string, callback: (error: Error | null) => void): void {
        // save the chunk to buffer
        this.buffArr.push(chunk);
        this.buffLength += chunk.length;

        // We need at least 2 bytes of data to know the message length
        if (this.buffLength >= 2 && this.messageLength === Infinity) {
            const buff = Buffer.concat(this.buffArr, this.buffLength);
            this.messageLength = buff.readUInt16LE(0) + 2;
        }

        // keep receiving data until we have enough
        if (this.buffLength < this.messageLength) {
            callback(null);
        } else {
            // sometimes we can get beginning of a new message in the last chunk
            // if that is the case, split the chunk accordingly and save that new part
            this.emit("response", Buffer.concat(this.buffArr, this.messageLength));
            callback(null);

            if (this.messageLength === this.buffLength) {
                this.buffArr = [];
                this.buffLength = 0;
            } else {
                this.buffArr = [
                    chunk.slice(chunk.length - (this.buffLength - this.messageLength)),
                ];
                this.buffLength = this.buffArr[0].length;
            }

            this.messageLength = Infinity;
        }
    }
}

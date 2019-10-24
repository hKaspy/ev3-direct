import { Transform, TransformCallback } from "stream";

/**
 * Parses Direct Command replies from LEGO Mindstorms EV3 Brick
 */
export default class EV3DCParser extends Transform {

    private cache: Buffer = Buffer.alloc(0);

    constructor() { super(); }

    public _transform(chunk: any, _encoding: string, callback: TransformCallback) {
        let buffer = Buffer.concat([this.cache, chunk]);
        let loop = true;

        // Needs at least 2 bytes of data to know the message length
        while (loop && buffer.length >= 2) {
            const msgLength = buffer.readUInt16LE(0) + 2;
            if (buffer.length >= msgLength) {
                this.push(buffer.slice(0, msgLength));
                buffer = buffer.slice(msgLength);
            } else {
                loop = false;
            }
        }

        this.cache = buffer;

        callback(null);
    }

    public _flush(cb: TransformCallback) {
        this.push(this.cache);
        this.cache = Buffer.alloc(0);
        cb();
    }
}

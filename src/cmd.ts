import { decodePointer, encodeByte, encodeMemoryAllocation, encodeNumber, encodePointer, encodeString, IParamMemoryPointer, IParamNumber, IResponsePointer } from "./cmdutils";

export type RequestParam = IParamNumber | IParamMemoryPointer | number | string;

interface IResponseError {
    counter: number;
    status: "error";
}

interface IResponseOk {
    counter: number;
    payload: Buffer;
    status: "ok";
}

export type Response = IResponseError | IResponseOk;

export function encodeRequestHead(counter: number, bodyLength: number, awaitResponse = true): Buffer {
    if (counter < 0 || counter > 32767) { throw new RangeError(`Invalid argument counter (${counter}): must be >= 0 and <= 32767`); }
    if (bodyLength < 0 || bodyLength > 32764) { throw new RangeError(`Invalid argument bodyLength (${bodyLength}): must be >= 0 and <= 32764`); }

    const head = Buffer.allocUnsafe(5);
    head.writeUInt16LE(bodyLength + 3, 0);
    head.writeUInt16LE(counter, 2);
    head[4] = awaitResponse === true ? 0x00 : 0x08;

    return head;
}

export function encodeRequestBody(params: RequestParam[]): Buffer {
    const paramsBuff: Buffer[] = [];
    let indexLocal = 0;
    let indexGlobal = 0;

    for (let i = 0; i < params.length; i++) {
        const param = params[i];

        if (typeof param === "number") {
            paramsBuff.push(encodeByte(param));
        } else if (typeof param === "string") {
            paramsBuff.push(encodeString(param));
        } else if ("value" in param) {
            paramsBuff.push(encodeNumber(param));
        } else if ("scope" in param) {
            if (param.scope === "global") {
                paramsBuff.push(encodePointer(param, indexGlobal));
                indexGlobal += param.bytes;
            } else {
                paramsBuff.push(encodePointer(param, indexLocal));
                indexLocal += param.bytes;
            }
        } else {
            throw new TypeError(`Invalid param at params[${i}]`);
        }
    }

    paramsBuff.unshift(encodeMemoryAllocation(indexGlobal, indexLocal));

    return Buffer.concat(paramsBuff);
}

export function createPointerMap(params: RequestParam[]): IResponsePointer[] {
    const pointerMap: IResponsePointer[] = [];
    let indexGlobal = 0;

    for (const param of params) {
        if (typeof param === "object" && "scope" in param && param.scope === "global") {
            pointerMap.push({
                bytes: param.bytes,
                index: indexGlobal,
                type: param.type,
            });
            indexGlobal += param.bytes;
        }
    }

    return pointerMap;
}

export function decodeResponseHead(buff: Buffer): Response {
    const length = buff.readUInt16LE(0);
    if (length !== (buff.length - 2)) { throw new RangeError(`Advertised length (${length} + 2) does not equal buff.length (${buff.length})`); }

    const counter = buff.readUInt16LE(2);

    const responseType = buff[4];
    if (responseType === 0x04) {
        return {
            counter,
            status: "error",
        };
    } else if (responseType === 0x02) {
        return {
            counter,
            payload: buff.slice(5),
            status: "ok",
        };
    } else {
        throw new RangeError(`Invalid Response Type (0x${responseType.toString(16)}) at buff[4]: accept 0x02 or 0x04`);
    }
}

export function decodeResponseBody(buff: Buffer, pointerMap: IResponsePointer[]) {
    const allocBytes = pointerMap.reduce((acc, cur) => acc + cur.bytes, 0);
    if (allocBytes !== buff.length) { throw new Error(`buff.length (${buff.length}) must be the same as sum of pointerMap[i].bytes (${allocBytes})`); }

    return pointerMap.map((ptr) => decodePointer(buff, ptr));
}

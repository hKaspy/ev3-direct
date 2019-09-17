export type PointerScope = "global" | "local";
export type PointerType = "int" | "float" | "string";

export interface IParamMemoryPointer {
    scope: PointerScope;
    type: PointerType;
    bytes: number;
}

export interface IParamNumber {
    bytes: 0 | 1 | 2 | 4;
    value: number;
}

export interface IResponsePointer {
    bytes: number;
    index: number;
    type: PointerType;
}

export interface IResponseValue {
    index: number;
    value: number | string;
}

export function encodePointer(param: IParamMemoryPointer, index: number): Buffer {
    if (index < 0) { throw new RangeError(`Invalid argument index '${index}': accept >= 0`); }
    if (param.bytes < 0) { throw new RangeError(`Invalid param.bytes '${param.bytes}': accept >= 0`); }

    if (param.scope === "global") {
        if (param.bytes > 1023) { throw new RangeError(`Invalid param.bytes '${param.bytes}' for param.scope 'global': accept <= 1023`); }
    } else if (param.scope === "local") {
        if (param.bytes > 63) { throw new RangeError(`Invalid param.bytes '${param.bytes}' for param.scope 'local': accept <= 63`); }
    } else {
        throw new RangeError(`Invalid scope '${param.scope}': accept global|local`);
    }

    if (param.type === "float") {
        if (param.bytes !== 4) { throw new RangeError(`Invalid bytes '${param.bytes}' for param.type 'float': accept 4`); }
    } else if (param.type === "int") {
        if (param.bytes !== 1 && param.bytes !== 2 && param.bytes !== 4) { throw new RangeError(`Invalid bytes '${param.bytes}' for param.type 'int': accept 1|2|4`); }
    } else if (param.type === "string") {
        // no check for now
    } else {
        throw new RangeError(`Invalid param.type '${param.type}': accept int|float|string`);
    }

    const buff = encodeNumber({
        bytes: 1,
        value: index,
    });

    // variable
    setBit(buff, 0, 6, 1);
    if (param.scope === "global") { setBit(buff, 0, 5, 1); }

    return buff;
}

export function encodeByte(param: number): Buffer {
    if (typeof param !== "number") { throw new TypeError("Argument param must be a number"); }
    if (param < 0 || param > 255) { throw new RangeError("Argument param must be in range 0 to 255"); }
    const buff = Buffer.allocUnsafe(1);
    buff[0] = param;

    return buff;
}

export function encodeNumber(param: IParamNumber): Buffer {
    if (param.bytes !== 0 && param.bytes !== 1 && param.bytes !== 2 && param.bytes !== 4) { throw new RangeError(`Invalid param.bytes '${param.bytes}': accept 0|1|2|4`); }

    const buff = Buffer.alloc(param.bytes + 1, 0);

    if (param.bytes === 0) {
        if (!(-32 < param.value && param.value < 32)) { throw new RangeError("param.value must be in range -31 to 31 for param.type == 'constant' and param.bytes == 0"); }
        if (param.value < 0) {
            setBit(buff, 0, 5, 1);
            (param.value as number) *= -1;
        }
        // tslint:disable-next-line: no-bitwise
        buff[0] |= (param.value as number) & 31;
    } else {
        setBit(buff, 0, 7, 1);

        if (param.bytes === 1) {
            if (!(-0x80 < param.value && param.value < 0x80)) { throw new RangeError("param.value must be in range -127 to +127 for param.bytes == 1"); }
            setBit(buff, 0, 0, 1);
        } else if (param.bytes === 2) {
            if (!(-0x8000 < param.value && param.value < 0x8000)) { throw new RangeError("param.value must be in range -32,767 to +32,767 for param.bytes == 2"); }
            setBit(buff, 0, 1, 1);
        } else if (param.bytes === 4) {
            if (!(-0x80000000 < param.value && param.value < 0x80000000)) { throw new RangeError("param.value must be in range -2,147,483,647 to +2,147,483,647 for param.bytes == 4"); }
            setBit(buff, 0, 0, 1);
            setBit(buff, 0, 1, 1);
        }
        buff.writeIntLE(param.value, 1, param.bytes);
    }

    return buff;
}

export function encodeString(param: string): Buffer {
    if (typeof param !== "string") { throw new TypeError("Argument param must be a string"); }
    const buff = Buffer.alloc(param.length + 2, 0);
    buff.write(param, 1, "ascii");
    // long format parameter
    setBit(buff, 0, 7, 1);
    // zero-terminated string
    setBit(buff, 0, 2, 1);

    return buff;
}

export function encodeMemoryAllocation(globalSize: number = 0, localSize: number = 0): Buffer {
    if (!(0 <= globalSize && globalSize <= 1023)) { throw new RangeError("globalSize must be in range 0 - 1023"); }
    if (!(0 <= localSize && localSize <= 63)) { throw new RangeError("localSize must be in range 0 - 63"); }

    const buf = Buffer.allocUnsafe(2);
    buf.writeUInt16LE(localSize * 1024 + globalSize, 0);
    return buf;
}

export function decodePointer(buff: Buffer, ptr: IResponsePointer): IResponseValue {
    if (ptr.bytes < buff.length) { throw new RangeError(`ptr.bytes (${ptr.bytes}) must be less than buff.length (${buff.length})`); }

    if (ptr.type === "int") {
        if (ptr.bytes !== 1 && ptr.bytes !== 2 && ptr.bytes !== 4) { throw new RangeError(`Invalid ptr.bytes (${ptr.bytes}): accept 1|2|4`); }
        return {
            index: ptr.index,
            value: buff.readIntLE(ptr.index, ptr.bytes),
        };
    } else if (ptr.type === "float") {
        if (ptr.bytes !== 4) { throw new RangeError(`Invalid ptr.bytes (${ptr.bytes}): accept 4`); }
        return {
            index: ptr.index,
            value: buff.readFloatLE(ptr.index),
        };
    } else if (ptr.type === "string") {
        const value = buff.toString("ascii", ptr.index, buff.indexOf(0x00, ptr.index));
        if (value.length > ptr.bytes) { throw new Error(`Invalid string: decoded length (${value.length}) must be <= ptr.bytes (${ptr.bytes})`); }
        return {
            index: ptr.index,
            value,
        };
    } else {
        throw new RangeError(`Invalid ptr.type (${ptr.type}): accept int|float|string`);
    }
}

type bit = 1 | 0;

/**
 * Retrieves a bit from a buffer at a given position
 * @param bufferIndex zero-based position of a byte within the buffer
 * @param bitPosition zero-based position of a bit within the byte
 */
export function getBit(buffer: Buffer, bufferIndex: number, bitPosition: number): bit {
    if ((buffer instanceof Buffer) === false) { throw new TypeError("buffer muset by an instance of Buffer"); }
    if (bufferIndex < 0) { throw new RangeError("bufferIndex must be 0 or greater"); }
    if (bufferIndex >= buffer.length) { throw new RangeError("bufferIndex must be lesser than buffer length"); }
    if (!(0 <= bitPosition && bitPosition <= 7)) { throw new RangeError("bitPosition must be in range 0 - 7"); }

    const byte = buffer.readUInt8(bufferIndex);
    // tslint:disable-next-line: no-bitwise
    return ((byte >>> bitPosition) & 1) as bit;
}

/**
 * Sets a bit in a buffer at a given position
 * @param bufferIndex zero-based position of a byte within the buffer
 * @param bitPosition zero-based position of a bit within the byte
 */
export function setBit(buffer: Buffer, bufferIndex: number, bitPosition: number, sBit: bit): Buffer {
    if ((buffer instanceof Buffer) === false) { throw new TypeError("buffer muset by an instance of Buffer"); }
    if (typeof bufferIndex !== "number") { throw new TypeError("argument bufferIndex must be a number"); }
    if (typeof bitPosition !== "number") { throw new TypeError("argument bitPosition must be a number"); }
    if (typeof sBit !== "number") { throw new TypeError("argument sBit must be a number"); }

    if (bufferIndex < 0) { throw new RangeError("bufferIndex must be 0 or greater"); }
    if (bufferIndex >= buffer.length) { throw new RangeError("bufferIndex must be lesser than buffer length"); }
    if (!(0 <= bitPosition && bitPosition <= 7)) { throw new RangeError("bitPosition must be in range 0 - 7"); }

    if (sBit === 0) {
        // tslint:disable-next-line: no-bitwise
        buffer[bufferIndex] &= ~(1 << bitPosition);
    } else if (sBit === 1) {
        // tslint:disable-next-line: no-bitwise
        buffer[bufferIndex] |= (1 << bitPosition);
    } else {
        throw new RangeError("sBit must be an integer 1 or 0");
    }

    return buffer;
}

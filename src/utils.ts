
export function allocateMemory(globalSize: number = 0, localSize: number = 0): Buffer {
    if (!(0 <= globalSize && globalSize <= 1023)) { throw new RangeError("globalSize must be in range 0 - 1023"); }
    if (!(0 <= localSize && localSize <= 63)) { throw new RangeError("localSize must be in range 0 - 63"); }

    const buf = Buffer.allocUnsafe(2);
    buf.writeUInt16LE(localSize * 1024 + globalSize, 0);
    return buf;
}

interface IParameter {
    data: number | string;
    length: 0 | 1 | 2 | 4 | number;
}

export interface IParameterConst extends IParameter {
    label?: boolean;
    type: "constant";
}

export interface IParameterVar extends IParameter {
    index: "global" | "local";
    handle?: boolean;
    type: "variable";
}

export function decodeParameter(buff: Buffer): IParameterConst | IParameterVar {

    if (getBit(buff, 0, 7) === 0) {
        // Short format param

        // tslint:disable-next-line: no-bitwise
        const value = buff[0] & 31;

        if (getBit(buff, 0, 6) === 0) {
            // Constant
            return {
                data: value * (getBit(buff, 0, 5) === 0 ? 1 : -1),
                length: 0,
                type: "constant",
            };
        } else {
            // Variable
            return {
                data: value,
                index: getBit(buff, 0, 5) === 0 ? "local" : "global",
                length: 0,
                type: "variable",
            };
        }
    } else {
        // Long format param

        // tslint:disable-next-line: no-bitwise
        const type = buff[0] & 7;
        let data;
        let length;

        if (type === 0 || type === 4) {
            // Zero-terminated String
            const end = buff.indexOf(0x00, 1);
            if (end === -1) { throw new Error("Could not find string terminator"); }
            data = buff.toString("ascii", 1, end);
            length = data.length;
        } else if (1 <= type && type <= 3) {
            length = type === 3 ? 4 : type;
            data = buff.readIntLE(1, length);
        } else {
            throw new Error("Unknown type signature");
        }

        if (getBit(buff, 0, 6) === 0) {
            // Constant
            return {
                data,
                label: getBit(buff, 0, 5) === 1,
                length,
                type: "constant",
            };
        } else {
            // Variable
            return {
                data,
                handle: getBit(buff, 0, 4) === 1,
                index: getBit(buff, 0, 5) === 0 ? "local" : "global",
                length,
                type: "variable",
            };
        }
    }
}

export function encodeParameter(parm: IParameterConst | IParameterVar): Buffer {

    if (parm.type !== "constant" && parm.type !== "variable") { throw new TypeError("parm.type must be 'constant' or 'variable'"); }
    if (typeof parm.data !== "number" && typeof parm.data !== "string") { throw new TypeError("parm.data can only be of type 'string' or 'number'"); }

    if (parm.type === "variable") {
        if (parm.index !== "global" && parm.index !== "local") { throw new TypeError("parm.index must have value 'global' or 'local'"); }
    }

    if (parm.length < 0) { throw new RangeError("parm.length must be >= 0"); }
    const buff = Buffer.alloc(typeof parm.data === "string" ? parm.length + 2 : parm.length + 1, 0);

    // short format
    if (parm.length === 0 && typeof parm.data === "number") {
        if (parm.type === "variable") {
            if (!(0 <= parm.data && parm.data < 32)) { throw new RangeError("parm.data must be in range 0 to 31 for parm.type == 'variable' and parm.length == 0"); }
            setBit(buff, 0, 6, 1);
            if (parm.index === "global") { setBit(buff, 0, 5, 1); }
        } else {
            if (!(-32 < parm.data && parm.data < 32)) { throw new RangeError("parm.data must be in range -31 to 31 for parm.type == 'constant' and parm.length == 0"); }
            if (parm.data < 0) {
                setBit(buff, 0, 5, 1);
                (parm.data as number) *= -1;
            }
        }

        // tslint:disable-next-line: no-bitwise
        buff[0] |= (parm.data as number) & 31;
    } else {
        setBit(buff, 0, 7, 1);
        if (parm.type === "variable") {
            setBit(buff, 0, 6, 1);
            if (parm.index === "global") { setBit(buff, 0, 5, 1); }
            if (parm.handle === true) { setBit(buff, 0, 4, 1); }
        } else {
            if (parm.label === true) { setBit(buff, 0, 5, 1); }
        }

        if (typeof parm.data === "number") {
            if (parm.length === 1) {
                if (!(-0x80 < parm.data && parm.data < 0x80)) { throw new RangeError("parm.data must be in range -127 to +127 for parm.length == 1"); }
                setBit(buff, 0, 0, 1);
            } else if (parm.length === 2) {
                if (!(-0x8000 < parm.data && parm.data < 0x8000)) { throw new RangeError("parm.data must be in range -32,767 to +32,767 for parm.length == 2"); }
                setBit(buff, 0, 1, 1);
            } else if (parm.length === 4) {
                if (!(-0x80000000 < parm.data && parm.data < 0x80000000)) { throw new RangeError("parm.data must be in range -2,147,483,647 to +2,147,483,647 for parm.length == 4"); }
                setBit(buff, 0, 0, 1);
                setBit(buff, 0, 1, 1);
            } else {
                throw new RangeError("parm.length must have value 0, 1, 2 or 4 for typeof parm.data == 'number'");
            }
            buff.writeIntLE(parm.data, 1, parm.length);
        } else {
            if (parm.length > parm.data.length) { throw new RangeError("parm.length must be <= parm.data.length"); }
            setBit(buff, 0, 2, 1);
            buff.write(parm.data, 1, parm.length);
        }
    }

    return buff;
}

/*
 * Port masks
 */
export enum outputMask {
    A = 0b0001,
    B = 0b0010,
    C = 0b0100,
    D = 0b1000,
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
        throw new TypeError("sBit must be an integer 1 or 0");
    }

    return buffer;
}

import { expect } from "chai";
import "mocha";
import * as imp from "../../src/cmdutils";

describe("cmdutils.ts", () => {

    describe("encodeByte", () => {

        it("should return a Buffer", () => {
            expect(imp.encodeByte(0)).to.be.instanceOf(Buffer);
        });

        it("should encode a byte", () => {
            expect(imp.encodeByte(0x00)).to.deep.equal(Buffer.from("00", "hex"));
            expect(imp.encodeByte(0xff)).to.deep.equal(Buffer.from("ff", "hex"));
        });

        it("should validate input", () => {
            expect(() => imp.encodeByte(256)).to.throw(RangeError);
            expect(() => imp.encodeByte(-1)).to.throw(RangeError);

            expect(() => imp.encodeByte("foo" as any)).to.throw(TypeError);
        });
    });

    describe("encodeNumber", () => {

        it("should return a Buffer", () => {
            expect(imp.encodeNumber({
                bytes: 1,
                value: 0x5e,
            })).to.be.instanceOf(Buffer);
        });

        it("should encode a number", () => {

            // short format, positive
            expect(imp.encodeNumber({
                bytes: 0,
                value: 20,
            })).to.deep.equal(Buffer.from("14", "hex"));

            // short format, negative
            expect(imp.encodeNumber({
                bytes: 0,
                value: -20,
            })).to.deep.equal(Buffer.from("34", "hex"));

            // 8 bit, positive
            expect(imp.encodeNumber({
                bytes: 1,
                value: 127,
            })).to.deep.equal(Buffer.from("817f", "hex"));

            // 8 bit, negative
            expect(imp.encodeNumber({
                bytes: 1,
                value: -127,
            })).to.deep.equal(Buffer.from("8181", "hex"));

            // 16 bit
            expect(imp.encodeNumber({
                bytes: 2,
                value: 0x7abb,
            })).to.deep.equal(Buffer.from("82bb7a", "hex"));

            // 32 bit
            expect(imp.encodeNumber({
                bytes: 4,
                value: 0x7abbccdd,
            })).to.deep.equal(Buffer.from("83ddccbb7a", "hex"));
        });

        it("should validate input", () => {

            // short format max
            expect(() => imp.encodeNumber({
                bytes: 0,
                value: 0xff,
            })).to.throw(RangeError);

            // short format min
            expect(() => imp.encodeNumber({
                bytes: 0,
                value: -0xff,
            })).to.throw(RangeError);

            // 8 bit max
            expect(() => imp.encodeNumber({
                bytes: 1,
                value: 0xffff,
            })).to.throw(RangeError);

            // 8 bit min
            expect(() => imp.encodeNumber({
                bytes: 1,
                value: -0xffff,
            })).to.throw(RangeError);

            // 16 bit max
            expect(() => imp.encodeNumber({
                bytes: 2,
                value: 0xffffff,
            })).to.throw(RangeError);

            // 16 bit min
            expect(() => imp.encodeNumber({
                bytes: 2,
                value: -0xffffff,
            })).to.throw(RangeError);

            // 32 bit max
            expect(() => imp.encodeNumber({
                bytes: 4,
                value: 0xffffffffff,
            })).to.throw(RangeError);

            // 32 bit min
            expect(() => imp.encodeNumber({
                bytes: 4,
                value: -0xffffffffff,
            })).to.throw(RangeError);

            // param.bytes
            expect(() => imp.encodeNumber({
                bytes: 3,
                value: 0x01,
            } as any)).to.throw(RangeError);

            expect(() => imp.encodeNumber({
                bytes: -1,
                value: 0x01,
            } as any)).to.throw(RangeError);
        });
    });

    describe("encodeString", () => {

        it("should return a Buffer", () => {
            expect(imp.encodeString("foo")).to.be.instanceOf(Buffer);
        });

        it("should encode a string", () => {
            expect(imp.encodeString("foo")).to.deep.equal(Buffer.from("84666f6f00", "hex"));
        });

        it("should validate input", () => {
            expect(() => imp.encodeString(0 as any)).to.throw(TypeError);
        });
    });

    describe("encodePointer", () => {

        it("should return a Buffer", () => {
            expect(imp.encodePointer(
                {
                    bytes: 1,
                    scope: "global",
                    type: "int",
                },
                0,
            )).to.be.instanceOf(Buffer);
        });

        it("should encode a pointer", () => {

            // local scope
            expect(imp.encodePointer(
                {
                    bytes: 1,
                    scope: "local",
                    type: "int",
                },
                0x5a,
            ).toString("hex")).to.equal("c15a");

            // global scope
            expect(imp.encodePointer(
                {
                    bytes: 1,
                    scope: "global",
                    type: "int",
                },
                0x5a,
            ).toString("hex")).to.equal("e15a");

            // float type
            expect(imp.encodePointer(
                {
                    bytes: 4,
                    scope: "global",
                    type: "float",
                },
                0x5a,
            ).toString("hex")).to.equal("e15a");

            // string type
            expect(imp.encodePointer(
                {
                    bytes: 4,
                    scope: "global",
                    type: "string",
                },
                0x5a,
            ).toString("hex")).to.equal("e15a");
        });

        it("should validate param.scope", () => {

            expect(() => imp.encodePointer(
                {
                    bytes: 1,
                    scope: "foo",
                    type: "int",
                } as any,
                0,
            )).to.throw(RangeError);
        });

        it("should validate param.type", () => {

            expect(() => imp.encodePointer(
                {
                    bytes: 1,
                    scope: "global",
                    type: "foo",
                } as any,
                0,
            )).to.throw(RangeError);
        });

        it("should validate param.bytes", () => {

            expect(() => imp.encodePointer(
                {
                    bytes: -1,
                    scope: "global",
                    type: "int",
                },
                0,
            )).to.throw(RangeError);

            expect(() => imp.encodePointer(
                {
                    bytes: 1,
                    scope: "global",
                    type: "float",
                },
                0,
            )).to.throw(RangeError);

            expect(() => imp.encodePointer(
                {
                    bytes: 0,
                    scope: "global",
                    type: "int",
                },
                0,
            )).to.throw(RangeError);

            expect(() => imp.encodePointer(
                {
                    bytes: 2000,
                    scope: "global",
                    type: "int",
                },
                0,
            )).to.throw(RangeError);

            expect(() => imp.encodePointer(
                {
                    bytes: 2000,
                    scope: "local",
                    type: "int",
                },
                0,
            )).to.throw(RangeError);
        });

        it("should validate index", () => {

            expect(() => imp.encodePointer(
                {
                    bytes: 1,
                    scope: "global",
                    type: "int",
                } as any,
                -1,
            )).to.throw(RangeError);
        });
    });

    describe("encodeMemoryAllocation", () => {

        it("should set 4 bytes of local space", () => {
            expect(imp.encodeMemoryAllocation(0, 4)).to.deep.equal(Buffer.from([0x00, 0x10]));
        });

        it("should set 4 bytes of global space", () => {
            expect(imp.encodeMemoryAllocation(4, 0)).to.deep.equal(Buffer.from([0x04, 0x00]));
        });

        it("should set 6 bytes of global space and 10 bytes of local space", () => {
            expect(imp.encodeMemoryAllocation(6, 10)).to.deep.equal(Buffer.from([0x06, 0x28]));
        });

        it("should throw error on out of range globalSize", () => {
            expect(() => imp.encodeMemoryAllocation(-1, 0)).to.throw(RangeError);
            expect(() => imp.encodeMemoryAllocation(1024, 0)).to.throw(RangeError);
        });

        it("should throw error on out of range localSize", () => {
            expect(() => imp.encodeMemoryAllocation(0, -1)).to.throw(RangeError);
            expect(() => imp.encodeMemoryAllocation(0, 64)).to.throw(RangeError);
        });

    });

    describe("decodePointer", () => {

        it("should decode a pointer, 8 bit integer", () => {
            expect(imp.decodePointer(
                Buffer.from([0x5e]),
                {
                    bytes: 1,
                    index: 0,
                    type: "int",
                },
            )).to.deep.equal({
                index: 0,
                value: 0x5e,
            });
        });

        it("should decode a pointer, 16 bit integer", () => {
            expect(imp.decodePointer(
                Buffer.from([0xee, 0x55]),
                {
                    bytes: 2,
                    index: 0,
                    type: "int",
                },
            )).to.deep.equal({
                index: 0,
                value: 0x55ee,
            });
        });

        it("should decode a pointer, 32 bit integer", () => {
            expect(imp.decodePointer(
                Buffer.from([0xbb, 0xaa, 0xee, 0x55]),
                {
                    bytes: 4,
                    index: 0,
                    type: "int",
                },
            )).to.deep.equal({
                index: 0,
                value: 0x55eeaabb,
            });
        });

        it("should decode a pointer, 32 bit float", () => {
            expect(imp.decodePointer(
                Buffer.from([0xd8, 0x0f, 0x49, 0x40]),
                {
                    bytes: 4,
                    index: 0,
                    type: "float",
                },
            )).to.deep.equal({
                index: 0,
                value: 3.141592025756836,
            });
        });

        it("should decode a pointer, string", () => {
            // exact size
            expect(imp.decodePointer(
                Buffer.from("foo\u0000", "ascii"),
                {
                    bytes: 4,
                    index: 0,
                    type: "string",
                },
            )).to.deep.equal({
                index: 0,
                value: "foo",
            });

            // smaller size
            expect(imp.decodePointer(
                Buffer.from("foo\u0000aa", "ascii"),
                {
                    bytes: 6,
                    index: 0,
                    type: "string",
                },
            )).to.deep.equal({
                index: 0,
                value: "foo",
            });
        });

        it("should decode a pointer with offset index", () => {
            expect(imp.decodePointer(
                Buffer.from([0, 0, 0x5e]),
                {
                    bytes: 1,
                    index: 2,
                    type: "int",
                },
            )).to.deep.equal({
                index: 2,
                value: 0x5e,
            });
        });

        it("should throw on ptr.bytes larger than buff.length", () => {
            expect(() => imp.decodePointer(
                Buffer.alloc(6, 0),
                {
                    bytes: 8,
                    index: 0,
                    type: "string",
                },
            )).to.throw(RangeError);
        });

        it("should throw on invalid ptr.type", () => {
            expect(() => imp.decodePointer(
                Buffer.alloc(1, 0),
                {
                    bytes: 1,
                    index: 0,
                    type: "foo",
                } as any,
            )).to.throw(RangeError);
        });

        it("should throw on string terminator out of bounds", () => {
            expect(() => imp.decodePointer(
                Buffer.from("abcd\u0000", "ascii"),
                {
                    bytes: 4,
                    index: 0,
                    type: "string",
                },
            )).to.throw(Error);
        });

        it("should throw on invalid ptr.bytes", () => {
            // type: int
            expect(() => imp.decodePointer(
                Buffer.alloc(4, 0),
                {
                    bytes: 3,
                    index: 0,
                    type: "int",
                },
            )).to.throw(RangeError);

            // type: float
            expect(() => imp.decodePointer(
                Buffer.alloc(4, 0),
                {
                    bytes: 3,
                    index: 0,
                    type: "float",
                },
            )).to.throw(RangeError);
        });
    });

    describe("getBit", () => {

        it("should get 6th bit", () => {
            expect(imp.getBit(Buffer.from([0x20]), 0, 5)).to.equal(1);
            expect(imp.getBit(Buffer.from([0xdf]), 0, 5)).to.equal(0);
        });

        it("should get 6th bit of second byte", () => {
            expect(imp.getBit(Buffer.from([0x00, 0x20]), 1, 5)).to.equal(1);
            expect(imp.getBit(Buffer.from([0xff, 0xdf]), 1, 5)).to.equal(0);
        });

        it("should throw on buffer not being Buffer", () => {
            expect(() => imp.getBit("" as any, 0, 0)).to.throw(TypeError);
        });

        it("should throw on out of range bufferIndex", () => {
            expect(() => imp.getBit(Buffer.from([0x00]), -1, 0)).to.throw(RangeError);
            expect(() => imp.getBit(Buffer.from([0x00]), 1, 0)).to.throw(RangeError);
            expect(() => imp.getBit(Buffer.from([0x00]), 256, 0)).to.throw(RangeError);
        });

        it("should throw on out of range bitPosition", () => {
            expect(() => imp.getBit(Buffer.from([0x00]), 0, -1)).to.throw(RangeError);
            expect(() => imp.getBit(Buffer.from([0x00]), 0, 8)).to.throw(RangeError);
            expect(() => imp.getBit(Buffer.from([0x00]), 0, 256)).to.throw(RangeError);
        });
    });

    describe("setBit", () => {

        it("should set 6th bit", () => {
            expect(imp.setBit(Buffer.from([0x00]), 0, 5, 1)).to.deep.equal(Buffer.from([0x20]));
            expect(imp.setBit(Buffer.from([0xff]), 0, 5, 0)).to.deep.equal(Buffer.from([0xdf]));
        });

        it("should set 6th bit of second byte", () => {
            expect(imp.setBit(Buffer.alloc(2, 0x00), 1, 5, 1)).to.deep.equal(Buffer.from([0x00, 0x20]));
            expect(imp.setBit(Buffer.alloc(2, 0xff), 1, 5, 0)).to.deep.equal(Buffer.from([0xff, 0xdf]));
        });

        it("should throw on buffer not being Buffer", () => {
            expect(() => imp.setBit("" as any, 0, 0, 0)).to.throw(TypeError);
        });

        it("should throw on out of range bufferIndex", () => {
            expect(() => imp.setBit(Buffer.from([0x00]), -1, 0, 0)).to.throw(RangeError);
            expect(() => imp.setBit(Buffer.from([0x00]), 1, 0, 0)).to.throw(RangeError);
            expect(() => imp.setBit(Buffer.from([0x00]), 256, 0, 0)).to.throw(RangeError);
        });

        it("should throw on out of range bitPosition", () => {
            expect(() => imp.setBit(Buffer.from([0x00]), 0, -1, 0)).to.throw(RangeError);
            expect(() => imp.setBit(Buffer.from([0x00]), 0, 8, 0)).to.throw(RangeError);
            expect(() => imp.setBit(Buffer.from([0x00]), 0, 256, 0)).to.throw(RangeError);
        });

        it("should check validity of sBit", () => {
            // sanity check
            expect(() => imp.setBit(Buffer.from([0x00]), 0, 0, 1)).to.not.throw();
            expect(() => imp.setBit(Buffer.from([0x00]), 0, 0, 0)).to.not.throw();
            // errors
            expect(() => imp.setBit(Buffer.from([0x00]), "" as any, 0, 0)).to.throw(TypeError);
            expect(() => imp.setBit(Buffer.from([0x00]), 0, "" as any, 0)).to.throw(TypeError);
            expect(() => imp.setBit(Buffer.from([0x00]), 0, 0, "" as any)).to.throw(TypeError);
            expect(() => imp.setBit(Buffer.from([0x00]), 0, 0, 42 as any)).to.throw(RangeError);
        });
    });
});

import { expect } from "chai";
import "mocha";
import * as utils from "../../src/utils";

describe("utils.ts", () => {

    describe("allocateMemory", () => {

        it("should return a Buffer", () => {
            expect(utils.allocateMemory(0, 0)).to.be.instanceOf(Buffer);
        });

        it("should set 4 bytes of local space", () => {
            expect(utils.allocateMemory(0, 4).readUInt16LE(0)).to.equal(parseInt("0001000000000000", 2));
        });

        it("should set 4 bytes of global space", () => {
            expect(utils.allocateMemory(4, 0).readUInt16LE(0)).to.equal(parseInt("0000000000000100", 2));
        });

        it("should set 6 bytes of global space and 10 bytes of local space", () => {
            expect(utils.allocateMemory(6, 10).readUInt16LE(0)).to.equal(parseInt("0010100000000110", 2));
        });

        it("should throw error on out of range globalSize", () => {
            expect(() => utils.allocateMemory(-1, 0)).to.throw(RangeError);
            expect(() => utils.allocateMemory(1024, 0)).to.throw(RangeError);
        });

        it("should throw error on out of range localSize", () => {
            expect(() => utils.allocateMemory(0, -1)).to.throw(RangeError);
            expect(() => utils.allocateMemory(0, 1024)).to.throw(RangeError);
        });

    });

    describe("getBit", () => {

        it("should return a number", () => {
            expect(utils.getBit(Buffer.alloc(1, 0x00), 0, 0)).to.be.a("number");
            expect(utils.getBit(Buffer.alloc(1, 0xff), 0, 0)).to.be.a("number");
        });

        it("should get 4th bit", () => {
            expect(utils.getBit(Buffer.from([parseInt("00001000", 2)]), 0, 3)).to.equal(1);
            expect(utils.getBit(Buffer.from([parseInt("11110111", 2)]), 0, 3)).to.equal(0);
        });

        it("should get 6th bit of second byte", () => {
            expect(utils.getBit(Buffer.from([0x00, parseInt("00100000", 2)]), 1, 5)).to.equal(1);
            expect(utils.getBit(Buffer.from([0xff, parseInt("11011111", 2)]), 1, 5)).to.equal(0);
        });

        it("should throw error on buffer not being Buffer", () => {
            expect(() => utils.getBit("" as unknown as Buffer, 0, 0)).to.throw(TypeError);
        });

        it("should throw error on out of range bufferIndex", () => {
            expect(() => utils.getBit(Buffer.from([0x00]), -1, 0)).to.throw(RangeError);
            expect(() => utils.getBit(Buffer.from([0x00]), 1, 0)).to.throw(RangeError);
            expect(() => utils.getBit(Buffer.from([0x00]), 256, 0)).to.throw(RangeError);
        });

        it("should throw error on out of range bitPosition", () => {
            expect(() => utils.getBit(Buffer.from([0x00]), 0, -1)).to.throw(RangeError);
            expect(() => utils.getBit(Buffer.from([0x00]), 0, 8)).to.throw(RangeError);
            expect(() => utils.getBit(Buffer.from([0x00]), 0, 256)).to.throw(RangeError);
        });
    });

    describe("setBit", () => {

        it("should set 4th bit", () => {
            expect(utils.setBit(Buffer.from([0x00]), 0, 3, 1).readUInt8(0)).to.equal(parseInt("00001000", 2));
            expect(utils.setBit(Buffer.from([0xff]), 0, 3, 0).readUInt8(0)).to.equal(parseInt("11110111", 2));
        });

        it("should set 6th bit of second byte", () => {
            expect(utils.setBit(Buffer.alloc(2, 0x00), 1, 5, 1).readUInt16LE(0)).to.equal(parseInt("0010000000000000", 2));
            expect(utils.setBit(Buffer.alloc(2, 0xff), 1, 5, 0).readUInt16LE(0)).to.equal(parseInt("1101111111111111", 2));
        });

        it("should throw error on buffer not being Buffer", () => {
            expect(() => utils.setBit("" as unknown as Buffer, 0, 0, 0)).to.throw(TypeError);
        });

        it("should throw error on out of range bufferIndex", () => {
            expect(() => utils.setBit(Buffer.from([0x00]), -1, 0, 0)).to.throw(RangeError);
            expect(() => utils.setBit(Buffer.from([0x00]), 1, 0, 0)).to.throw(RangeError);
            expect(() => utils.setBit(Buffer.from([0x00]), 256, 0, 0)).to.throw(RangeError);
        });

        it("should throw error on out of range bitPosition", () => {
            expect(() => utils.setBit(Buffer.from([0x00]), 0, -1, 0)).to.throw(RangeError);
            expect(() => utils.setBit(Buffer.from([0x00]), 0, 8, 0)).to.throw(RangeError);
            expect(() => utils.setBit(Buffer.from([0x00]), 0, 256, 0)).to.throw(RangeError);
        });

        it("should check validity of sBit", () => {
            // sanity check
            expect(() => utils.setBit(Buffer.from([0x00]), 0, 0, 1)).to.not.throw();
            expect(() => utils.setBit(Buffer.from([0x00]), 0, 0, 0)).to.not.throw();
            // errors
            expect(() => utils.setBit(Buffer.from([0x00]), 0, 0, 42 as unknown as 1 | 0)).to.throw(TypeError);
            expect(() => utils.setBit(Buffer.from([0x00]), 0, 0, "" as unknown as 1 | 0)).to.throw(TypeError);
            expect(() => utils.setBit(Buffer.from([0x00]), 0, 0, {} as unknown as 1 | 0)).to.throw(TypeError);
        });
    });

    describe("decodeParameter", () => {

        it("should decode a short constant", () => {
            const buff = Buffer.alloc(1, 0);

            // positive value
            buff[0] = parseInt("00010100", 2);

            expect(utils.decodeParameter(buff)).to.deep.equal({
                data: 20,
                length: 0,
                type: "constant",
            });

            // negative value
            buff[0] = parseInt("00110100", 2);

            expect(utils.decodeParameter(buff)).to.deep.equal({
                data: -20,
                length: 0,
                type: "constant",
            });
        });

        it("should decode a short variable", () => {

            const buff = Buffer.alloc(1, 0);

            // local index
            buff[0] = parseInt("01010100", 2);

            expect(utils.decodeParameter(buff)).to.deep.equal({
                data: 20,
                index: "local",
                length: 0,
                type: "variable",
            });

            // global index
            buff[0] = parseInt("01110100", 2);

            expect(utils.decodeParameter(buff)).to.deep.equal({
                data: 20,
                index: "global",
                length: 0,
                type: "variable",
            });
        });

        it("should decode a constant", () => {

            const buff = Buffer.alloc(2, 0);
            buff[1] = 20;

            // constant value
            buff[0] = parseInt("10000001", 2);

            expect(utils.decodeParameter(buff)).to.deep.equal({
                data: 20,
                label: false,
                length: 1,
                type: "constant",
            });

            // constant label
            buff[0] = parseInt("10100001", 2);

            expect(utils.decodeParameter(buff)).to.deep.equal({
                data: 20,
                label: true,
                length: 1,
                type: "constant",
            });
        });

        it("should decode a variable", () => {

            const buff = Buffer.alloc(2, 0);
            buff[1] = 20;

            // local index value
            buff[0] = parseInt("11000001", 2);

            expect(utils.decodeParameter(buff)).to.deep.equal({
                data: 20,
                handle: false,
                index: "local",
                length: 1,
                type: "variable",
            });

            // global index value
            buff[0] = parseInt("11100001", 2);

            expect(utils.decodeParameter(buff)).to.deep.equal({
                data: 20,
                handle: false,
                index: "global",
                length: 1,
                type: "variable",
            });

            // local index handle
            buff[0] = parseInt("11010001", 2);

            expect(utils.decodeParameter(buff)).to.deep.equal({
                data: 20,
                handle: true,
                index: "local",
                length: 1,
                type: "variable",
            });

            // global index handle
            buff[0] = parseInt("11110001", 2);

            expect(utils.decodeParameter(buff)).to.deep.equal({
                data: 20,
                handle: true,
                index: "global",
                length: 1,
                type: "variable",
            });
        });

        it("should decode a constant multibyte number", () => {
            const param: utils.IParameterConst = {
                data: 20,
                label: false,
                length: 1,
                type: "constant",
            };

            const buff = Buffer.alloc(5, 0);

            // 8 bit int
            buff[0] = 0x81;

            // positive
            buff.writeInt8(20, 1);
            expect(utils.decodeParameter(buff.slice(0, 2))).to.deep.equal(param);

            // negative
            param.data = -20;
            buff.writeInt8(-20, 1);
            expect(utils.decodeParameter(buff.slice(0, 2))).to.deep.equal(param);

            // 16 bit int
            param.length = 2;
            buff[0] = 0x82;

            // positive
            param.data = 32000;
            buff.writeInt16LE(32000, 1);
            expect(utils.decodeParameter(buff.slice(0, 3))).to.deep.equal(param);

            // negative
            param.data = -32000;
            buff.writeInt16LE(-32000, 1);
            expect(utils.decodeParameter(buff.slice(0, 3))).to.deep.equal(param);

            // 32 bit int
            param.length = 4;
            buff[0] = 0x83;

            // positive
            param.data = 2000000000;
            buff.writeInt32LE(2000000000, 1);
            expect(utils.decodeParameter(buff)).to.deep.equal(param);

            // negative
            param.data = -2000000000;
            buff.writeInt32LE(-2000000000, 1);
            expect(utils.decodeParameter(buff)).to.deep.equal(param);
        });

        it("should decode a constant string", () => {
            const buf = Buffer.alloc(3, 0);
            buf[0] = parseInt("10000000", 2);
            buf[1] = "A".charCodeAt(0);

            expect(utils.decodeParameter(buf)).to.deep.equal({
                data: "A",
                label: false,
                length: 1,
                type: "constant",
            });

            buf[0] = parseInt("10000100", 2);

            expect(utils.decodeParameter(buf)).to.deep.equal({
                data: "A",
                label: false,
                length: 1,
                type: "constant",
            });
        });

        it("should throw error on missing string terminator", () => {
            const buf = Buffer.alloc(3, 0);
            buf[0] = parseInt("10000000", 2);
            buf[1] = "A".charCodeAt(0);
            buf[2] = 0x01;

            expect(() => utils.decodeParameter(buf)).to.throw(Error);
        });

        it("should throw error on unknown type signature", () => {
            const buf = Buffer.alloc(1, 0);
            buf[0] = parseInt("10000111", 2);

            expect(() => utils.decodeParameter(buf)).to.throw(Error);
        });

    });

    describe("encodeParameter", () => {

        it("should encode a short constant", () => {

            // positive value
            expect(utils.encodeParameter({
                data: 20,
                length: 0,
                type: "constant",
            }).toString("hex")).to.equal(parseInt("00010100", 2).toString(16));

            // negative value
            expect(utils.encodeParameter({
                data: -20,
                length: 0,
                type: "constant",
            }).toString("hex")).to.equal(parseInt("00110100", 2).toString(16));
        });

        it("should encode a short variable", () => {

            // local index
            expect(utils.encodeParameter({
                data: 20,
                index: "local",
                length: 0,
                type: "variable",
            }).toString("hex")).to.equal(parseInt("01010100", 2).toString(16));

            // global index
            expect(utils.encodeParameter({
                data: 20,
                index: "global",
                length: 0,
                type: "variable",
            }).toString("hex")).to.equal(parseInt("01110100", 2).toString(16));
        });

        it("should encode a constant", () => {

            // constant value
            expect(utils.encodeParameter({
                data: 20,
                label: false,
                length: 1,
                type: "constant",
            }).toString("hex")).to.equal(parseInt("10000001", 2).toString(16) + "14");

            // constant label
            expect(utils.encodeParameter({
                data: 20,
                label: true,
                length: 1,
                type: "constant",
            }).toString("hex")).to.equal(parseInt("10100001", 2).toString(16) + "14");
        });

        it("should encode a variable", () => {

            // local index value
            expect(utils.encodeParameter({
                data: 20,
                handle: false,
                index: "local",
                length: 1,
                type: "variable",
            }).toString("hex")).to.equal(parseInt("11000001", 2).toString(16) + "14");

            // global index value
            expect(utils.encodeParameter({
                data: 20,
                handle: false,
                index: "global",
                length: 1,
                type: "variable",
            }).toString("hex")).to.equal(parseInt("11100001", 2).toString(16) + "14");

            // local index handle
            expect(utils.encodeParameter({
                data: 20,
                handle: true,
                index: "local",
                length: 1,
                type: "variable",
            }).toString("hex")).to.equal(parseInt("11010001", 2).toString(16) + "14");

            // global index handle
            expect(utils.encodeParameter({
                data: 20,
                handle: true,
                index: "global",
                length: 1,
                type: "variable",
            }).toString("hex")).to.equal(parseInt("11110001", 2).toString(16) + "14");
        });

        it("should encode a constant multibyte number", () => {

            const param: utils.IParameterConst = {
                data: 20,
                label: false,
                length: 1,
                type: "constant",
            };

            const buff = Buffer.alloc(5, 0);

            // 8 bit int
            buff[0] = 0x81;

            // positive
            buff.writeInt8(20, 1);
            expect(utils.encodeParameter(param)).to.deep.equal(buff.slice(0, 2));

            // negative
            param.data = -20;
            buff.writeInt8(-20, 1);
            expect(utils.encodeParameter(param)).to.deep.equal(buff.slice(0, 2));

            // 16 bit int
            param.length = 2;
            buff[0] = 0x82;

            // positive
            param.data = 32000;
            buff.writeInt16LE(32000, 1);
            expect(utils.encodeParameter(param)).to.deep.equal(buff.slice(0, 3));

            // negative
            param.data = -32000;
            buff.writeInt16LE(-32000, 1);
            expect(utils.encodeParameter(param)).to.deep.equal(buff.slice(0, 3));

            // 32 bit int
            param.length = 4;
            buff[0] = 0x83;

            // positive
            param.data = 2000000000;
            buff.writeInt32LE(2000000000, 1);
            expect(utils.encodeParameter(param)).to.deep.equal(buff);

            // negative
            param.data = -2000000000;
            buff.writeInt32LE(-2000000000, 1);
            expect(utils.encodeParameter(param)).to.deep.equal(buff);
        });

        it("should encode a constant string", () => {

            const buff = Buffer.alloc(7, 0);
            buff[0] = parseInt("10000100", 2);
            buff.write("hello", 1, "ascii");

            expect(utils.encodeParameter({
                data: "hello",
                label: false,
                length: 5,
                type: "constant",
            })).to.deep.equal(buff);

            // should crop data string to provided length
            expect(utils.encodeParameter({
                data: "hello!!!",
                label: false,
                length: 5,
                type: "constant",
            })).to.deep.equal(buff);

        });

        it("should throw on out of range param.length", () => {

            // for numbers
            expect(() => utils.encodeParameter({
                data: 1,
                label: false,
                length: 3,
                type: "constant",
            })).to.throw(RangeError);

            expect(() => utils.encodeParameter({
                data: 1,
                label: false,
                length: 5,
                type: "constant",
            })).to.throw(RangeError);

            expect(() => utils.encodeParameter({
                data: 1,
                label: false,
                length: -1,
                type: "constant",
            })).to.throw(RangeError);

            // for strings
            expect(() => utils.encodeParameter({
                data: "",
                label: false,
                length: 1,
                type: "constant",
            })).to.throw(RangeError);

            expect(() => utils.encodeParameter({
                data: "foo",
                label: false,
                length: -1,
                type: "constant",
            })).to.throw(RangeError);
        });

        it("should check validity of param.data", () => {

            // sanity check - number
            expect(() => utils.encodeParameter({
                data: 1,
                label: false,
                length: 0,
                type: "constant",
            })).to.not.throw();

            // sanity check - string
            expect(() => utils.encodeParameter({
                data: "foo",
                label: false,
                length: 3,
                type: "constant",
            })).to.not.throw();

            // out of range short constant
            expect(() => utils.encodeParameter({
                data: 32,
                label: false,
                length: 0,
                type: "constant",
            })).to.throw(RangeError);

            expect(() => utils.encodeParameter({
                data: -32,
                label: false,
                length: 0,
                type: "constant",
            })).to.throw(RangeError);

            // out of range short variable
            expect(() => utils.encodeParameter({
                data: 32,
                index: "local",
                length: 0,
                type: "variable",
            })).to.throw(RangeError);

            expect(() => utils.encodeParameter({
                data: -1,
                index: "local",
                length: 0,
                type: "variable",
            })).to.throw(RangeError);

            // out of range constant
            expect(() => utils.encodeParameter({
                data: 128,
                label: false,
                length: 1,
                type: "constant",
            })).to.throw(RangeError);

            expect(() => utils.encodeParameter({
                data: -128,
                label: false,
                length: 1,
                type: "constant",
            })).to.throw(RangeError);

            expect(() => utils.encodeParameter({
                data: 32768,
                label: false,
                length: 2,
                type: "constant",
            })).to.throw(RangeError);

            expect(() => utils.encodeParameter({
                data: -32768,
                label: false,
                length: 2,
                type: "constant",
            })).to.throw(RangeError);

            expect(() => utils.encodeParameter({
                data: 2147483648,
                label: false,
                length: 4,
                type: "constant",
            })).to.throw(RangeError);

            expect(() => utils.encodeParameter({
                data: -2147483648,
                label: false,
                length: 4,
                type: "constant",
            })).to.throw(RangeError);

            // throw on array
            expect(() => utils.encodeParameter({
                data: [0, 1],
                label: false,
                length: 0,
                type: "constant",
            } as unknown as utils.IParameterConst)).to.throw(TypeError);

            // throw on object
            expect(() => utils.encodeParameter({
                data: {foo: "bar"},
                label: false,
                length: 1,
                type: "constant",
            } as unknown as utils.IParameterConst)).to.throw(TypeError);
        });

        it("should check validity of param.type", () => {

            // sanity check - constant
            expect(() => utils.encodeParameter({
                data: 1,
                label: false,
                length: 0,
                type: "constant",
            })).to.not.throw();

            // sanity check - variable
            expect(() => utils.encodeParameter({
                data: 1,
                index: "local",
                length: 0,
                type: "variable",
            })).to.not.throw();

            // invalid type
            expect(() => utils.encodeParameter({
                data: "bar",
                length: 0,
                type: "foo",
            } as unknown as utils.IParameterConst)).to.throw(TypeError);
        });

        it("should check validity of param.index", () => {

            // sanity check - local
            expect(() => utils.encodeParameter({
                data: 1,
                index: "local",
                length: 0,
                type: "variable",
            })).to.not.throw();

            // sanity check - global
            expect(() => utils.encodeParameter({
                data: 1,
                index: "global",
                length: 0,
                type: "variable",
            })).to.not.throw();

            // invalid type
            expect(() => utils.encodeParameter({
                data: 1,
                index: "foo",
                length: 0,
                type: "variable",
            } as unknown as utils.IParameterConst)).to.throw(TypeError);

            // invalid type
            expect(() => utils.encodeParameter({
                data: 1,
                length: 0,
                type: "variable",
            } as unknown as utils.IParameterConst)).to.throw(TypeError);
        });
    });
});

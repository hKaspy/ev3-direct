import { expect } from "chai";
import "mocha";
import * as imp from "../src/cmd";
import * as cmdutils from "../src/cmdutils";

describe("cmd.ts", () => {

    describe("encodeRequestBody", () => {

        it("should encode empty body", () => {
            expect(imp.encodeRequestBody([])).to.deep.equal(Buffer.alloc(2, 0));
        });

        it("should encode non-empty body", () => {
            const buffer = Buffer.concat([
                cmdutils.encodeMemoryAllocation(4, 4),
                cmdutils.encodeByte(0x5e),
                cmdutils.encodeNumber({
                    bytes: 1,
                    value: 0x5e,
                }),
                cmdutils.encodeString("foo"),
                cmdutils.encodePointer({
                    bytes: 4,
                    scope: "global",
                    type: "int",
                }, 0),
                cmdutils.encodePointer({
                    bytes: 4,
                    scope: "local",
                    type: "float",
                }, 0),
            ]);

            const buff = imp.encodeRequestBody([
                0x5e,
                {
                    bytes: 1,
                    value: 0x5e,
                },
                "foo",
                {
                    bytes: 4,
                    scope: "global",
                    type: "int",
                },
                {
                    bytes: 4,
                    scope: "local",
                    type: "float",
                },
            ]);

            expect(buff).to.deep.equal(buffer);
        });

        it("should validate input", () => {
            expect(() => imp.encodeRequestBody([{} as any])).to.throw(TypeError);
        });
    });

    describe("encodeRequestHead", () => {

        it("should encode request head", () => {
            expect(imp.encodeRequestHead(0, 0)).to.deep.equal(Buffer.from([0x03, 0, 0, 0, 0]));
            expect(imp.encodeRequestHead(0x5e, 0)).to.deep.equal(Buffer.from([0x03, 0, 0x5e, 0, 0]));
            expect(imp.encodeRequestHead(0, 0, false)).to.deep.equal(Buffer.from([0x03, 0, 0, 0, 0x08]));

            // default arg value
            expect(imp.encodeRequestHead(0, 0, undefined)).to.deep.equal(Buffer.from([0x03, 0, 0, 0, 0]));
            expect(imp.encodeRequestHead(0, 0, true)).to.deep.equal(Buffer.from([0x03, 0, 0, 0, 0]));
        });

        it("should throw on counter out of range", () => {
            expect(() => imp.encodeRequestHead(-1, 0)).to.throw(RangeError);
            expect(() => imp.encodeRequestHead(32768, 0)).to.throw(RangeError);
        });

        it("should throw on bodyLength out of range", () => {
            expect(() => imp.encodeRequestHead(0, -1)).to.throw(RangeError);
            expect(() => imp.encodeRequestHead(0, 32765)).to.throw(RangeError);
        });
    });

    describe("createPointerMap", () => {

        it("should create a pointer map", () => {

            const pointerMap: cmdutils.IResponsePointer[] = [
                {
                    bytes: 4,
                    index: 0,
                    type: "int",
                },
                {
                    bytes: 4,
                    index: 4,
                    type: "int",
                },
            ];

            const resp = imp.createPointerMap([
                0x5e,
                {
                    bytes: 1,
                    value: 0x5e,
                },
                "foo",
                {
                    bytes: 4,
                    scope: "global",
                    type: "int",
                },
                {
                    bytes: 4,
                    scope: "local",
                    type: "float",
                },
                {
                    bytes: 4,
                    scope: "global",
                    type: "int",
                },
            ]);

            expect(resp).to.deep.equal(pointerMap);
        });
    });

    describe("decodeResponseHead", () => {

        it("should decode response head", () => {
            expect(imp.decodeResponseHead(Buffer.from([0x03, 0, 0, 0, 0x02]))).to.deep.equal({
                counter: 0,
                payload: Buffer.alloc(0),
                status: "ok",
            });
            expect(imp.decodeResponseHead(Buffer.from([0x03, 0, 0, 0, 0x04]))).to.deep.equal({
                counter: 0,
                status: "error",
            });
        });

        it("should throw on bad advertised body length", () => {
            // advertised body length larger than actual
            expect(() => imp.decodeResponseHead(Buffer.from([0x04, 0, 0, 0, 0x02]))).to.throw(RangeError);
            // advertised body length smaller than actual
            expect(() => imp.decodeResponseHead(Buffer.from([0x02, 0, 0, 0, 0x02]))).to.throw(RangeError);
        });

        it("should throw on invalid reponse type code", () => {
            expect(() => imp.decodeResponseHead(Buffer.from([0x03, 0, 0, 0, 0x00]))).to.throw(RangeError);
        });
    });

    describe("decodeResponseBody", () => {

        it("should decode response body", () => {
            const resp: cmdutils.IResponseValue[] = [{index: 0, value: "foo"}];
            expect(imp.decodeResponseBody(
                Buffer.from([0x66, 0x6f, 0x6f, 0, 0, 0]),
                [{bytes: 6, index: 0, type: "string"}],
            )).to.deep.equal(resp);
        });

        it("should throw on bad body size", () => {
            // body smaller than expected alloc size
            expect(() => imp.decodeResponseBody(
                Buffer.alloc(1, 0),
                [{bytes: 4, index: 0, type: "int"}],
            )).to.throw(Error);

            // body larger than expected alloc size
            expect(() => imp.decodeResponseBody(
                Buffer.alloc(4, 0),
                [{bytes: 1, index: 0, type: "int"}],
            )).to.throw(Error);
        });
    });
});

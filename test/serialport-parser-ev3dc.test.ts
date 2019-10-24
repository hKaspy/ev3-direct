import { expect } from "chai";
import sinon from "sinon";

import "mocha";
import EV3DCParser from "../src/serialport-parser-ev3dc";

describe("class EV3DCParser", () => {

    it("should pass a message", () => {
        const rg = new EV3DCParser();
        const spy = sinon.spy();
        const buff = Buffer.from([0x03, 0x00, 0xbb, 0xbb, 0xbb]);

        rg.on("data", spy);
        rg.end(buff);

        expect(spy.callCount).to.equal(1);
        expect(spy.getCall(0).args[0]).to.deep.equal(buff);
    });

    it("should pass big message", () => {
        const rg = new EV3DCParser();
        const spy = sinon.spy();

        const buffSize = 1024;
        const buff = Buffer.alloc(buffSize, 0xbb);
        buff.writeUInt16LE(buffSize - 2, 0);

        rg.on("data", spy);
        rg.end(buff);

        expect(spy.callCount).to.equal(1);
        expect(spy.getCall(0).args[0]).to.deep.equal(buff);
    });

    it("should transform 2 chunks into 1 message", () => {
        const rg = new EV3DCParser();
        const spy = sinon.spy();

        const buffArr = [
            // 1st chunk is missing last byte
            Buffer.from([0x03, 0x00, 0xbb, 0xbb]),
            // 2nd chunk has last byte and begins new message
            Buffer.from([0xbb, 0x04, 0x00, 0xbb, 0xbb, 0xbb, 0xbb]),
        ];

        rg.on("data", spy);

        for (const buff of buffArr) {
            rg.write(buff);
        }
        rg.end();

        expect(spy.callCount).to.equal(2);
        expect(spy.getCall(0).args[0]).to.have.lengthOf(5);
        expect(spy.getCall(1).args[0]).to.have.lengthOf(6);
    });

    it("should transform 1 chunk into 2 messages", () => {
        const rg = new EV3DCParser();
        const spy = sinon.spy();
        const buff = Buffer.from([0x03, 0x00, 0xbb, 0xbb, 0xbb, 0x04, 0x00, 0xbb, 0xbb, 0xbb, 0xbb]);

        rg.on("data", spy);
        rg.end(buff);

        expect(spy.callCount).to.equal(2);
        expect(spy.getCall(0).args[0]).to.have.lengthOf(5);
        expect(spy.getCall(1).args[0]).to.have.lengthOf(6);
    });
});

import { expect } from "chai";
import "mocha";
import { ResponseGlue } from "../../src/ResponseGlue";

describe("class ResponseGlue", () => {

    it("should pass a message", (next) => {
        const rg = new ResponseGlue();
        const bin = Buffer.from([0x03, 0x00, 0xbb, 0xbb, 0xbb]);

        rg.on("response", (resp: Buffer) => {
            expect(resp.toString("hex")).to.equal(bin.toString("hex"));
            next();
        });

        rg.end(bin);
    });

    it("should pass big message", (next) => {
        const rg = new ResponseGlue();

        const buffSize = 1024;
        const bin = Buffer.alloc(buffSize, 0xbb);
        bin.writeUInt16LE(buffSize - 2, 0);

        rg.on("response", (resp) => {
            expect(resp.toString("hex")).to.equal(bin.toString("hex"));
            next();
        });

        rg.end(bin);
    });

    it("should transform 3 chunks into 2 messages", (next) => {
        const rg = new ResponseGlue();
        const binarr = [
            // 1st chunk is missing last byte
            Buffer.from([0x03, 0x00, 0xbb, 0xbb]),
            // 2nd chunk has last byte and begins new message
            Buffer.from([0xbb, 0x04, 0x00, 0xbb]),
            // 3rd chunk has last two bytes of 2nd message
            Buffer.from([0xbb, 0xbb, 0xbb]),
        ];
        let counter = 0;

        rg.on("response", (resp) => {
            counter++;
            expect(resp).to.have.lengthOf(resp[0] + 2);
            if (counter === 2) { next(); }
        });

        for (const bin of binarr) {
            rg.write(bin);
        }
        rg.end();
    });
});

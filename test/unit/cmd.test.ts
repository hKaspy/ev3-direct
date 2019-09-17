import { expect } from "chai";
import "mocha";
import * as imp from "../../src/cmd";

describe("cmd.ts", () => {

    describe("assembleRequestBody", () => {

        it("should encode empty body", () => {
            const resp = imp.assembleRequestBody([]);

            expect(resp).to.haveOwnProperty("buffer");
            expect(resp).to.haveOwnProperty("pointerMap");

            expect(resp.buffer).to.deep.equal(Buffer.alloc(2, 0));
            expect(resp.pointerMap).to.deep.equal([]);
        });

        it("should validate input", () => {
            expect(() => imp.assembleRequestBody([{} as any])).to.throw(TypeError);
        });
    });
});

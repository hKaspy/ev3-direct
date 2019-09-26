import { expect } from "chai";
import "mocha";
import imp from "../src/opcodes";

describe("opcodes.ts", () => {
    it("should be an object", () => {
        expect(imp).to.be.an("object");
    });
});

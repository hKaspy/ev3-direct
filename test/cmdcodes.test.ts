import { expect } from "chai";
import "mocha";
import imp from "../src/cmdcodes";
import opcodes from "../src/opcodes";

describe("cmdcodes.ts", () => {
    it("should be an object", () => {
        expect(imp).to.be.an("object");
    });

    it("root keys should exist in opcodes", () => {
        const keys = (Object.keys(imp) as Array<keyof typeof imp>);
        for (const key of keys) {
            expect(imp[key]).to.be.an("object");
            expect(opcodes).to.haveOwnProperty(key);
        }
    });
});

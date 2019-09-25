import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import "mocha";
import { Broker } from "../src/Broker";

chai.use(chaiAsPromised);

const expect = chai.expect;

describe("class Broker", () => {

    it("should register a request", async () => {
        const brk = new Broker();
        brk.awaitResponse(0);
        expect(brk.getPoolSize()).to.equal(1);
    });

    it("should pair a response to request", async () => {
        const brk = new Broker();

        const prResp = brk.awaitResponse(0);

        expect(brk.getPoolSize()).to.equal(1);

        await expect(brk.registerResponse({
            counter: 0,
            payload: Buffer.alloc(0),
            status: "ok",
        })).to.be.fulfilled;

        const resp = await prResp;
        await expect(prResp).to.be.fulfilled;

        expect(brk.getPoolSize()).to.equal(0);

        expect(resp).to.haveOwnProperty("payload");
        expect(resp.counter).to.equal(0);
        expect(resp.status).to.equal("ok");
    });

    it("should reject a duplicit request", async () => {
        const brk = new Broker();

        brk.awaitResponse(0);
        await expect(brk.awaitResponse(0)).to.be.rejectedWith(Error);

        expect(brk.getPoolSize()).to.equal(1);
    });

    it("should reject a response with invalid respId", async () => {
        const brk = new Broker();
        await expect(brk.registerResponse({counter: 0, status: "error"})).to.be.rejectedWith(Error);
    });

});

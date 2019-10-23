import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import "mocha";
import { Broker } from "../src/Broker";

chai.use(chaiAsPromised);

const expect = chai.expect;

interface IBrokerResp {
    status: "ok"|"error";
}

describe("class Broker", () => {

    it("should register a request", async () => {
        const brk = new Broker();
        brk.awaitResponse(0, 0);
        expect(brk.getPoolSize()).to.equal(1);
    });

    it("should pair a response to request", async () => {
        const brk = new Broker<IBrokerResp>();

        const prResp = brk.awaitResponse(0, 10000);

        expect(brk.getPoolSize()).to.equal(1);

        await expect(brk.registerResponse(0, { status: "ok" })).to.be.fulfilled;

        const resp = await prResp;
        await expect(prResp).to.be.fulfilled;

        expect(brk.getPoolSize()).to.equal(0);

        expect(resp.status).to.equal("ok");
    });

    it("should reject a duplicit request", async () => {
        const brk = new Broker<IBrokerResp>();

        brk.awaitResponse(0, 0);
        await expect(brk.awaitResponse(0)).to.be.rejectedWith(Error);

        expect(brk.getPoolSize()).to.equal(1);
    });

    it("should reject request on timeout", async () => {
        const brk = new Broker<IBrokerResp>();
        await expect(brk.awaitResponse(0, 20)).to.be.rejectedWith(Error);
    });

    it("should reject a response with invalid respId", async () => {
        const brk = new Broker<IBrokerResp>();
        await expect(brk.registerResponse(0, { status: "error" })).to.be.rejectedWith(Error);
    });

});

import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import "mocha";
import sinon from "sinon";
import * as cmd from "../src/cmd";
import { EV3Base } from "../src/EV3Base";

import MockBinding from "@serialport/binding-mock";
import SerialPort from "@serialport/stream";
import { before } from "mocha";

chai.use(chaiAsPromised);
const expect = chai.expect;
const portName = "/dev/TESTPORT";
SerialPort.Binding = MockBinding;

describe("class EV3Base", () => {

    const port = new SerialPort(portName, { autoOpen: false });
    const brick = new EV3Base(port);

    before(() => {
        MockBinding.createPort(portName, {
            echo: false,
            readyData: Buffer.from([]),
            record: false,
        });
    });

    afterEach(() => {
        // hack to reset a private property
        (brick as any)._msgCounter = 0;

        sinon.restore();
    });

    after(() => {
        MockBinding.reset();
    });

    it("should be an EV3Base instance", () => {
        expect(brick).to.be.instanceOf(EV3Base);
    });

    it("should throw on port.open failure", async () => {
        const err = new Error("Just testing");
        const stub = sinon.stub(port, "open").callsFake((cb) => cb(err));

        await expect(brick.connect()).to.be.rejectedWith(err);
        stub.restore();
    });

    it("should be able to open the serial port", async () => {
        // should be closed at start
        expect(brick.isConnected()).to.equal(false);

        await expect(brick.connect()).to.be.fulfilled;
    });

    it("should resolve on already open port", async () => {
        await expect(brick.connect()).to.be.fulfilled;
    });

    it("should be able send a request and receive a response", async () => {
        const stub = sinon.stub(port, "write").callsFake((buff, callback) => {
            expect(buff).to.deep.equal(Buffer.concat([
                cmd.encodeRequestHead(0, 3, true),
                cmd.encodeRequestBody([0x01]),
            ]));

            callback();
            process.nextTick(() => {
                port.binding.emitData(Buffer.from([0x03, 0, 0, 0, 0x02]));
            });
        });

        const resp = await brick.sendRequest([0x01]);
        expect(resp).to.be.an("array");
        expect(resp).to.have.lengthOf(0);
        stub.restore();
    });

    it("should be able send a request and don't await response", async () => {
        const stub = sinon.stub(port, "write").callsFake((buff, callback) => {
            expect(buff).to.deep.equal(Buffer.concat([
                cmd.encodeRequestHead(0, 3, false),
                cmd.encodeRequestBody([0x01]),
            ]));

            callback();
        });

        await expect(brick.sendRequest([0x01], false)).to.be.fulfilled;
        stub.restore();
    });

    it("should throw on port.write error", async () => {
        const err = new Error("Just testing");
        const stub = sinon.stub(port, "write").callsFake((_, cb) => cb(err));

        await expect(brick.sendRequest([0x01])).to.be.rejectedWith(err);
        stub.restore();
    });

    it("should throw on response status: error", async () => {
        const stub = sinon.stub(port, "write").callsFake((_, callback) => {
            callback();
            process.nextTick(() => {
                port.binding.emitData(Buffer.from([0x03, 0, 0, 0, 0x04]));
            });
        });

        await expect(brick.sendRequest([0x01])).to.be.rejected;
        stub.restore();
    });

    it("should throw on port.close failure", async () => {
        const err = new Error("Just testing");
        const stub = sinon.stub(port, "close").callsFake((cb) => cb(err));
        await expect(brick.disconnect()).to.be.rejectedWith(err);
        stub.restore();
    });

    it("should close the serial port", async () => {
        expect(brick.isConnected()).to.equal(true);
        await expect(brick.disconnect()).to.be.fulfilled;
        expect(brick.isConnected()).to.equal(false);
    });

    it("should resolve on already closed port", async () => {
        await brick.disconnect();
        await expect(brick.disconnect()).to.be.fulfilled;
    });
});

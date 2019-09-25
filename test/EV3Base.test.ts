import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import "mocha";
import sinon from "sinon";
import * as cmd from "../src/cmd";
import { EV3Base } from "../src/EV3Base";

import MockBinding from "@serialport/binding-mock";
import SerialPort from "@serialport/stream";

chai.use(chaiAsPromised);
const expect = chai.expect;

const portName = "/dev/TESTPORT";

describe("class EV3Base", () => {

    beforeEach(() => {
        SerialPort.Binding = MockBinding;
        MockBinding.createPort(portName, {
            echo: false,
            readyData: Buffer.from([]),
            record: true,
        });
    });

    afterEach(() => {
        MockBinding.reset();
        sinon.restore();
    });

    it("should be an EV3Base instance", () => {
        const brick = new EV3Base(new SerialPort(portName, { autoOpen: false }));
        expect(brick).to.be.instanceOf(EV3Base);
    });

    it("should be able to open and close the serial port", async () => {
        const brick = new EV3Base(new SerialPort(portName, { autoOpen: false }));
        // should be closed before that
        expect(brick.isConnected()).to.equal(false);

        await expect(brick.connect()).to.be.fulfilled;

        // should be now open
        expect(brick.isConnected()).to.equal(true);

        await expect(brick.disconnect()).to.be.fulfilled;

        // should be closed at the end
        expect(brick.isConnected()).to.equal(false);
    });

    it("should close the serial port on SIGINT");

    it("should be able send a request", async () => {
        const port = new SerialPort(portName);
        const brick = new EV3Base(port);
        await expect(brick.sendRequest([0x01], false)).to.be.fulfilled;

        expect(port.binding.recording).to.deep.equal(Buffer.concat([
            cmd.encodeRequestHead(0, 3, false),
            cmd.encodeRequestBody([0x01]),
        ]));
    });

    it("should be able send a request and receive a response", async () => {
        const port = new SerialPort(portName, { autoOpen: false });
        const brick = new EV3Base(port);
        // open the port
        await brick.connect();

        // mock the port so it makes a response
        sinon.stub(port, "write").callsFake((_, callback) => {
            callback();
            process.nextTick(() => {
                port.binding.emitData(Buffer.from([0x03, 0, 0, 0, 0x02]));
            });
        });

        const resp = await brick.sendRequest([0x01]);
        expect(resp).to.be.an("array");
        expect(resp).to.have.lengthOf(0);
    });

    describe("#sendRequest", () => {

        it("should throw on port.write error", async () => {
            const port = new SerialPort(portName, { autoOpen: false });
            const brick = new EV3Base(port);
            const err = new Error("Just testing");

            await brick.connect();

            sinon.stub(port, "write").callsFake((_, cb) => cb(err));

            await expect(brick.sendRequest([0x01])).to.be.rejectedWith(err);
        });

        it("should throw on response status: error", async () => {
            const port = new SerialPort(portName, { autoOpen: false });
            const brick = new EV3Base(port);

            await brick.connect();

            sinon.stub(port, "write").callsFake((_, callback) => {
                callback();
                process.nextTick(() => {
                    port.binding.emitData(Buffer.from([0x03, 0, 0, 0, 0x04]));
                });
            });

            await expect(brick.sendRequest([0x01])).to.be.rejected;
        });
    });

    describe("#connect", () => {

        it("should throw on port.open failure", async () => {
            const port = new SerialPort(portName, { autoOpen: false });
            const brick = new EV3Base(port);
            const err = new Error("Just testing");

            // mock the port so it makes a response
            sinon.stub(port, "open").callsFake((cb) => cb(err));

            await expect(brick.connect()).to.be.rejectedWith(err);
        });

        it("should resolve on already open port", async () => {
            const port = new SerialPort(portName, { autoOpen: false });
            const brick = new EV3Base(port);

            await brick.connect();
            await expect(brick.connect()).to.be.fulfilled;
        });
    });

    describe("#disconnect", () => {

        it("should throw on port.close failure", async () => {
            const port = new SerialPort(portName, { autoOpen: false });
            const brick = new EV3Base(port);
            const err = new Error("Just testing");

            await brick.connect();

            // mock the port so it makes a response
            sinon.stub(port, "close").callsFake((cb) => cb(err));

            await expect(brick.disconnect()).to.be.rejectedWith(err);
        });

        it("should resolve on already closed port port", async () => {
            const port = new SerialPort(portName, { autoOpen: false });
            const brick = new EV3Base(port);

            await brick.disconnect();
            await expect(brick.disconnect()).to.be.fulfilled;
        });
    });
});

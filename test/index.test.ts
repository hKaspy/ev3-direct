import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import "mocha";
import sinon from "sinon";
import * as imp from "../src/index";

import MockBinding from "@serialport/binding-mock";
import SerialPort from "@serialport/stream";

chai.use(chaiAsPromised);
const expect = chai.expect;

const portName = "/dev/TESTPORT";

describe("index.ts", () => {

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

    describe("connectBrickByPort", () => {

        it("should call the correct chain internally", async () => {
            sinon.createStubInstance(imp.SerialPort);
            const res = "foo";

            const stub = sinon.stub(imp, "connectBrick").callsFake(async (sp) => {
                expect(sp).to.be.instanceOf(imp.SerialPort);
                return res as any;
            });

            await expect(imp.connectBrickByPort(portName)).to.eventually.equal(res);
            expect(stub.called).to.equal(true);
        });
    });

    describe("connectBrickById", () => {

        it("should call the correct chain internally", async () => {
            const res = "foo";

            const stub1 = sinon.stub(imp.SerialPort, "list").callsFake(async () => {
                return res as any;
            });

            const stub2 = sinon.stub(imp, "findBrickPort").callsFake((ports, brickId) => {
                expect(ports).to.equal(res);
                expect(brickId).to.equal(res);
                return res as any;
            });

            const stub3 = sinon.stub(imp, "connectBrickByPort").callsFake(async (port) => {
                expect(port).to.equal(res);
                return res as any;
            });

            await expect(imp.connectBrickById(res)).to.eventually.equal(res);
            expect(stub1.called).to.equal(true);
            expect(stub2.called).to.equal(true);
            expect(stub3.called).to.equal(true);
        });
    });

    describe("connectBrick", () => {

        it("should return an EV3 Class Promise", async () => {
            // make the method always return a supported FW version
            sinon.stub(imp.EV3.prototype, "getFWVersion").callsFake(async () => "V1.09H");

            await expect(imp.connectBrick(new SerialPort(portName, { autoOpen: false }))).to.eventually.be.instanceOf(imp.EV3);
        });

        it("should timeout after 5s without Brick response", async () => {
            // simulate long delay, possibly no response at all
            sinon.stub(imp.EV3.prototype, "getFWVersion").callsFake(async () => new Promise((resolve) => setTimeout(resolve, 4000)));

            await expect(imp.connectBrick(new SerialPort(portName, { autoOpen: false }), 100)).to.be.rejectedWith(Error);
        });

        it("should print a console warning on unsupported FW");
    });

    describe("findBrickPort", () => {

        it("should find a match on Generic Windows BT Serial Port", () => {
            expect(imp.findBrickPort([
                {
                    comName: portName,
                    pnpId: "BTHENUM\\{00001101-0000-1000-8000-00805F9B34FB}_LOCALMFG&0002\\7&D82B5DB&0&00112233AABB_C00000000",
                },
            ],
            "00112233aabb")).to.equal(portName);
        });

        it("should should throw if brick not found", () => {
            expect(() => imp.findBrickPort([
                { comName: "testname" },
            ], "00112233aabb")).to.throw(Error);
        });
    });
});

import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import "mocha";
import sinon from "sinon";
import * as imp from "../../src/utils";

import MockBinding from "@serialport/binding-mock";
import SerialPort from "@serialport/stream";
import { EV3 } from "../../src/EV3";

chai.use(chaiAsPromised);
const expect = chai.expect;

const portName = "/dev/TESTPORT";

describe("utils.ts", () => {

    describe("connectBrick", () => {

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
        });

        it("should return an EV3 Class Promise", async () => {
            // make the method always return a supported FW version
            sinon.stub(EV3.prototype, "getFWVersion").callsFake(async () => "V1.09H");

            await expect(imp.connectBrick(new SerialPort(portName, { autoOpen: false }))).to.eventually.be.instanceOf(EV3);
        });
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
            expect(() => imp.findBrickPort([], "00112233aabb")).to.throw(Error);
        });
    });
});

import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import "mocha";
import sinon from "sinon";
import { EV3 } from "../src/EV3";

import MockBinding from "@serialport/binding-mock";
import SerialPort from "@serialport/stream";

chai.use(chaiAsPromised);
const expect = chai.expect;
const portName = "/dev/TESTPORT";
SerialPort.Binding = MockBinding;

function pluck<T, K extends keyof T>(o: T, propertyNames: K[]): K[] {
    return propertyNames.filter((n) => n in o);
}

describe("class EV3", () => {

    beforeEach(() => {
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

    describe("simple methods", () => {

        it("should return a string", async () => {
            const methods = pluck(EV3.prototype, [
                "getBrickname",
                "getFWVersion",
                "getHWVersion",
                "getOSVersion",
                "getSubfolderName",
            ]);

            const brick = new EV3(new SerialPort(portName, { autoOpen: false }));
            sinon.stub(brick, "sendRequest").callsFake(async (): Promise<any> => ["foo"]);

            for (const method of methods) {
                await expect(brick[method](undefined as any, undefined as any)).to.eventually.equal("foo");
            }
        });

        it("should return a number", async () => {
            const methods = pluck(EV3.prototype, [
                "getBatteryCurrent",
                "getBatteryPercent",
                "getBatteryVoltage",
                "getSubfolderCount",
            ]);

            const brick = new EV3(new SerialPort(portName, { autoOpen: false }));
            sinon.stub(brick, "sendRequest").callsFake(async (): Promise<any> => [123]);

            for (const method of methods) {
                await expect(brick[method](undefined as any)).to.eventually.equal(123);
            }
        });

        it("should return void", async () => {
            const methods = pluck(EV3.prototype, [
                "doNothing",
            ]);

            const brick = new EV3(new SerialPort(portName, { autoOpen: false }));
            sinon.stub(brick, "sendRequest").callsFake(async (): Promise<any> => [123]);

            for (const method of methods) {
                await expect(brick[method]()).to.eventually.equal(void 0);
            }
        });
    });

    describe("advanced methods", () => {

        describe("getSubfolders", async () => {
            const brick = new EV3(new SerialPort(portName, { autoOpen: false }));

            sinon.stub(brick, "getSubfolderCount").callsFake(async (): Promise<any> => 1);
            sinon.stub(brick, "getSubfolderName").callsFake(async (): Promise<any> => "foo");

            await expect(brick.getSubfolders("")).to.eventually.deep.equal(["foo"]);
        });
    });
});

# ev3 direct

Control your LEGO EV3 brick via direct commands - over Bluetooth, USB or Wi-Fi. Uses [node-serialport](https://serialport.io/).

Made in TypeScript!

The control code is an implementation of the official documentation available on the [LEGO Mindstorms website](https://www.lego.com/en-gb/themes/mindstorms/downloads) - EV3 Firmware Developer Kit and EV3 Communication Developer Kit.

## Usage

```bash
npm install ev3-direct
```

Connect your EV3 P-Brick over Bluetooth.

If you don't know the Bluetooth port the P-Brick is connected to, find it by Brick ID:

```typescript
import { findBrickPort } from "ev3-direct";

findBrickPort("00112233aabb").then((brickPort) => {
    console.log(brickPort);
});
```

Then send commands to your brick!

```typescript
import { connectBrickByPort } from "ev3-direct";

connectBrickByPort("COM4").then(async (brick) => {
    return brick.getBrickname();
}).then((resp) => {
    console.log(resp);
}).catch((err) => {
    console.error(err);
});
```

## Advanced usage

The EV3 class has only few basic methods implemented. To implement advanced logic, see [custom requests](./docs/custom-requests)
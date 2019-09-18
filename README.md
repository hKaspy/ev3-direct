# ev3 direct

Control your LEGO EV3 brick via direct commands - over Bluetooth, USB or Wi-Fi.

Made in TypeScript!

## Usage

`npm install ev3-direct`

Connect your EV3 P-Brick over Bluetooth.

If you don't know the Bluetooth port the P-Brick is connected to, find it by Brick ID:

```typescript
import { findBrickPort } from "./index";

findBrickPort("00112233aabb").then((brickPort) => {
    console.log(brickPort);
});
```

Then send commands to your brick!

```typescript
import { connectBrick } from "./index";

connectBrick("COM4").then(async (brick) => {
    return brick.getBrickname();
}).then((resp) => {
    console.log(resp);
}).catch((err) => {
    console.error(err);
});
```
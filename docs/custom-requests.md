# Custom requests

If you want to send Direct Commands not covered by the modules EV3 class, this guide will help you.

First, download the official [EV3 Firmware Developer Kit](https://www.lego.com/cdn/cs/set/assets/blt77bd61c3ac436ea3/LEGO_MINDSTORMS_EV3_Firmware_Developer_Kit.pdf) for reference.

## Simple example

Lets start with something simple, such as getting the EV3 Brick's name

Documentation for Instruction `opCom_Get`, command `GET_BRICKNAME`:

```
Instruction opCom_Get (CMD, …) 
    Opcode 0xD3
    Arguments (Data8) CMD => Specific command parameter documented below
    Dispatch status Can return FAILBREAK
    Description Communication get entry

        ...

        CMD: GET_BRICKNAME = 0x0D
        Arguments
            (Data8) LENGTH – Max length of returned string
        Return
            (Data8) NAME – First character in brick name (Zero terminated)
        Description
            Get the name of the brick
```

This tells us the Instruction `opCom_Get` takes at least one argument - CMD which is 8 bit integer.

The command `GET_BRICKNAME` then takes another argument - LENGTH, again 8 bit integer.

The command returns a value NAME - in this case, Data8 with the description starting "First character" means that it returns a string.

You can implement that like this:

```typescript
import { connectBrickByPort, opcodes, cmdcodes } from "ev3-direct";

connectBrickByPort("COM4").then(async (brick) => {
    const resp = await brick.sendRequest([
        // for simplicity, use the provided enums from opcodes and cmdcodes
        // start with the opcode
        opcodes.comGet,
        // argument CMD
        cmdcodes.comGet.GET_BRICKNAME,
        // argument LENGTH - must be in this form to get properly encoded
        {
            bytes: 1,
            value: 30,
        },
        // memory pointer to the return value of NAME
        // allocate 30 bytes, same as the argument LENGTH's value
        // scope: "global" means it gets returned in the Direct Command reply
        {
            bytes: 30,
            scope: "global",
            type: "string",
        },
    ]);

    // sendRequest returns an array of values allocated in the global memory scope
    // the order of the values corresponds to the order of global memory pointers in the request
    return resp[0];
}).then((resp) => {
    console.log(resp);
}).catch((err) => {
    console.error(err);
});
```
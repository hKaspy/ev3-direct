import { Response } from "./cmd";

interface IRequestPool {
    [key: number]: {
        resolve: (resp: Response) => void;
        reject: (reason: any) => void;
    };
}

export class Broker {

    private requestPool: IRequestPool = {};

    public async registerRequest(reqId: number): Promise<Response> {
        if (this.requestPool[reqId] !== undefined) { throw new Error(`Request with id ${reqId} already registered`); }

        const pr = new Promise((resolve: (resp: Response) => void, reject) => {
            this.requestPool[reqId] = { reject, resolve };
        });

        return pr.finally(() => {
            delete this.requestPool[reqId];
        });
    }

    public async registerResponse(resp: Response) {
        if (this.requestPool[resp.counter] === undefined) { throw new Error(`Could not pair response id ${resp.counter}`); }

        return this.requestPool[resp.counter].resolve(resp);
    }

    public getPoolSize(): number {
        return Object.keys(this.requestPool).length;
    }
}

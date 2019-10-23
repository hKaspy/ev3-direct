interface IRequestPool<Resp> {
    [key: number]: {
        resolve: (resp: Resp) => void;
        reject: (reason: any) => void;
    };
}

export class Broker<T> {

    private requestPool: IRequestPool<T> = {};

    public async awaitResponse(respId: number, timeout: number = 5000): Promise<T> {
        if (timeout < 0) { throw new TypeError(`argument "timeout" must be >= 0`); }
        if (this.requestPool[respId] !== undefined) { throw new Error(`respId ${respId} already registered`); }

        const pr = new Promise((resolve: (resp: T) => void, reject) => {
            this.requestPool[respId] = { reject, resolve };
            if (timeout > 0) { setTimeout(() => { reject(new Error("timeout reached")); }, timeout); }
        });

        return pr.finally(() => {
            delete this.requestPool[respId];
        });
    }

    public async registerResponse(respID: number, resp: T) {
        if (this.requestPool[respID] === undefined) { throw new Error(`respID ${respID} not registered`); }

        return this.requestPool[respID].resolve(resp);
    }

    public getPoolSize(): number {
        return Object.keys(this.requestPool).length;
    }
}

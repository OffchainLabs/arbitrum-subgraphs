// This was created manually because of https://github.com/graphprotocol/graph-cli/issues/342

import {
  ethereum,
  JSONValue,
  TypedMap,
  Entity,
  Bytes,
  Address,
  BigInt
} from "@graphprotocol/graph-ts";

export class IRollupCoreNodeRejected extends ethereum.Event {
  get params(): IRollupCoreNodeRejected__Params {
    return new IRollupCoreNodeRejected__Params(this);
  }
}

export class IRollupCoreNodeRejected__Params {
  _event: IRollupCoreNodeRejected;

  constructor(event: IRollupCoreNodeRejected) {
    this._event = event;
  }

  get nodeNum(): BigInt {
    return this._event.parameters[0].value.toBigInt();
  }
}


export class IRollupCoreNodeConfirmed extends ethereum.Event {
  get params(): IRollupCoreNodeConfirmed__Params {
    return new IRollupCoreNodeConfirmed__Params(this);
  }
}
export class IRollupCoreNodeConfirmed__Params {
  _event: IRollupCoreNodeConfirmed;

  constructor(event: IRollupCoreNodeConfirmed) {
    this._event = event;
  }

  get nodeNum(): BigInt {
    return this._event.parameters[0].value.toBigInt();
  }

  get afterSendAcc(): Bytes {
    return this._event.parameters[1].value.toBytes();
  }

  get afterSendCount(): BigInt {
    return this._event.parameters[2].value.toBigInt();
  }

  // TODO: add in other parameters
}


export class IRollupCoreNodeCreated extends ethereum.Event {
  get params(): IRollupCoreNodeCreated__Params {
    return new IRollupCoreNodeCreated__Params(this);
  }
}

export class IRollupCoreNodeCreated__Params {
  _event: IRollupCoreNodeCreated;

  constructor(event: IRollupCoreNodeCreated) {
    this._event = event;
  }

  get nodeNum(): BigInt {
    return this._event.parameters[0].value.toBigInt();
  }

  get parentNodeHash(): Bytes {
    return this._event.parameters[1].value.toBytes();
  }

  get nodeHash(): Bytes {
    return this._event.parameters[2].value.toBytes();
  }

  get executionHash(): Bytes {
    return this._event.parameters[3].value.toBytes();
  }

  get inboxMaxCount(): BigInt {
    return this._event.parameters[4].value.toBigInt();
  }

  get afterInboxBatchEndCount(): BigInt {
    return this._event.parameters[5].value.toBigInt();
  }

  get afterInboxBatchAcc(): Bytes {
    return this._event.parameters[6].value.toBytes();
  }

  get assertionBytes32Fields(): Array<Array<Bytes>> {
    const valueArray = this._event.parameters[7].value.toArray()

    let out = new Array<Array<Bytes>>(valueArray.length)
    for (let i: i32 = 0; i < valueArray.length; i++) {
      out[i] = valueArray[i].toBytesArray()
    }
    return out
  }

  get assertionIntFields(): Array<Array<BigInt>> {
    const valueArray = this._event.parameters[8].value.toArray()

    let out = new Array<Array<BigInt>>(valueArray.length)
    for (let i: i32 = 0; i < valueArray.length; i++) {
      out[i] = valueArray[i].toBigIntArray()
    }
    return out
  }
}

export class IRollupCore extends ethereum.SmartContract {
  static bind(address: Address): IRollupCore {
    return new IRollupCore("IRollupCore", address);
  }
  // TODO: add in read-only methods
}

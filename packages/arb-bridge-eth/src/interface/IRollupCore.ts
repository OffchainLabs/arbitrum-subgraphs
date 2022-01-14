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
  // TODO: add in other parameters
}

export class IRollupCore extends ethereum.SmartContract {
  static bind(address: Address): IRollupCore {
    return new IRollupCore("IRollupCore", address);
  }
  // TODO: add in read-only methods
}

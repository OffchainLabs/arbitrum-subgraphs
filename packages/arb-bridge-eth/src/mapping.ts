import {
  OutBoxTransactionExecuted as OutBoxTransactionExecutedEvent,
  OutboxEntryCreated as OutboxEntryCreatedEvent,
} from "../generated/Outbox/Outbox";
import { InboxMessageDelivered as InboxMessageDeliveredEvent } from "../generated/Inbox/Inbox";
import { MessageDelivered as MessageDeliveredEvent } from "../generated/Bridge/Bridge";
import { IRollupCoreNodeCreated as NodeCreatedEvent } from "./interface/IRollupCore";
import {
  OutboxEntry,
  OutboxOutput,
  Retryable,
  RawMessage,
  Node as NodeEntity,
} from "../generated/schema";
import {
  Bytes,
  BigInt,
  ethereum,
  Address,
  log,
  dataSource,
  crypto,
  store,
  ByteArray
} from "@graphprotocol/graph-ts";
import { encodePadded, padBytes } from "subgraph-common";

const getL2ChainId = (): Bytes => {
  const network = dataSource.network();
  if (network == "mainnet")
    return Bytes.fromByteArray(Bytes.fromHexString("0xa4b1"));
  if (network == "rinkeby")
    return Bytes.fromByteArray(Bytes.fromHexString("0x066EEB"));

  log.critical("No chain id recognised", []);
  throw new Error("No chain id found");
};

const bitFlip = (input: BigInt): Bytes => {
  // base hex string is all zeroes, with the highest bit set. equivalent to 1 << 255
  const base = Bytes.fromHexString(
    "0x8000000000000000000000000000000000000000000000000000000000000000"
  );
  const bytes = padBytes(Bytes.fromBigInt(input), 32);

  for (let i: i32 = 0; i < base.byteLength; i++) {
    base[i] = base[i] | bytes[i];
  }

  return Bytes.fromByteArray(base);
};

const getL2RetryableTicketId = (inboxSequenceNumber: BigInt): Bytes => {
  // keccak256(zeroPad(l2ChainId), zeroPad(bitFlipedinboxSequenceNumber))
  const l2ChainId = getL2ChainId();
  const flipped = bitFlip(inboxSequenceNumber);
  const encoded: ByteArray = encodePadded(l2ChainId, flipped);
  const res = Bytes.fromByteArray(crypto.keccak256(encoded));

  // log.info(
  //   "Getting Retryable ticket Id. l2Chain id {} . inboxSeq {} . flipped {} . encoded {} . retTicketId {}",
  //   [
  //     l2ChainId.toHexString(),
  //     inboxSequenceNumber.toHexString(),
  //     flipped.toHexString(),
  //     encoded.toHexString(),
  //     res.toHexString(),
  //   ]
  // );

  return res;
};

const bigIntToId = (input: BigInt): string => input.toHexString();

export function handleOutBoxTransactionExecuted(
  event: OutBoxTransactionExecutedEvent
): void {
  // this ID is not the same as the outputId used on chain
  const id = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let entity = new OutboxOutput(id);
  entity.destAddr = event.params.destAddr;
  entity.l2Sender = event.params.l2Sender;
  entity.outboxEntry = bigIntToId(event.params.outboxEntryIndex);
  entity.path = event.params.transactionIndex;
  // if OutBoxTransactionExecuted was emitted then the OutboxOutput was spent
  entity.spent = true;
  entity.save();
}

export function handleOutboxEntryCreated(event: OutboxEntryCreatedEvent): void {
  let entity = new OutboxEntry(bigIntToId(event.params.batchNum));
  entity.outboxEntryIndex = event.params.outboxEntryIndex;
  entity.outputRoot = event.params.outputRoot;
  entity.numInBatch = event.params.numInBatch;
  entity.save();
}

const bigIntToAddress = (input: BigInt): Address => {
  // remove the prepended 0x
  const hexString = input.toHexString().substr(2);
  // add missing padding so address is 20 bytes long
  const missingZeroes = "0".repeat(40 - hexString.length);
  // build hexstring again
  const addressString = "0x" + missingZeroes + hexString;
  return Address.fromString(addressString);
};

class RetryableTx {
  private constructor(
    public destAddress: Address,
    public l2CallValue: BigInt,
    public l1CallValue: BigInt,
    public maxSubmissionCost: BigInt,
    public excessFeeRefundAddress: Address,
    public callValueRefundAddress: Address,
    public maxGas: BigInt,
    public gasPriceBid: BigInt,
    public dataLength: BigInt,
    public data: Bytes
  ) {}

  static parseRetryable(data: Bytes): RetryableTx | null {
    const parsedWithoutData = ethereum.decode(
      "(uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256)",
      data
    );
    if (parsedWithoutData) {
      const parsedArray = parsedWithoutData.toTuple();
      const dataLength = parsedArray[8].toBigInt().toI32();
      const l2Calldata = new Bytes(dataLength);

      for(let i = 0; i < dataLength; i++) {
        l2Calldata[dataLength-i-1] = data[data.length - i - 1]
      }

      return new RetryableTx(
        bigIntToAddress(parsedArray[0].toBigInt()),
        parsedArray[1].toBigInt(),
        parsedArray[2].toBigInt(),
        parsedArray[3].toBigInt(),
        bigIntToAddress(parsedArray[4].toBigInt()),
        bigIntToAddress(parsedArray[5].toBigInt()),
        parsedArray[6].toBigInt(),
        parsedArray[7].toBigInt(),
        BigInt.fromI32(dataLength),
        l2Calldata
      );
    }

    return null;
  }
}

export function handleInboxMessageDelivered(
  event: InboxMessageDeliveredEvent
): void {
  // TODO: handle `InboxMessageDeliveredFromOrigin(indexed uint256)`. Same as this function, but use event.tx.input instead of event data
  const id = bigIntToId(event.params.messageNum);
  let prevEntity = RawMessage.load(id);

  // this assumes that an entity was previously created since the MessageDelivered event is emitted before the inbox event
  if (!prevEntity) {
    log.critical("Wrong order in entity!!", []);
    throw new Error("Oh damn no entity wrong order");
  }
  if (prevEntity.kind != "Retryable") {
    log.info("Prev entity not a retryable, skipping. messageNum: {}", [event.params.messageNum.toHexString()])
    return;
  }
  log.info("Processing retryable before", [])
  const retryable = RetryableTx.parseRetryable(event.params.data);
  log.info("Processing retryable after", [])
  if (retryable) {
    let entity = new Retryable(id);
    entity.value = event.transaction.value;
    entity.isEthDeposit = retryable.dataLength == BigInt.zero();
    entity.retryableTicketID = getL2RetryableTicketId(event.params.messageNum);
    entity.destAddr = retryable.destAddress;
    entity.l2Calldata = retryable.data;
    entity.save();
    // we delete the old raw message since now we saved the retryable
    store.remove("RawMessage", id);
  } else {
    log.error("Not able to parse tx with id {}", [id.toString()]);
  }
}

export function handleMessageDelivered(event: MessageDeliveredEvent): void {
  const id = bigIntToId(event.params.messageIndex);
  let entity = new RawMessage(id);
  entity.kind = event.params.kind == 9 ? "Retryable" : "NotSupported";
  entity.save();
}

export function handleNodeCreated(event: NodeCreatedEvent): void {
  const id = bigIntToId(event.params.nodeNum);
  let entity = new NodeEntity(id);
  entity.parentHash = event.params.parentNodeHash;
  entity.blockCreatedAt = event.block.number;
  entity.save();
}

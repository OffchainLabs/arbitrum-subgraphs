import {
  OutBoxTransactionExecuted as OutBoxTransactionExecutedEvent,
  OutboxEntryCreated as OutboxEntryCreatedEvent,
} from "../generated/Outbox/Outbox";
import { InboxMessageDelivered as InboxMessageDeliveredEvent } from "../generated/Inbox/Inbox";
import { MessageDelivered as MessageDeliveredEvent } from "../generated/Bridge/Bridge";
import { OutboxEntry, OutboxOutput, InboxMessage } from "../generated/schema";
import { Bytes, BigInt, ethereum, Address, log } from "@graphprotocol/graph-ts";

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
    public data: Bytes
  ) {}

  static parseRetryable(data: Bytes): RetryableTx | null {
    const parsedWithData = ethereum.decode(
      "(uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,bytes)",
      data
    );
    if (parsedWithData) {
      const parsedArray = parsedWithData.toTuple();

      return new RetryableTx(
        bigIntToAddress(parsedArray[0].toBigInt()),
        parsedArray[1].toBigInt(),
        parsedArray[2].toBigInt(),
        parsedArray[3].toBigInt(),
        bigIntToAddress(parsedArray[4].toBigInt()),
        bigIntToAddress(parsedArray[5].toBigInt()),
        parsedArray[6].toBigInt(),
        parsedArray[7].toBigInt(),
        parsedArray[9].toBytes()
      );
    }

    const parsedWithoutData = ethereum.decode(
      "(uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256)",
      data
    );
    if (parsedWithoutData) {
      const parsedArray = parsedWithoutData.toTuple();

      return new RetryableTx(
        bigIntToAddress(parsedArray[0].toBigInt()),
        parsedArray[1].toBigInt(),
        parsedArray[2].toBigInt(),
        parsedArray[3].toBigInt(),
        bigIntToAddress(parsedArray[4].toBigInt()),
        bigIntToAddress(parsedArray[5].toBigInt()),
        parsedArray[6].toBigInt(),
        parsedArray[7].toBigInt(),
        Bytes.empty()
      );
    }

    return null;
  }
}

export function handleInboxMessageDelivered(
  event: InboxMessageDeliveredEvent
): void {
  // TODO: handle `InboxMessageDeliveredFromOrigin(indexed uint256)`. Same as this function, but use event.tx.input instead of event data
  let entity = InboxMessage.load(bigIntToId(event.params.messageNum));

  // this assumes that an entity was previously created since the MessageDelivered event is emitted before the inbox event
  if (!entity) {
    log.critical("Wrong order in entity!!", []);
    throw new Error("Oh damn no entity wrong order");
  }
  if (entity.kind != "Retryable") return;

  const retryable = RetryableTx.parseRetryable(event.params.data);
  entity.value = event.transaction.value;
  if (retryable) {
    // TODO: everything is currently a retryable, why??
    entity.kind = retryable.data.byteLength > 0 ? "Retryable" : "EthDeposit";
    entity.destAddr = retryable.destAddress;
    entity.isProcessed = true;
  } else {
    entity.kind = "NotSupported";
    entity.destAddr = null;
  }
  entity.save();
}

export function handleMessageDelivered(event: MessageDeliveredEvent): void {
  let entity = new InboxMessage(bigIntToId(event.params.messageIndex));
  entity.kind = event.params.kind == 9 ? "Retryable" : "NotSupported";
  entity.isProcessed = false;
  entity.save();
}

import {
  OutBoxTransactionExecuted as OutBoxTransactionExecutedEvent,
  OutboxEntryCreated as OutboxEntryCreatedEvent
} from "../generated/Outbox/Outbox";
import {
  InboxMessageDelivered as InboxMessageDeliveredEvent,
} from "../generated/Inbox/Inbox";
import {
  OutboxEntry,
  OutboxOutput,
  InboxMessage
} from "../generated/schema";
import { Bytes, BigInt, ethereum, Address } from "@graphprotocol/graph-ts";

const bigIntToId = (input: BigInt): string => input.toHexString()

export function handleOutBoxTransactionExecuted(
  event: OutBoxTransactionExecutedEvent
): void {
  // this ID is not the same as the outputId used on chain
  const id = event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  let entity = new OutboxOutput(id)
  entity.destAddr = event.params.destAddr
  entity.l2Sender = event.params.l2Sender
  entity.outboxEntry = bigIntToId(event.params.outboxEntryIndex)
  entity.transactionIndex = event.params.transactionIndex
  // if OutBoxTransactionExecuted was emitted then the OutboxOutput was spent
  entity.spent = true;
  entity.save()
}

export function handleOutboxEntryCreated(event: OutboxEntryCreatedEvent): void {
  let entity = new OutboxEntry(bigIntToId(event.params.batchNum))
  entity.outboxEntryIndex = event.params.outboxEntryIndex
  entity.outputRoot = event.params.outputRoot
  entity.numInBatch = event.params.numInBatch
  entity.save()
}

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
    const parsed = ethereum.decode(
      "(uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,bytes)",
      data
    )

    if(parsed) {
      const parsedArray = parsed.toTuple()

      return new RetryableTx(
        parsedArray[0].toAddress(),
        parsedArray[1].toBigInt(),
        parsedArray[2].toBigInt(),
        parsedArray[3].toBigInt(),
        parsedArray[4].toAddress(),
        parsedArray[5].toAddress(),
        parsedArray[6].toBigInt(),
        parsedArray[7].toBigInt(),
        parsedArray[9].toBytes()
      )
    }
    return null;
  }
}

export function handleInboxMessageDelivered(event: InboxMessageDeliveredEvent): void {
  // TODO: handle `InboxMessageDeliveredFromOrigin(indexed uint256)`. Same as this function, but use event.tx.input instead of event data
  const retryable = RetryableTx.parseRetryable(event.params.data)

  if(retryable) {
    let entity = new InboxMessage(bigIntToId(event.params.messageNum))
    entity.kind = retryable.data.length > 0 ? "Retryable" : "EthDeposit"
    entity.destAddr = retryable.destAddress
    entity.value = event.transaction.value
    entity.save();
  }
}

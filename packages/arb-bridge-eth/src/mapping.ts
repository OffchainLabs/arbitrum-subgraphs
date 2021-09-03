import {
  OutBoxTransactionExecuted as OutBoxTransactionExecutedEvent,
  OutboxEntryCreated as OutboxEntryCreatedEvent
} from "../generated/Outbox/Outbox";
import {
  OutboxEntry,
  OutboxOutput
} from "../generated/schema";
import { BigInt } from "@graphprotocol/graph-ts";

const batchNumToId = (input: BigInt): string => input.toHexString()

export function handleOutBoxTransactionExecuted(
  event: OutBoxTransactionExecutedEvent
): void {
  // this ID is not the same as the outputId used on chain
  const id = event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  let entity = new OutboxOutput(id)
  entity.destAddr = event.params.destAddr
  entity.l2Sender = event.params.l2Sender
  entity.outboxEntry = batchNumToId(event.params.outboxEntryIndex)
  entity.transactionIndex = event.params.transactionIndex
  // if OutBoxTransactionExecuted was emitted then the OutboxOutput was spent
  entity.spent = true;
  entity.save()
}

export function handleOutboxEntryCreated(event: OutboxEntryCreatedEvent): void {
  let entity = new OutboxEntry(batchNumToId(event.params.batchNum))
  entity.outboxEntryIndex = event.params.outboxEntryIndex
  entity.outputRoot = event.params.outputRoot
  entity.numInBatch = event.params.numInBatch
  entity.save()
}

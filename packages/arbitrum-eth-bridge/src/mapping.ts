import {
  OutBoxTransactionExecuted as OutBoxTransactionExecutedEvent,
  OutboxEntryCreated as OutboxEntryCreatedEvent
} from "../generated/Outbox/Outbox"
import {
  OutBoxTransactionExecuted,
  OutboxEntryCreated
} from "../generated/schema"

export function handleOutBoxTransactionExecuted(
  event: OutBoxTransactionExecutedEvent
): void {
  let entity = new OutBoxTransactionExecuted(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.destAddr = event.params.destAddr
  entity.l2Sender = event.params.l2Sender
  entity.outboxEntryIndex = event.params.outboxEntryIndex
  entity.transactionIndex = event.params.transactionIndex
  entity.save()
}

export function handleOutboxEntryCreated(event: OutboxEntryCreatedEvent): void {
  let entity = new OutboxEntryCreated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.batchNum = event.params.batchNum
  entity.outboxEntryIndex = event.params.outboxEntryIndex
  entity.outputRoot = event.params.outputRoot
  entity.numInBatch = event.params.numInBatch
  entity.save()
}

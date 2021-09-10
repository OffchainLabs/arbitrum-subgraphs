import { L2ToL1Transaction as L2ToL1TransactionEvent } from "../generated/ArbSys/ArbSys"
import { L2ToL1Transaction } from "../generated/schema"

export function handleL2ToL1Transaction(event: L2ToL1TransactionEvent): void {
  let entity = new L2ToL1Transaction(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.caller = event.params.caller
  entity.destination = event.params.destination
  entity.uniqueId = event.params.uniqueId
  entity.batchNumber = event.params.batchNumber
  entity.indexInBatch = event.params.indexInBatch
  entity.arbBlockNum = event.params.arbBlockNum
  entity.ethBlockNum = event.params.ethBlockNum
  entity.timestamp = event.params.timestamp
  entity.callvalue = event.params.callvalue
  entity.data = event.params.data

  // TODO: query for L2 to L1 tx proof
  // TODO: don't make this an archive query
  // this will either be the proof or null
  // if not null, backfill previous ones that were null

  entity.save()
}

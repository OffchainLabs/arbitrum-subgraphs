import { L2ToL1Transaction as L2ToL1TransactionEvent } from "../generated/ArbSys/ArbSys";
import { L2ToL1Transaction, Retryable } from "../generated/schema";
import {
  Canceled as CanceledEvent,
  LifetimeExtended as LifetimeExtendedEvent,
  Redeemed as RedeemedEvent,
  TicketCreated as TicketCreatedEvent,
} from "../generated/ArbRetryableTx/ArbRetryableTx";
import { Bytes, BigInt, crypto, log, ByteArray } from "@graphprotocol/graph-ts";
import { encodePadded } from "subgraph-common/src/helpers";

export function handleL2ToL1Transaction(event: L2ToL1TransactionEvent): void {
  // TODO: make the uniqueId the actual ID
  let entity = new L2ToL1Transaction(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  entity.caller = event.params.caller;
  entity.destination = event.params.destination;
  entity.uniqueId = event.params.uniqueId;
  entity.batchNumber = event.params.batchNumber;
  entity.indexInBatch = event.params.indexInBatch;
  entity.arbBlockNum = event.params.arbBlockNum;
  entity.ethBlockNum = event.params.ethBlockNum;
  entity.timestamp = event.params.timestamp;
  entity.callvalue = event.params.callvalue;
  entity.data = event.params.data;

  // TODO: query for L2 to L1 tx proof
  // TODO: don't make this an archive query
  // this will either be the proof or null
  // if not null, backfill previous ones that were null

  entity.save();
}

const ticketIdToEntityId = (input: Bytes): string => input.toHexString();

export function handleCanceled(event: CanceledEvent): void {
  let entity = Retryable.load(ticketIdToEntityId(event.params.ticketId));
  if (!entity) {
    log.critical("Missed a retryable ticket somewhere!", []);
    throw new Error("No retryable ticket");
  }
  entity.status = "Canceled";
  entity.save();
}

export function handleLifetimeExtended(event: LifetimeExtendedEvent): void {
  let entity = Retryable.load(ticketIdToEntityId(event.params.ticketId));
  if (!entity) {
    log.critical("Missed a retryable ticket somewhere!", []);
    throw new Error("No retryable ticket");
  }
  entity.timeoutTimestamp = entity.timeoutTimestamp.plus(
    event.params.newTimeout
  );
  entity.save();
}

export function handleRedeemed(event: RedeemedEvent): void {
  let entity = Retryable.load(ticketIdToEntityId(event.params.ticketId));
  if (!entity) {
    log.critical("Missed a retryable ticket somewhere!", []);
    throw new Error("No retryable ticket");
  }
  // TODO: we can use the tx hash to infer if this was an auto redeem or not
  entity.status = "Redeemed";
  entity.save();
}

export function handleTicketCreated(event: TicketCreatedEvent): void {
  let entity = new Retryable(ticketIdToEntityId(event.params.ticketId));

  // could query the precompile at `getLifetime()` but we don't need the expensive archive query
  const RETRYABLE_LIFETIME_SECONDS = BigInt.fromI32(604800);
  entity.timeoutTimestamp = event.block.timestamp.plus(
    RETRYABLE_LIFETIME_SECONDS
  );

  // we can calculate the Redemption Txn ahead of time with keccak256(zeroPad(retryable-ticket-id), 0)
  entity.userTx = crypto.keccak256(
    encodePadded(event.params.ticketId as ByteArray, Bytes.fromI32(0))
  ) as Bytes;
  entity.save();
}

import { Retryable } from "../generated/schema";
import {
  Canceled,
  LifetimeExtended,
  RedeemScheduled,
  TicketCreated,
  ArbRetryableTx as ArbRetryableTxContract,
} from "../generated/ArbRetryableTx/ArbRetryableTx";
import { Address, Bytes, log } from "@graphprotocol/graph-ts";
import { RETRYABLE_LIFETIME_SECONDS } from "@arbitrum/subgraph-common/src/helpers";

/**
 * Create retryable entity when ticket is first created
 * @param event
 */
export function handleTicketCreated(event: TicketCreated): void {
  let ticketId = event.params.ticketId;
  let entity = new Retryable(ticketId.toHexString());
  entity.status = "Created";
  entity.timeoutTimestamp = event.block.timestamp.plus(RETRYABLE_LIFETIME_SECONDS);
  entity.createdAtTimestamp = event.block.timestamp;
  entity.createdAtBlockNumber = event.block.number;
  entity.createdAtTxHash = event.transaction.hash;
  entity.save();
}

/**
 * Update retryable's status to canceled
 * @param event
 */
export function handleCanceled(event: Canceled): void {
  let ticketId = event.params.ticketId;
  let entity = Retryable.load(ticketId.toHexString());
  if (!entity) {
    log.critical("Missed a retryable ticket somewhere!", []);
    throw new Error("No retryable ticket");
  }
  entity.status = "Canceled";
  entity.save();
}

/**
 * Extend retryable's timeout
 * @param event
 */
export function handleLifetimeExtended(event: LifetimeExtended): void {
  let ticketId = event.params.ticketId;
  let entity = Retryable.load(ticketId.toHexString());
  if (!entity) {
    log.critical("Missed a retryable ticket somewhere!", []);
    throw new Error("No retryable ticket");
  }
  entity.timeoutTimestamp = entity.timeoutTimestamp.plus(event.params.newTimeout);
  entity.save();
}

/**
 * Deduce if redeem was successful by doing contract call - if redeem was successful call will fail
 * because ticket has been deleted from queue.
 * @param event
 */
export function handleRedeemScheduled(event: RedeemScheduled): void {
  let ticketId = event.params.ticketId;
  let entity = Retryable.load(ticketId.toHexString());
  if (!entity) {
    log.critical("Missed a retryable ticket somewhere!", []);
    throw new Error("No retryable ticket");
  }
  entity.retryTxHash = event.params.retryTxHash;

  const redeemSuccessful = isRedeemSuccessful(ArbRetryableTxContract.bind(event.address), ticketId);
  if (redeemSuccessful) {
    if (entity.status == "Created") {
      entity.isAutoRedeemed = true;
    }
    entity.status = "Redeemed";
    entity.redeemedAtTimestamp = event.block.timestamp;
  } else {
    entity.isAutoRedeemed = false;
    entity.status = "RedeemFailed";
  }

  entity.sequenceNum = event.params.sequenceNum;
  entity.donatedGas = event.params.donatedGas;
  entity.gasDonor = event.params.gasDonor;
  entity.maxRefund = event.params.maxRefund;
  entity.submissionFeeRefund = event.params.submissionFeeRefund;

  entity.save();
}

function isRedeemSuccessful(contract: ArbRetryableTxContract, ticketId: Bytes): boolean {
  const beneficiaryCall = contract.try_getBeneficiary(ticketId);
  return beneficiaryCall.reverted;
}

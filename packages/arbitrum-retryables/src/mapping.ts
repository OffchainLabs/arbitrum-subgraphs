import { Retryable, TotalRetryableStats } from "../generated/schema";
import {
  Canceled,
  LifetimeExtended,
  RedeemScheduled,
  TicketCreated,
  ArbRetryableTx as ArbRetryableTxContract,
} from "../generated/ArbRetryableTx/ArbRetryableTx";
import { BigInt, Bytes, ethereum, log } from "@graphprotocol/graph-ts";
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

  // decode and save retyrable submission param
  decodeRetryableParamsFromTxInput(entity, event.transaction.input);

  const stats = getOrCreateTotalRetryableStats();
  stats.totalCreated = stats.totalCreated.plus(BigInt.fromI32(1));
  stats.save();
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

  const stats = getOrCreateTotalRetryableStats();
  stats.canceled = stats.canceled.plus(BigInt.fromI32(1));
  stats.save();
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

  const stats = getOrCreateTotalRetryableStats();

  const prevStatus = entity.status;
  const redeemSuccessful = isRedeemSuccessful(ArbRetryableTxContract.bind(event.address), ticketId);
  if (redeemSuccessful) {
    if (prevStatus == "Created") {
      entity.isAutoRedeemed = true;
      stats.autoRedeemed = stats.autoRedeemed.plus(BigInt.fromI32(1));
    }
    if (prevStatus == "RedeemFailed") {
      stats.failedToRedeem = stats.failedToRedeem.minus(BigInt.fromI32(1));
    }
    entity.status = "Redeemed";
    entity.redeemedAtTimestamp = event.block.timestamp;
    stats.successfullyRedeemed = stats.successfullyRedeemed.plus(BigInt.fromI32(1));
  } else {
    if (prevStatus != "RedeemFailed") {
      stats.failedToRedeem = stats.failedToRedeem.plus(BigInt.fromI32(1));
    }
    entity.isAutoRedeemed = false;
    entity.status = "RedeemFailed";
  }

  entity.retryTxHash = event.params.retryTxHash;
  entity.sequenceNum = event.params.sequenceNum;
  entity.donatedGas = event.params.donatedGas;
  entity.gasDonor = event.params.gasDonor;
  entity.maxRefund = event.params.maxRefund;
  entity.submissionFeeRefund = event.params.submissionFeeRefund;
  entity.save();
  stats.save();
}

function isRedeemSuccessful(contract: ArbRetryableTxContract, ticketId: Bytes): boolean {
  const beneficiaryCall = contract.try_getBeneficiary(ticketId);
  return beneficiaryCall.reverted;
}

function getOrCreateTotalRetryableStats(): TotalRetryableStats {
  let stats = TotalRetryableStats.load("NitroStats");
  if (stats != null) {
    return stats as TotalRetryableStats;
  }

  stats = new TotalRetryableStats("NitroStats");
  stats.totalCreated = BigInt.fromI32(0);
  stats.autoRedeemed = BigInt.fromI32(0);
  stats.successfullyRedeemed = BigInt.fromI32(0);
  stats.failedToRedeem = BigInt.fromI32(0);
  stats.canceled = BigInt.fromI32(0);
  stats.save();

  return stats;
}

function decodeRetryableParamsFromTxInput(entity: Retryable, calldata: Bytes): void {
  // take out function sig and add tuple offset as prefix
  const noSigCalldataStr = calldata.toHexString().slice(10);
  const prefixNoSigCalldataStr =
    "0x0000000000000000000000000000000000000000000000000000000000000020" + noSigCalldataStr;
  const toDecode = Bytes.fromByteArray(Bytes.fromHexString(prefixNoSigCalldataStr));

  const decoded = ethereum.decode(
    "(bytes32,uint256,uint256,uint256,uint256,uint64,uint256,address,address,address,bytes)",
    toDecode
  );

  if (decoded) {
    const parsedArray = decoded.toTuple();

    entity.requestId = parsedArray[0].toBytes();
    entity.l1BaseFee = parsedArray[1].toBigInt();
    entity.deposit = parsedArray[2].toBigInt();
    entity.callvalue = parsedArray[3].toBigInt();
    entity.gasFeeCap = parsedArray[4].toBigInt();
    entity.gasLimit = parsedArray[5].toBigInt();
    entity.maxSubmissionFee = parsedArray[6].toBigInt();
    entity.feeRefundAddress = parsedArray[7].toAddress().toHexString();
    entity.beneficiary = parsedArray[8].toAddress().toHexString();
    entity.retryTo = parsedArray[9].toAddress().toHexString();
    entity.retryData = parsedArray[10].toBytes();
    entity.save();
  }
}

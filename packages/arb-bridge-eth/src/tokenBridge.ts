import {
  DefaultGatewayUpdated,
  GatewaySet,
  TransferRouted,
  TxToL2,
  WhitelistSourceUpdated,
  Deposit,
  Retryable,
  ClassicRetryable,
} from "../generated/schema";
import { BigInt } from "@graphprotocol/graph-ts";
import {
  DefaultGatewayUpdated as DefaultGatewayUpdatedEvent,
  GatewaySet as GatewaySetEvent,
  InitializeCall,
  TransferRouted as TransferRoutedEvent,
  TxToL2 as TxToL2Event,
  WhitelistSourceUpdated as WhitelistSourceUpdatedEvent,
} from "../generated/L1GatewayRouter/L1GatewayRouter";
import { DepositInitiated } from "../generated/templates/L1ArbitrumGateway/L1ArbitrumGateway";
import { getOrCreateGateway, getOrCreateToken } from "./bridgeUtils";
import { isArbOne } from "./utils";

/**
 * Last token deposit prior to Nitro was in TX 0xbc4324b4fe584f573e82b8b5b458f8303be318bf2bf46b0fc71087146bea4e37.
 * Used to distinguish between classic and nitro token deposits.
 */
const ARB_ONE_BLOCK_OF_LAST_CLASSIC_TOKEN_DEPOSIT = 15446977;

/**
 * Create TokenDeposit entities when deposit is initiated on L1 side.
 * @param event
 */
export function handleDepositInitiated(event: DepositInitiated): void {
  let tokenDepositId =
    event.transaction.hash.toHexString() + "-" + event.transaction.index.toString();

  let tokenDeposit = new Deposit(tokenDepositId);
  tokenDeposit.type = "TokenDeposit";
  tokenDeposit.tokenAmount = event.params._amount;
  tokenDeposit.sender = event.params._from;
  tokenDeposit.receiver = event.params._to;
  tokenDeposit.ethValue = BigInt.fromI32(0);
  tokenDeposit.sequenceNumber = event.params._sequenceNumber;
  tokenDeposit.l1Token = getOrCreateToken(event.params.l1Token, event.block.number).id;

  let firstNitroBlock = 0;
  if (isArbOne()) {
    firstNitroBlock = ARB_ONE_BLOCK_OF_LAST_CLASSIC_TOKEN_DEPOSIT + 1;
  }
  tokenDeposit.isClassic = event.block.number.lt(BigInt.fromI32(firstNitroBlock));
  tokenDeposit.l2TicketId = getRetryablesID(event.params._sequenceNumber, tokenDeposit.isClassic);
  tokenDeposit.timestamp = event.block.timestamp;
  tokenDeposit.transactionHash = event.transaction.hash.toHexString();
  tokenDeposit.blockCreatedAt = event.block.number;
  tokenDeposit.save();
}

/**
 * Keep track of default gateway updates
 * @param event
 */
export function handleDefaultGatewayUpdated(event: DefaultGatewayUpdatedEvent): void {
  let entity = new DefaultGatewayUpdated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  entity.newDefaultGateway = event.params.newDefaultGateway;
  entity.timestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.blockNumber = event.block.number;
  entity.save();

  // create deafult gateway entity and start indexing contract
  getOrCreateGateway(event.params.newDefaultGateway, event.block.number);
}

/**
 * Keep track of token->gateway registrations
 * @param event
 */
export function handleGatewaySet(event: GatewaySetEvent): void {
  let entity = new GatewaySet(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  entity.l1Token = event.params.l1Token;
  entity.gateway = event.params.gateway;
  entity.timestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.blockNumber = event.block.number;
  entity.save();

  // create entities if needed and set gateway ref
  let gateway = getOrCreateGateway(event.params.gateway, event.block.number);
  let token = getOrCreateToken(event.params.l1Token, event.block.number);
  token.gateway = gateway.id;
  token.save();
}

/**
 * Keep track of TransferRouted events
 * @param event
 */
export function handleTransferRouted(event: TransferRoutedEvent): void {
  let entity = new TransferRouted(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  entity.token = event.params.token;
  entity._userFrom = event.params._userFrom;
  entity._userTo = event.params._userTo;
  entity.gateway = event.params.gateway;
  entity.timestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.blockNumber = event.block.number;
  entity.save();
}

/**
 * Keep track of TxToL2 events
 * @param event
 */
export function handleTxToL2(event: TxToL2Event): void {
  let entity = new TxToL2(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  entity._from = event.params._from;
  entity._to = event.params._to;
  entity._seqNum = event.params._seqNum;
  entity._data = event.params._data;
  entity.save();
}

/**
 * Keep track of Whitelist updates
 * @param event
 */
export function handleWhitelistSourceUpdated(event: WhitelistSourceUpdatedEvent): void {
  let entity = new WhitelistSourceUpdated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  entity.newSource = event.params.newSource;
  entity.timestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.blockNumber = event.block.number;
  entity.save();
}

/**
 * Handle one-time call to `initialize` in order to pick up defaultGateway (no event emitted there)
 * @param call
 */
export function handleInitialize(call: InitializeCall): void {
  // create deafult gateway entity and start indexing contract
  getOrCreateGateway(call.inputs._defaultGateway, call.block.number);
}

function getRetryablesID(seqNumber: BigInt, isClassic: boolean): string | null {
  if (isClassic) {
    const ticket = ClassicRetryable.load(seqNumber.toHexString());
    if (ticket) {
      return ticket.retryableTicketID.toHexString();
    }
  } else {
    const ticket = Retryable.load(seqNumber.toHexString());
    if (ticket) {
      return ticket.retryableTicketID.toHexString();
    }
  }

  return null;
}

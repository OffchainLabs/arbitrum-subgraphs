import { GatewaySet as GatewaySetEvent } from "../generated/L2GatewayRouter/L2GatewayRouter";
import { L2ToL1Transaction as L2ToL1TransactionEvent } from "../generated/ArbSys/ArbSys";
import { L2ArbitrumGateway } from "../generated/templates"
import { 
  WithdrawalInitiated as WithdrawalInitiatedEvent,
  DepositFinalized as DepositFinalizedEvent,
} from "../generated/templates/L2ArbitrumGateway/L2ArbitrumGateway"
import { Gateway, L2ToL1Transaction, Token, TokenGatewayJoinTable, Withdrawal } from "../generated/schema";
import { Address, BigInt, log } from "@graphprotocol/graph-ts";

const bigIntToId = (input: BigInt): string => input.toHexString()

export const addressToId = (input: Address): string =>
  input.toHexString().toLowerCase();

export const getJoinId = (gatewayId: string, tokenId: string): string =>
  gatewayId.concat(tokenId)

export function handleGatewaySet(event: GatewaySetEvent): void {
  const gatewayId = addressToId(event.params.gateway);
  const tokenId = addressToId(event.params.l1Token);
  const joinId = getJoinId(gatewayId, tokenId)

  if (event.params.gateway == Address.zero()) {
    // TODO: handle gateways being deleted
    return;
  }
  // TODO: should we always create instead of load? should be faster.
  let gatewayEntity = Gateway.load(gatewayId);
  if(gatewayEntity == null) {
    gatewayEntity = new Gateway(gatewayId);
    gatewayEntity.save();
    // we want to track every new arbitrum gateway
    // so we initialize a Data Source Template
    L2ArbitrumGateway.create(event.params.gateway)
  }

  let tokenEntity = Token.load(tokenId);
  if(tokenEntity == null) {
    tokenEntity = new Token(tokenId);
    // TODO: query gateway for L2 address
    // tokenEntity.l2Address = null;
    tokenEntity.save();
  }

  let joinEntity = new TokenGatewayJoinTable(joinId);
  joinEntity.gateway = gatewayId;
  joinEntity.token = tokenId;
  joinEntity.save();
}

export function handleWithdrawal(event: WithdrawalInitiatedEvent): void {
  const withdrawalId = bigIntToId(event.params._l2ToL1Id)
  const withdrawal = new Withdrawal(withdrawalId)

  withdrawal.l2BlockNum = event.block.number
  withdrawal.from = event.params._from
  withdrawal.to = event.params._to
  withdrawal.amount = event.params._amount
  withdrawal.exitNum = event.params._exitNum

  const gatewayId = addressToId(event.address)
  const tokenId = addressToId(event.params.l1Token)
  withdrawal.exitInfo = getJoinId(gatewayId, tokenId)
  withdrawal.l2ToL1Event = withdrawalId

  withdrawal.save()
}

export function handleDeposit(event: DepositFinalizedEvent): void {
  // TODO: add deposit support
  // TODO: add deposit event handler for template data source that tracks withdrawals

  // Right now this method is mimic'ing the GatewaySet handler to cover for permissionless token bridging
  // currently #Hacky but works. can be cleaned up with a bigger refactor
  // this only tracks deposits from the standard gateway for now
  // this is used since we don't "GatewaySet" for the permissionless bridging

  const stdGatewayAddr = event.transaction.to;

  if(!stdGatewayAddr) {
    // shouldn't happen, but lets make the compiler happy
    return;
  }

  const gatewayId = addressToId(stdGatewayAddr);
  const tokenId = addressToId(event.params.l1Token);
  const joinId = getJoinId(gatewayId, tokenId)

  // TODO: should we always create instead of load? should be faster.
  // the issue here is if creating again on subsequent deposits. would that break FKs? 
  let gatewayEntity = Gateway.load(gatewayId);
  if(gatewayEntity == null) {
    gatewayEntity = new Gateway(gatewayId);
    gatewayEntity.save();
    // we don't start a new data source template, since this is not dynamic
  }

  let tokenEntity = Token.load(tokenId);
  if(tokenEntity == null) {
    tokenEntity = new Token(tokenId);
    // TODO: query gateway for L2 address
    // tokenEntity.l2Address = null;
    tokenEntity.save();
  }

  let joinEntity = new TokenGatewayJoinTable(joinId);
  joinEntity.gateway = gatewayId;
  joinEntity.token = tokenId;
  joinEntity.save();
}

export function handleL2ToL1Transaction(event: L2ToL1TransactionEvent): void {
  // TODO: delete L2 to L1 txs that arent a token withdrawal
  const id = bigIntToId(event.params.uniqueId)
  let entity = new L2ToL1Transaction(id);
  entity.caller = event.params.caller;
  entity.destination = event.params.destination;
  entity.batchNumber = event.params.batchNumber;
  entity.indexInBatch = event.params.indexInBatch;
  entity.arbBlockNum = event.params.arbBlockNum;
  entity.ethBlockNum = event.params.ethBlockNum;
  entity.timestamp = event.params.timestamp;
  entity.callvalue = event.params.callvalue;
  entity.data = event.params.data;
  entity.withdrawal = id

  // TODO: query for L2 to L1 tx proof
  // TODO: don't make this an archive query
  // this will either be the proof or null
  // if not null, backfill previous ones that were null

  entity.save();
}

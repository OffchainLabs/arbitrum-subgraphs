import { GatewaySet as GatewaySetEvent } from "../generated/L2GatewayRouter/L2GatewayRouter";
import { L2ArbitrumGateway } from "../generated/templates"
import { 
  WithdrawalInitiated as WithdrawalInitiatedEvent,
  DepositFinalized as DepositFinalizedEvent,
} from "../generated/templates/L2ArbitrumGateway/L2ArbitrumGateway"
import { Gateway, Token, TokenGatewayJoinTable, Withdrawal } from "../generated/schema";
import { Address, BigInt } from "@graphprotocol/graph-ts";

const bigIntToId = (input: BigInt): string => input.toHexString()

const addressToId = (input: Address): string =>
  input.toHexString().toLowerCase();

const getJoinId = (gatewayId: string, tokenId: string): string =>
  gatewayId.concat(tokenId)

export function handleGatewaySet(event: GatewaySetEvent): void {
  const gatewayId = addressToId(event.params.gateway);
  const tokenId = addressToId(event.params.l1Token);
  const joinId = getJoinId(gatewayId, tokenId)

  if (event.params.gateway == Address.zero()) {
    // TODO: handle gateways being deleted
    return;
  }

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

  withdrawal.save()
}

export function handleDeposit(event: DepositFinalizedEvent): void {
  // TODO: add deposit support
}

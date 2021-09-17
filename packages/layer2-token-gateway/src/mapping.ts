import {
  DefaultGatewayUpdated as DefaultGatewayUpdatedEvent,
  GatewaySet as GatewaySetEvent,
  TransferRouted as TransferRoutedEvent,
  TxToL1 as TxToL1Event,
} from "../generated/L2GatewayRouter/L2GatewayRouter";
import { Gateway, Token, TokenGatewayJoinTable } from "../generated/schema";
import { Address } from "@graphprotocol/graph-ts";

const addressToId = (input: Address): string =>
  input.toHexString().toLowerCase();

export function handleGatewaySet(event: GatewaySetEvent): void {
  const gatewayId = addressToId(event.params.gateway);
  // TODO: right now we create new gateway since its faster than loading
  // if we do stateful stuff here in the future, this needs to instead load
  let gatewayEntity = new Gateway(gatewayId);
  gatewayEntity.save();

  const tokenId = addressToId(event.params.gateway);
  // TODO: same issue as gateway above. should load instead of create new
  let tokenEntity = new Token(tokenId);
  // TODO: query gateway for L2 address
  tokenEntity.l2Address = null;
  tokenEntity.save();

  let joinEntity = new TokenGatewayJoinTable(gatewayId.concat(tokenId));
  joinEntity.gateway = gatewayId;
  joinEntity.token = tokenId;
  joinEntity.save();
}

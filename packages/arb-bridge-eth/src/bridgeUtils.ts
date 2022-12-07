import { Address } from "@graphprotocol/graph-ts";
import { Gateway, Token } from "../generated/schema";
import { L1ArbitrumGateway } from "../generated/templates";

export function getOrCreateGateway(gatewayAddress: Address): Gateway {
  let gateway = Gateway.load(gatewayAddress.toHexString());
  if (gateway != null) {
    return gateway;
  }

  // create new gateway entity
  gateway = new Gateway(gatewayAddress.toHexString());
  gateway.save();

  // start indexing new gateway
  L1ArbitrumGateway.create(gatewayAddress);

  return gateway;
}

export function getOrCreateToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHexString());
  if (token != null) {
    return token;
  }

  // create new Token entity
  token = new Token(tokenAddress.toHexString());
  token.save();

  return token;
}

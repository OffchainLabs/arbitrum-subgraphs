import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Gateway, Token } from "../generated/schema";
import { L1ArbitrumGateway } from "../generated/templates";
import { IERC20 } from "../generated/Bridge/IERC20";

export function getOrCreateGateway(gatewayAddress: Address, blockNumber: BigInt): Gateway {
  let gateway = Gateway.load(gatewayAddress.toHexString());
  if (gateway != null) {
    return gateway;
  }

  // create new gateway entity
  gateway = new Gateway(gatewayAddress.toHexString());
  gateway.registeredAtBlock = blockNumber;
  gateway.save();

  // start indexing new gateway
  L1ArbitrumGateway.create(gatewayAddress);

  return gateway;
}

export function getOrCreateToken(tokenAddress: Address, blockNumber: BigInt): Token {
  let token = Token.load(tokenAddress.toHexString());
  if (token != null) {
    return token;
  }

  // create new Token entity
  token = new Token(tokenAddress.toHexString());

  // fetch data doing one time contract calls
  let tokenInstance = IERC20.bind(tokenAddress);
  let tryName = tokenInstance.try_name();
  if (!tryName.reverted) {
    token.name = tryName.value;
  }
  let trySymbol = tokenInstance.try_symbol();
  if (!trySymbol.reverted) {
    token.symbol = trySymbol.value;
  }
  let tryDecimals = tokenInstance.try_decimals();
  if (!tryDecimals.reverted) {
    token.decimals = tryDecimals.value;
  }

  token.registeredAtBlock = blockNumber;
  token.save();

  return token;
}

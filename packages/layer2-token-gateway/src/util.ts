import { Address, Bytes, ethereum, BigInt } from "@graphprotocol/graph-ts"
import { L2_STD_GATEWAY as _L2_STD_GATEWAY } from "../metadata"

export const isNitro = (block: ethereum.Block): boolean => {

    // return block.stateRoot.notEqual(Bytes.fromHexString("0x0000000000000000000000000000000000000000000000000000000000000000")) || block.number.ge(nitroStartBlock)
  
    // would be better to check the mix digest or extra data, but they arent exposed in the subgraph
    return block.stateRoot.notEqual(Bytes.fromHexString("0x0000000000000000000000000000000000000000000000000000000000000000"))
}

export const addressToId = (input: Address): string =>
  input.toHexString().toLowerCase();

export const getJoinId = (gatewayId: string, tokenId: string): string =>
  gatewayId.concat(tokenId)

  
export const bigIntToId = (input: BigInt): string => input.toHexString()
  
export const DISABLED_GATEWAY_ADDR = Address.fromString("0x0000000000000000000000000000000000000001");

export const L2_STD_GATEWAY: Address = _L2_STD_GATEWAY;

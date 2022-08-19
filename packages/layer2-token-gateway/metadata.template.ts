import { Address } from "@graphprotocol/graph-ts";

// export const nitroStartBlock = BigInt.fromString("{{{ nitroGenesisBlockNum }}}")

// we use moustache to template these values in (as used in the subgraph manifest template)
export const L2_STD_GATEWAY = Address.fromString("{{{ l2StandardGateway }}}".toLowerCase())

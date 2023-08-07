import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  Burn,
} from "../generated/L2FiatToken/L2FiatToken"

export function createBurnEvent(burner: Address, amount: BigInt): Burn {
  let burnEvent = changetype<Burn>(newMockEvent())

  burnEvent.parameters = new Array()

  burnEvent.parameters.push(
    new ethereum.EventParam("burner", ethereum.Value.fromAddress(burner))
  )
  burnEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return burnEvent
}

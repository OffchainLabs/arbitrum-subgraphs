import { Teleported as TeleportedEvent } from "../generated/L1Teleporter/L1Teleporter";

import { Teleported } from "../generated/schema";

export function handleTeleported(event: TeleportedEvent): void {
  let entity = new Teleported(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.transactionHash = event.transaction.hash
  entity.sender = event.params.sender
  entity.l1Token = event.params.l1Token
  entity.l3FeeTokenL1Addr = event.params.l3FeeTokenL1Addr
  entity.l1l2Router = event.params.l1l2Router
  entity.l2l3RouterOrInbox = event.params.l2l3RouterOrInbox
  entity.to = event.params.to
  entity.amount = event.params.amount
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.save()
}

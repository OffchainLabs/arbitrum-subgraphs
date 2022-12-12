import {
  DefaultGatewayUpdated as DefaultGatewayUpdatedEvent,
  GatewaySet as GatewaySetEvent,
  TransferRouted as TransferRoutedEvent,
  TxToL2 as TxToL2Event,
  WhitelistSourceUpdated as WhitelistSourceUpdatedEvent
} from "../generated/L1GatewayRouter/L1GatewayRouter"
import {
  DefaultGatewayUpdated,
  GatewaySet,
  TransferRouted,
  TxToL2,
  WhitelistSourceUpdated
} from "../generated/schema"

export function handleDefaultGatewayUpdated(
  event: DefaultGatewayUpdatedEvent
): void {
  let entity = new DefaultGatewayUpdated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.newDefaultGateway = event.params.newDefaultGateway
  entity.save()
}

export function handleGatewaySet(event: GatewaySetEvent): void {
  let entity = new GatewaySet(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.l1Token = event.params.l1Token
  entity.gateway = event.params.gateway
  entity.blockNumber = event.block
  entity.save()
}

export function handleTransferRouted(event: TransferRoutedEvent): void {
  let entity = new TransferRouted(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.token = event.params.token
  entity._userFrom = event.params._userFrom
  entity._userTo = event.params._userTo
  entity.gateway = event.params.gateway
  entity.save()
}

export function handleTxToL2(event: TxToL2Event): void {
  let entity = new TxToL2(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity._from = event.params._from
  entity._to = event.params._to
  entity._seqNum = event.params._seqNum
  entity._data = event.params._data
  entity.save()
}

export function handleWhitelistSourceUpdated(
  event: WhitelistSourceUpdatedEvent
): void {
  let entity = new WhitelistSourceUpdated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.newSource = event.params.newSource
  entity.save()
}

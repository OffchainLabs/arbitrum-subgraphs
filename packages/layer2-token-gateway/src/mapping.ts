import {
  DefaultGatewayUpdated as DefaultGatewayUpdatedEvent,
  GatewaySet as GatewaySetEvent,
  TransferRouted as TransferRoutedEvent,
  TxToL1 as TxToL1Event
} from "../generated/L2GatewayRouter/L2GatewayRouter"
import {
  DefaultGatewayUpdated,
  GatewaySet,
  TransferRouted,
  TxToL1
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

export function handleTxToL1(event: TxToL1Event): void {
  let entity = new TxToL1(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity._from = event.params._from
  entity._to = event.params._to
  entity._id = event.params._id
  entity._data = event.params._data
  entity.save()
}

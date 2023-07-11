import { Address, Bytes, crypto } from "@graphprotocol/graph-ts"
import {
  MessageReceived as MessageReceivedEvent,
  MessageSent as MessageSentEvent,
} from "../generated/L2USDCMessageTransmitter/L2USDCMessageTransmitter"
import {
  MessageReceived,
  MessageSent,
} from "../generated/schema"

export function handleMessageReceived(event: MessageReceivedEvent): void {
  let entity = new MessageReceived(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.caller = event.params.caller
  entity.sourceDomain = event.params.sourceDomain
  entity.nonce = event.params.nonce
  entity.sender = event.params.sender
  entity.messageBody = event.params.messageBody

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleMessageSent(event: MessageSentEvent): void {
  let entity = new MessageSent(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.message = event.params.message

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  
  entity.sender = event.transaction.from.toHexString()

  entity.attestationHash = crypto.keccak256(event.params.message).toHexString()

  entity.save()
}

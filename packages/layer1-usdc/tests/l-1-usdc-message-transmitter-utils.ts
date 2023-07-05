import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  AttesterDisabled,
  AttesterEnabled,
  AttesterManagerUpdated,
  MaxMessageBodySizeUpdated,
  MessageReceived,
  MessageSent,
  OwnershipTransferStarted,
  OwnershipTransferred,
  Pause,
  PauserChanged,
  RescuerChanged,
  SignatureThresholdUpdated,
  Unpause
} from "../generated/L1USDCMessageTransmitter/L1USDCMessageTransmitter"

export function createAttesterDisabledEvent(
  attester: Address
): AttesterDisabled {
  let attesterDisabledEvent = changetype<AttesterDisabled>(newMockEvent())

  attesterDisabledEvent.parameters = new Array()

  attesterDisabledEvent.parameters.push(
    new ethereum.EventParam("attester", ethereum.Value.fromAddress(attester))
  )

  return attesterDisabledEvent
}

export function createAttesterEnabledEvent(attester: Address): AttesterEnabled {
  let attesterEnabledEvent = changetype<AttesterEnabled>(newMockEvent())

  attesterEnabledEvent.parameters = new Array()

  attesterEnabledEvent.parameters.push(
    new ethereum.EventParam("attester", ethereum.Value.fromAddress(attester))
  )

  return attesterEnabledEvent
}

export function createAttesterManagerUpdatedEvent(
  previousAttesterManager: Address,
  newAttesterManager: Address
): AttesterManagerUpdated {
  let attesterManagerUpdatedEvent = changetype<AttesterManagerUpdated>(
    newMockEvent()
  )

  attesterManagerUpdatedEvent.parameters = new Array()

  attesterManagerUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "previousAttesterManager",
      ethereum.Value.fromAddress(previousAttesterManager)
    )
  )
  attesterManagerUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newAttesterManager",
      ethereum.Value.fromAddress(newAttesterManager)
    )
  )

  return attesterManagerUpdatedEvent
}

export function createMaxMessageBodySizeUpdatedEvent(
  newMaxMessageBodySize: BigInt
): MaxMessageBodySizeUpdated {
  let maxMessageBodySizeUpdatedEvent = changetype<MaxMessageBodySizeUpdated>(
    newMockEvent()
  )

  maxMessageBodySizeUpdatedEvent.parameters = new Array()

  maxMessageBodySizeUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newMaxMessageBodySize",
      ethereum.Value.fromUnsignedBigInt(newMaxMessageBodySize)
    )
  )

  return maxMessageBodySizeUpdatedEvent
}

export function createMessageReceivedEvent(
  caller: Address,
  sourceDomain: BigInt,
  nonce: BigInt,
  sender: Bytes,
  messageBody: Bytes
): MessageReceived {
  let messageReceivedEvent = changetype<MessageReceived>(newMockEvent())

  messageReceivedEvent.parameters = new Array()

  messageReceivedEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  )
  messageReceivedEvent.parameters.push(
    new ethereum.EventParam(
      "sourceDomain",
      ethereum.Value.fromUnsignedBigInt(sourceDomain)
    )
  )
  messageReceivedEvent.parameters.push(
    new ethereum.EventParam("nonce", ethereum.Value.fromUnsignedBigInt(nonce))
  )
  messageReceivedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromFixedBytes(sender))
  )
  messageReceivedEvent.parameters.push(
    new ethereum.EventParam(
      "messageBody",
      ethereum.Value.fromBytes(messageBody)
    )
  )

  return messageReceivedEvent
}

export function createMessageSentEvent(message: Bytes): MessageSent {
  let messageSentEvent = changetype<MessageSent>(newMockEvent())

  messageSentEvent.parameters = new Array()

  messageSentEvent.parameters.push(
    new ethereum.EventParam("message", ethereum.Value.fromBytes(message))
  )

  return messageSentEvent
}

export function createOwnershipTransferStartedEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferStarted {
  let ownershipTransferStartedEvent = changetype<OwnershipTransferStarted>(
    newMockEvent()
  )

  ownershipTransferStartedEvent.parameters = new Array()

  ownershipTransferStartedEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferStartedEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferStartedEvent
}

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent = changetype<OwnershipTransferred>(
    newMockEvent()
  )

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}

export function createPauseEvent(): Pause {
  let pauseEvent = changetype<Pause>(newMockEvent())

  pauseEvent.parameters = new Array()

  return pauseEvent
}

export function createPauserChangedEvent(newAddress: Address): PauserChanged {
  let pauserChangedEvent = changetype<PauserChanged>(newMockEvent())

  pauserChangedEvent.parameters = new Array()

  pauserChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newAddress",
      ethereum.Value.fromAddress(newAddress)
    )
  )

  return pauserChangedEvent
}

export function createRescuerChangedEvent(newRescuer: Address): RescuerChanged {
  let rescuerChangedEvent = changetype<RescuerChanged>(newMockEvent())

  rescuerChangedEvent.parameters = new Array()

  rescuerChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newRescuer",
      ethereum.Value.fromAddress(newRescuer)
    )
  )

  return rescuerChangedEvent
}

export function createSignatureThresholdUpdatedEvent(
  oldSignatureThreshold: BigInt,
  newSignatureThreshold: BigInt
): SignatureThresholdUpdated {
  let signatureThresholdUpdatedEvent = changetype<SignatureThresholdUpdated>(
    newMockEvent()
  )

  signatureThresholdUpdatedEvent.parameters = new Array()

  signatureThresholdUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "oldSignatureThreshold",
      ethereum.Value.fromUnsignedBigInt(oldSignatureThreshold)
    )
  )
  signatureThresholdUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newSignatureThreshold",
      ethereum.Value.fromUnsignedBigInt(newSignatureThreshold)
    )
  )

  return signatureThresholdUpdatedEvent
}

export function createUnpauseEvent(): Unpause {
  let unpauseEvent = changetype<Unpause>(newMockEvent())

  unpauseEvent.parameters = new Array()

  return unpauseEvent
}

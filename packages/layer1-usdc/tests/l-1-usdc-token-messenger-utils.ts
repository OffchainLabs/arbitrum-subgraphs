import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address, Bytes } from "@graphprotocol/graph-ts"
import {
  DepositForBurn,
  LocalMinterAdded,
  LocalMinterRemoved,
  MintAndWithdraw,
  OwnershipTransferStarted,
  OwnershipTransferred,
  RemoteTokenMessengerAdded,
  RemoteTokenMessengerRemoved,
  RescuerChanged
} from "../generated/L1USDCTokenMessenger/L1USDCTokenMessenger"

export function createDepositForBurnEvent(
  nonce: BigInt,
  burnToken: Address,
  amount: BigInt,
  depositor: Address,
  mintRecipient: Bytes,
  destinationDomain: BigInt,
  destinationTokenMessenger: Bytes,
  destinationCaller: Bytes
): DepositForBurn {
  let depositForBurnEvent = changetype<DepositForBurn>(newMockEvent())

  depositForBurnEvent.parameters = new Array()

  depositForBurnEvent.parameters.push(
    new ethereum.EventParam("nonce", ethereum.Value.fromUnsignedBigInt(nonce))
  )
  depositForBurnEvent.parameters.push(
    new ethereum.EventParam("burnToken", ethereum.Value.fromAddress(burnToken))
  )
  depositForBurnEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  depositForBurnEvent.parameters.push(
    new ethereum.EventParam("depositor", ethereum.Value.fromAddress(depositor))
  )
  depositForBurnEvent.parameters.push(
    new ethereum.EventParam(
      "mintRecipient",
      ethereum.Value.fromFixedBytes(mintRecipient)
    )
  )
  depositForBurnEvent.parameters.push(
    new ethereum.EventParam(
      "destinationDomain",
      ethereum.Value.fromUnsignedBigInt(destinationDomain)
    )
  )
  depositForBurnEvent.parameters.push(
    new ethereum.EventParam(
      "destinationTokenMessenger",
      ethereum.Value.fromFixedBytes(destinationTokenMessenger)
    )
  )
  depositForBurnEvent.parameters.push(
    new ethereum.EventParam(
      "destinationCaller",
      ethereum.Value.fromFixedBytes(destinationCaller)
    )
  )

  return depositForBurnEvent
}

export function createLocalMinterAddedEvent(
  localMinter: Address
): LocalMinterAdded {
  let localMinterAddedEvent = changetype<LocalMinterAdded>(newMockEvent())

  localMinterAddedEvent.parameters = new Array()

  localMinterAddedEvent.parameters.push(
    new ethereum.EventParam(
      "localMinter",
      ethereum.Value.fromAddress(localMinter)
    )
  )

  return localMinterAddedEvent
}

export function createLocalMinterRemovedEvent(
  localMinter: Address
): LocalMinterRemoved {
  let localMinterRemovedEvent = changetype<LocalMinterRemoved>(newMockEvent())

  localMinterRemovedEvent.parameters = new Array()

  localMinterRemovedEvent.parameters.push(
    new ethereum.EventParam(
      "localMinter",
      ethereum.Value.fromAddress(localMinter)
    )
  )

  return localMinterRemovedEvent
}

export function createMintAndWithdrawEvent(
  mintRecipient: Address,
  amount: BigInt,
  mintToken: Address
): MintAndWithdraw {
  let mintAndWithdrawEvent = changetype<MintAndWithdraw>(newMockEvent())

  mintAndWithdrawEvent.parameters = new Array()

  mintAndWithdrawEvent.parameters.push(
    new ethereum.EventParam(
      "mintRecipient",
      ethereum.Value.fromAddress(mintRecipient)
    )
  )
  mintAndWithdrawEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  mintAndWithdrawEvent.parameters.push(
    new ethereum.EventParam("mintToken", ethereum.Value.fromAddress(mintToken))
  )

  return mintAndWithdrawEvent
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

export function createRemoteTokenMessengerAddedEvent(
  domain: BigInt,
  tokenMessenger: Bytes
): RemoteTokenMessengerAdded {
  let remoteTokenMessengerAddedEvent = changetype<RemoteTokenMessengerAdded>(
    newMockEvent()
  )

  remoteTokenMessengerAddedEvent.parameters = new Array()

  remoteTokenMessengerAddedEvent.parameters.push(
    new ethereum.EventParam("domain", ethereum.Value.fromUnsignedBigInt(domain))
  )
  remoteTokenMessengerAddedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenMessenger",
      ethereum.Value.fromFixedBytes(tokenMessenger)
    )
  )

  return remoteTokenMessengerAddedEvent
}

export function createRemoteTokenMessengerRemovedEvent(
  domain: BigInt,
  tokenMessenger: Bytes
): RemoteTokenMessengerRemoved {
  let remoteTokenMessengerRemovedEvent = changetype<
    RemoteTokenMessengerRemoved
  >(newMockEvent())

  remoteTokenMessengerRemovedEvent.parameters = new Array()

  remoteTokenMessengerRemovedEvent.parameters.push(
    new ethereum.EventParam("domain", ethereum.Value.fromUnsignedBigInt(domain))
  )
  remoteTokenMessengerRemovedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenMessenger",
      ethereum.Value.fromFixedBytes(tokenMessenger)
    )
  )

  return remoteTokenMessengerRemovedEvent
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

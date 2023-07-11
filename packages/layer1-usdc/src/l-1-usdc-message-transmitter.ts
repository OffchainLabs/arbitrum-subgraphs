import { Address, BigInt, Bytes, crypto, ethereum, log } from "@graphprotocol/graph-ts";
import {
  MessageReceived as MessageReceivedEvent,
  MessageSent as MessageSentEvent,
} from "../generated/L1USDCMessageTransmitter/L1USDCMessageTransmitter";
import { MessageReceived, MessageSent } from "../generated/schema";

export function handleMessageReceived(event: MessageReceivedEvent): void {
  let entity = new MessageReceived(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.caller = event.params.caller;
  entity.sourceDomain = event.params.sourceDomain;
  entity.nonce = event.params.nonce;
  entity.sender = event.params.sender;
  entity.messageBody = event.params.messageBody;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  // Only index messages from Arbitrum
  if (event.params.sourceDomain.at(3) === 3) {
    entity.save()
  }
}

export function handleMessageSent(event: MessageSentEvent): void {
  let entity = new MessageSent(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.message = event.params.message;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  // TODO: use decode
  const sender = event.params.message.subarray(20, 52);
  const destination = event.params.message.subarray(8, 12).at(3);
  entity.sender = event.transaction.from.toHexString()

  log.warning(`sending to ${destination}`, [])
  entity.attestationHash = crypto.keccak256(event.params.message).toHexString()

  // Only index messages to Arbitrum
  if (destination === 3) {
    entity.save()
  }
}

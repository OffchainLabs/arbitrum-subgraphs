import { BigInt, Bytes, crypto, ethereum } from "@graphprotocol/graph-ts";
import {
  MessageReceived as MessageReceivedEvent,
  MessageSent as MessageSentEvent,
} from "../generated/L1USDCMessageTransmitter/L1USDCMessageTransmitter";
import { MessageReceived, MessageSent } from "../generated/schema";
import { log } from "matchstick-as";

function leftPadBytes(data: Bytes, length: number): Bytes {
  const completeData = new Bytes(length as i32);
  const zeroBytesToFillPrefix = completeData.length - data.length;
  for (let i = 0; i < completeData.length; i++) {
    if (i < zeroBytesToFillPrefix) {
      completeData[i] = 0;
    } else {
      completeData[i] = data[i - zeroBytesToFillPrefix];
    }
  }
  return completeData
}

export function handleMessageReceived(event: MessageReceivedEvent): void {
  let entity = new MessageReceived(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
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
  if (event.params.sourceDomain.equals(BigInt.fromI32(3))) {
    entity.save();
  }
}

export function handleMessageSent(event: MessageSentEvent): void {
  let entity = new MessageSent(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.message = event.params.message;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.sender = event.transaction.from.toHexString();
  entity.attestationHash = crypto.keccak256(event.params.message).toHexString();

  const message = event.params.message
  const destinationDomainSlice = message.slice(8, 12)
  const destinationDomainPadded = leftPadBytes(Bytes.fromHexString(destinationDomainSlice.join('')), 32) // 32 bytes = 256 characters
  const decodedData = ethereum.decode("(uint256)", destinationDomainPadded)

  if (!decodedData) {
    return;
  }
  const tuple = decodedData.toTuple()
  const destinationDomain = tuple[0].toBigInt()

  if (destinationDomain.equals(BigInt.fromI32(3))) {
    entity.save()
  }
}

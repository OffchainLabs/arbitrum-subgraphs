import {
  Address,
  BigInt,
  Bytes,
  crypto,
  ethereum,
} from "@graphprotocol/graph-ts";
import {
  MessageReceived as MessageReceivedEvent,
  MessageSent as MessageSentEvent,
} from "../generated/L2USDCMessageTransmitter/L2USDCMessageTransmitter";
import { MessageReceived, MessageSent } from "../generated/schema";

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
  return completeData;
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

  entity.save();
}

export function handleMessageSent(event: MessageSentEvent): void {
  // message is encoded with encodePacked, we need to pad non-bytes parameter (uint32, uint64) to 32 bytes (= 256 bits)
  const message = event.params.message;
  const versionSlice = message.slice(0, 4);
  const sourceDomainSlice = message.slice(4, 8);
  const destinationDomainSlice = message.slice(8, 12);
  const nonceSlice = message.subarray(12, 20);

  const versionPadded = leftPadBytes(Bytes.fromUint8Array(versionSlice), 32);
  const sourceDomainPadded = leftPadBytes(
    Bytes.fromUint8Array(sourceDomainSlice),
    32,
  );
  const destinationDomainPadded = leftPadBytes(
    Bytes.fromUint8Array(destinationDomainSlice),
    32,
  );
  const noncePadded = leftPadBytes(Bytes.fromUint8Array(nonceSlice), 32);
  const messagePadded = versionPadded
    .concat(sourceDomainPadded)
    .concat(destinationDomainPadded)
    .concat(noncePadded)
    .concat(Bytes.fromUint8Array(message.slice(20)));

  // version, sourceDomain, destinationDomain, nonce, sender, recipient, destinationCaller, messageBody
  // see https://developers.circle.com/stablecoin/docs/cctp-technical-reference#message
  const decodedData = ethereum.decode(
    "(uint32,uint32,uint32,uint64,bytes32,bytes32,bytes32)",
    messagePadded,
  );

  if (!decodedData) {
    return;
  }

  const decodedDataTuple = decodedData.toTuple();

  const sourceDomain = decodedDataTuple[1].toBigInt();
  const nonce = decodedDataTuple[3].toBigInt();

  let entity = new MessageSent(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.message = event.params.message;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.sender = Address.fromBytes(event.transaction.from);
  entity.attestationHash = Bytes.fromByteArray(
    crypto.keccak256(event.params.message),
  );
  entity.sourceDomain = sourceDomain;
  entity.nonce = nonce;

  entity.save();
}

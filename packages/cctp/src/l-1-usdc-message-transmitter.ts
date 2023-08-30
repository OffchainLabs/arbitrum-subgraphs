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
} from "../generated/L1USDCMessageTransmitter/L1USDCMessageTransmitter";
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

function getIdFromMessage(sourceDomain: BigInt, noncePadded: Bytes): Bytes {
  return Bytes.fromHexString(
    `0${sourceDomain.toString()}${noncePadded.toHexString()}`,
  );
}

export function handleMessageReceived(event: MessageReceivedEvent): void {
  const nonce = event.params.nonce;
  const sourceDomain = event.params.sourceDomain;

  const noncePadded = leftPadBytes(
    Bytes.fromHexString("0x".concat(nonce.toHex().slice(2).padStart(8, "0"))),
    32,
  );
  const id = getIdFromMessage(sourceDomain, noncePadded);
 
  let entity = new MessageReceived(id);
  // Addresses are stored in 32 bytes, we need to remove the first 8 bytes of 0 before using `Address.fromBytes`
  // see https://developers.circle.com/stablecoin/docs/cctp-technical-reference#message
  const parsedSender = event.params.sender.slice(12);

  entity.caller = event.params.caller;
  entity.sourceDomain = event.params.sourceDomain;
  entity.nonce = event.params.nonce;
  entity.sender = Address.fromUint8Array(parsedSender);
  entity.messageBody = event.params.messageBody;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  // Only index messages from Arbitrum
  if (event.params.sourceDomain.equals(BigInt.fromI32(3))) {
    entity.save();
  }
}

function getAddressFromBytes32(bytes: Bytes): Bytes {
  assert(bytes.length === 32, `getAddressFromBytes32: Address bytes length is incorrect (${bytes.length})`);
  const slicedBytes = bytes.slice(12)
  return Address.fromUint8Array(slicedBytes);
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
    .concat(Bytes.fromUint8Array(message.slice(24))); 

  // see https://developers.circle.com/stablecoin/docs/cctp-technical-reference#message
  const decodedMessageData = ethereum.decode(
    // (version, sourceDomain, destinationDomain, nonce, sender, recipient, destinationcaller, messageBody)
    "(uint32,uint32,uint32,uint64,bytes32,bytes32,bytes32,bytes128)",
    messagePadded,
  );

  if (!decodedMessageData) {
    return;
  }

  const decodedMessageDataTuple = decodedMessageData.toTuple();
  const destinationDomain = decodedMessageDataTuple[2].toBigInt();
  const sourceDomain = decodedMessageDataTuple[1].toBigInt();
  const nonce = decodedMessageDataTuple[3].toBigInt();
  const messageBody = decodedMessageDataTuple[7].toBytes();

  if (destinationDomain.notEqual(BigInt.fromI32(3))) {
    return;
  }

  const decodedMessageBodyData = ethereum.decode(
    // (usdcContract, recipient, amount, sender)
    "(bytes32,bytes32,uint64,bytes32)",
    messageBody,
  );

  if (!decodedMessageBodyData) {
    return;
  }

  const id = getIdFromMessage(sourceDomain, noncePadded)
  const entityFromStore = MessageSent.load(id);

  // Multiple MessageSent might have the same id when replaced with `replaceMessage`
  // We're only interested in the most recent one
  // Events might not arrive in order, we need to compare timestamp to get the most recent one
  if (entityFromStore) {
    // If the new MessageSent is more recent, override the one in store
    // If the MessageEvent in the store is the most recent, skip
    if (entityFromStore.blockTimestamp.gt(event.block.timestamp)) {
      return;
    }
  }
  
  const decodedMessageBodyDataTuple = decodedMessageBodyData.toTuple();
  const recipient = decodedMessageBodyDataTuple[1].toBytes();
  const amount = decodedMessageBodyDataTuple[2].toBigInt();

  const entity = new MessageSent(id);
  entity.message = event.params.message;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.sender = Address.fromBytes(event.transaction.from);
  entity.recipient = getAddressFromBytes32(recipient);
  entity.attestationHash = Bytes.fromByteArray(
    crypto.keccak256(event.params.message),
  );
  entity.sourceDomain = sourceDomain;
  entity.nonce = nonce;
  entity.amount = amount;
  entity.save();
}

import { Bytes, ethereum, log } from "@graphprotocol/graph-ts";
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

  entity.save();
}

export function handleMessageSent(event: MessageSentEvent): void {
  let entity = new MessageSent(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.message = event.params.message;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  //   const decodedData = ethereum.decode(
  //     "(uint32,uint32,uint32,uint64,bytes32,bytes32,bytes32,bytes)",
  //     Bytes.fromByteArray(event.params.message)
  //   );

  //   if (decodedData) {
  //     const parsedArray = decodedData.toTuple();

  //     log.info("version", parsedArray[0].toStringArray());
  //     log.info("sourceDomain", [parsedArray[1].toBigInt().toString()]);
  //     log.info("destinationDomain", [parsedArray[2].toBigInt().toString()]);
  //     log.info("nonce", parsedArray[3].toStringArray());
  //     log.info("sender", [parsedArray[4].toAddress().toHexString()]);
  //     log.info("recipient", [parsedArray[5].toAddress().toHexString()]);
  //     log.info("destinationCaller", [parsedArray[6].toAddress().toHexString()]);
  //     log.info("messageBody", [parsedArray[7].toBytes().toHexString()]);

  //     entity.sender = parsedArray[4].toAddress();
  //     entity.save();
  //   } else {
  //     log.debug("No decoded data", []);
  //   }
  const decodedData = ethereum.decode(
    "MessageSent(bytes)",
    event.params.message
  );
  log.info("MESSAGE TO STRING", [event.params.message.toHexString()]);

  log.info("DECODED DATA", [
    ethereum.decode("MessageSent(bytes)", event.params.message),
  ]);

  entity.save();
}

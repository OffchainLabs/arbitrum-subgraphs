import { newMockEvent } from "matchstick-as";
import { ethereum, Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  MessageReceived,
  MessageSent,
} from "../generated/USDCMessageTransmitter/USDCMessageTransmitter";

export function createMessageReceivedEvent(
  caller: Address,
  sourceDomain: BigInt,
  nonce: BigInt,
  sender: Bytes,
  messageBody: Bytes
): MessageReceived {
  let messageReceivedEvent = changetype<MessageReceived>(newMockEvent());

  messageReceivedEvent.parameters = new Array();

  messageReceivedEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  );
  messageReceivedEvent.parameters.push(
    new ethereum.EventParam(
      "sourceDomain",
      ethereum.Value.fromUnsignedBigInt(sourceDomain)
    )
  );
  messageReceivedEvent.parameters.push(
    new ethereum.EventParam("nonce", ethereum.Value.fromUnsignedBigInt(nonce))
  );
  messageReceivedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromFixedBytes(sender))
  );
  messageReceivedEvent.parameters.push(
    new ethereum.EventParam(
      "messageBody",
      ethereum.Value.fromBytes(messageBody)
    )
  );

  return messageReceivedEvent;
}

export function createMessageSentEvent(message: Bytes): MessageSent {
  let messageSentEvent = changetype<MessageSent>(newMockEvent());

  messageSentEvent.parameters = new Array();

  messageSentEvent.parameters.push(
    new ethereum.EventParam("message", ethereum.Value.fromBytes(message))
  );

  return messageSentEvent;
}

import { assert, describe, test, clearStore, afterAll, log } from "matchstick-as";
import { Address, BigInt, Bytes, store } from "@graphprotocol/graph-ts";
import {
  handleBurn,
  handleMessageReceived,
  handleMessageSent,
} from "../src/l-1-usdc-message-transmitter";
import {
  createMessageReceivedEvent,
  createMessageSentEvent,
} from "./l-1-usdc-message-transmitter-utils";
import { createBurnEvent } from "./l-1-fiat-token-utils";

describe("Message events", () => {
  afterAll(() => { 
    clearStore()
  })

  describe("MessageReceived", () => {
    test("MessageReceived created and stored", () => {
      const caller = Address.fromString(
        "0x0000000000000000000000000000000000000001",
      );
      const sender = Bytes.fromHexString(
        "0x0004000400030004000500060007000800090001000200030000000000000002",
      );
      const newMessageReceivedFromArb = createMessageReceivedEvent(
        caller,
        BigInt.fromI32(3),
        BigInt.fromI32(10),
        sender,
        Bytes.fromHexString(
          "0x000000000000000000000000000000000000000000000000000000000000000300000006000000000000000A00000000eb08f243e5d3fcff26a9e38ae5520a669f4019d000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000084000000000000000000000000000000005425890298aed601595a70ab815c96711a31bc6500000000000000000000000020799b34e4382ad646bc873c7d96d02ac2f9c202000000000000000000000000000000000000000000000000000000003b8b87c0000000000000000000000000a61ec254ef8f5245375870ef4f3990d94a35190900000000000000000000000000000000000000000000000000000000",
        ),
      );
      const newMessageReceivedFromAvalanche = createMessageReceivedEvent(
        caller,
        BigInt.fromI32(1),
        BigInt.fromI64(737343059199),
        sender,
        Bytes.fromHexString(
          "000000000000000000000000000000000000000000000000000000000000000100000006000000ABAD1234FF00000000eb08f243e5d3fcff26a9e38ae5520a669f4019d000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000084000000000000000000000000000000005425890298aed601595a70ab815c96711a31bc6500000000000000000000000020799b34e4382ad646bc873c7d96d02ac2f9c202000000000000000000000000000000000000000000000000000000003b8b87c0000000000000000000000000a61ec254ef8f5245375870ef4f3990d94a35190900000000000000000000000000000000000000000000000000000000",
        ),
      );

      handleMessageReceived(newMessageReceivedFromArb);
      handleMessageReceived(newMessageReceivedFromAvalanche);

      // MessageReceived from Avalanche is ignored
      assert.entityCount("MessageReceived", 1);
      assert.fieldEquals(
        "MessageReceived",
        "0x0300000000000000000000000000000000000000000000000000000000000000000a",
        "sourceDomain",
        "3",
      );
      assert.fieldEquals(
        "MessageReceived",
        "0x0300000000000000000000000000000000000000000000000000000000000000000a",
        "caller",
        caller.toHexString(),
      );
      assert.fieldEquals(
        "MessageReceived",
        "0x0300000000000000000000000000000000000000000000000000000000000000000a",
        "sender",
        "0x0007000800090001000200030000000000000002",
      );
    });
  });

  describe("MessageSent", () => {
    test("MessageSent created and stored", () => {
      const newMessageSentToArb = createMessageSentEvent(
        Bytes.fromHexString(
          "000000000000000600000003000000000003902D000000000000000000000000D0C3DA58F55358142B8D3E06C1C30C5C6114EFE8000000000000000000000000EB08F243E5D3FCFF26A9E38AE5520A669F4019D000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007865C6E87B9F70255377E024ACE6630C1EAA37F000000000000000000000000B28CB81B1C50539AE1E941573EBA241E47F6DE5A00000000000000000000000000000000000000000000000000000000000F42400000000000000000000000003A554156AEA1921ABB277F63D6109CA81B530A3E",
        ),
      );
      const newMessageSentToAvalanche = createMessageSentEvent(
        Bytes.fromHexString(
          "000000000000000000000001000000000003902D000000000000000000000000D0C3DA58F55358142B8D3E06C1C30C5C6114EFE8000000000000000000000000EB08F243E5D3FCFF26A9E38AE5520A669F4019D000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007865C6E87B9F70255377E024ACE6630C1EAA37F000000000000000000000000B28CB81B1C50539AE1E941573EBA241E47F6DE5A00000000000000000000000000000000000000000000000000000000000F42400000000000000000000000003A554156AEA1921ABB277F63D6109CA81B530A3E",
        ),
      );
      const transactionHash = Bytes.fromHexString('65ade9a093d7d6149ef89187dc51cf22a18b45b3a80e9eb4899867f7bc5d9ffe'); 
        
      const owner = Address.fromString("0x0000000000000000000000000000000000000001");
      const amount = BigInt.fromI32(234);
      const newBurnEvent = createBurnEvent(owner, amount);

      newMessageSentToArb.transaction.hash = transactionHash;
      newBurnEvent.transaction.hash = transactionHash;
      handleBurn(newBurnEvent)

      // MessageSent from Avalanche is ignored
      handleMessageSent(newMessageSentToArb);
      handleMessageSent(newMessageSentToAvalanche);

      assert.entityCount("MessageSent", 1);
      assert.fieldEquals(
        "MessageSent",
        "0x0600000000000000000000000000000000000000000000000000000000000003902d",
        "sender",
        "0xa16081f360e3847006db660bae1c6d1b2e17ec2a",
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0600000000000000000000000000000000000000000000000000000000000003902d",
        "nonce",
        "233517", // 3902D
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0600000000000000000000000000000000000000000000000000000000000003902d",
        "sourceDomain",
        "6", // It should be 0, but testing for 0 would always return true if we have wrong decoding
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0600000000000000000000000000000000000000000000000000000000000003902d",
        "message",
        newMessageSentToArb.params.message.toHexString(),
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0600000000000000000000000000000000000000000000000000000000000003902d",
        "recipient",
        "0xeb08f243e5d3fcff26a9e38ae5520a669f4019d0",
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0600000000000000000000000000000000000000000000000000000000000003902d",
        "amount",
        amount.toString()
      );
    });

    test("Older MessageSent event with same (nonce, sourceDomain) is skipped", () => {
      const newMessageSentToArb = createMessageSentEvent(
        Bytes.fromHexString(
          "000000000000000600000003000000000003902D000000000000000000000000D0C3DA58F55358142B8D3E06C1C30C5C6114EFE8000000000000000000000000EB08F243E5D3FCFF26A9E38AE5520A669F4019D000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007865C6E87B9F70255377E024ACE6630C1EAA37F000000000000000000000000B28CB81B1C50539AE1E941573EBA241E47F6DE5A00000000000000000000000000000000000000000000000000000000000F42400000000000000000000000003A554156AEA1921ABB277F63D6109CA81B530A3E",
        ),
      );
      
      const transactionHash = Bytes.fromHexString('65ade9a093d7d6149ef89187dc51cf22a18b45b3a80e9eb4899867f7bc5d9ffe'); 
        
      const owner = Address.fromString("0x0000000000000000000000000000000000000001");
      const amount = BigInt.fromI32(234);
      const newBurnEvent = createBurnEvent(owner, amount);

      newMessageSentToArb.transaction.hash = transactionHash;
      newBurnEvent.transaction.hash = transactionHash;
      handleBurn(newBurnEvent);
      handleMessageSent(newMessageSentToArb);

      assert.entityCount("MessageSent", 1);
      assert.fieldEquals(
        "MessageSent",
        "0x0600000000000000000000000000000000000000000000000000000000000003902d",
        "sender",
        "0xa16081f360e3847006db660bae1c6d1b2e17ec2a",
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0600000000000000000000000000000000000000000000000000000000000003902d",
        "nonce",
        "233517", // 3902D
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0600000000000000000000000000000000000000000000000000000000000003902d",
        "sourceDomain",
        "6", // It should be 0, but testing for 0 would always return true if we have wrong decoding
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0600000000000000000000000000000000000000000000000000000000000003902d",
        "message",
        newMessageSentToArb.params.message.toHexString(),
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0600000000000000000000000000000000000000000000000000000000000003902d",
        "amount",
        amount.toString(),
      );

      // Older event is ignored
      const olderEvent = createMessageSentEvent(
        Bytes.fromHexString(
          "000000000000000600000003000000000003902D000000000000000000000000D0C3DA58F55358142B8D3E06C1C30C5C6114EFE8000000000000000000000000B56571C4944D65CEADD424BFCC08D155B7ECD4C900000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007865C6E87B9F70255377E024ACE6630C1EAA37F000000000000000000000000B28CB81B1C50539AE1E941573EBA241E47F6DE5A00000000000000000000000000000000000000000000000000000000000F42400000000000000000000000003A554156AEA1921ABB277F63D6109CA81B530A3E",
        ),
      );
      olderEvent.block.timestamp = newMessageSentToArb.block.timestamp.minus(
        BigInt.fromI32(1),
      );
      olderEvent.transaction.hash = transactionHash;
      handleMessageSent(olderEvent);

      // No events added
      assert.entityCount("MessageSent", 1);
      assert.fieldEquals(
        "MessageSent",
        "0x0600000000000000000000000000000000000000000000000000000000000003902d",
        "sender",
        "0xa16081f360e3847006db660bae1c6d1b2e17ec2a",
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0600000000000000000000000000000000000000000000000000000000000003902d",
        "nonce",
        "233517", // 3902D
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0600000000000000000000000000000000000000000000000000000000000003902d",
        "sourceDomain",
        "6", // It should be 0, but testing for 0 would always return true if we have wrong decoding
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0600000000000000000000000000000000000000000000000000000000000003902d",
        "message",
        newMessageSentToArb.params.message.toHexString(),
      );
    });

    test("Newer MessageSent event with same (nonce, sourceDomain) replaces the old one", () => {
      const newMessageSentToArb = createMessageSentEvent(
        Bytes.fromHexString(
          "000000000000000600000003000000000003902D000000000000000000000000D0C3DA58F55358142B8D3E06C1C30C5C6114EFE8000000000000000000000000EB08F243E5D3FCFF26A9E38AE5520A669F4019D000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007865C6E87B9F70255377E024ACE6630C1EAA37F000000000000000000000000B28CB81B1C50539AE1E941573EBA241E47F6DE5A00000000000000000000000000000000000000000000000000000000000F42400000000000000000000000003A554156AEA1921ABB277F63D6109CA81B530A3E",
        ),
      );

      const transactionHash = Bytes.fromHexString('65ade9a093d7d6149ef89187dc51cf22a18b45b3a80e9eb4899867f7bc5d9ffe'); 
        
      const owner = Address.fromString("0x0000000000000000000000000000000000000001");
      const amount = BigInt.fromI32(145);
      const newBurnEvent = createBurnEvent(owner, amount);

      newMessageSentToArb.transaction.hash = transactionHash;
      newBurnEvent.transaction.hash = transactionHash;
      handleBurn(newBurnEvent);
      handleMessageSent(newMessageSentToArb);

      assert.entityCount("MessageSent", 1);
      assert.fieldEquals(
        "MessageSent",
        "0x0600000000000000000000000000000000000000000000000000000000000003902d",
        "sender",
        "0xa16081f360e3847006db660bae1c6d1b2e17ec2a",
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0600000000000000000000000000000000000000000000000000000000000003902d",
        "nonce",
        "233517", // 3902D
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0600000000000000000000000000000000000000000000000000000000000003902d",
        "sourceDomain",
        "6", // It should be 0, but testing for 0 would always return true if we have wrong decoding
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0600000000000000000000000000000000000000000000000000000000000003902d",
        "message",
        newMessageSentToArb.params.message.toHexString(),
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0600000000000000000000000000000000000000000000000000000000000003902d",
        "amount",
        amount.toString(),
      );

      const newerEvent = createMessageSentEvent(
        Bytes.fromHexString(
          "000000000000000600000003000000000003902D000000000000000000000000D0C3DA58F55358142B8D3E06C1C30C5C6114EFE8000000000000000000000000C030A82665A8579488A09CAAF661B43EFD93A1B100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007865C6E87B9F70255377E024ACE6630C1EAA37F000000000000000000000000B28CB81B1C50539AE1E941573EBA241E47F6DE5A00000000000000000000000000000000000000000000000000000000000F42400000000000000000000000003A554156AEA1921ABB277F63D6109CA81B530A3E",
        ),
      );
      newerEvent.block.timestamp = newMessageSentToArb.block.timestamp.plus(
        BigInt.fromI32(1),
      );
      newerEvent.transaction.hash = transactionHash;
      handleMessageSent(newerEvent);

      assert.entityCount("MessageSent", 1);
      assert.fieldEquals(
        "MessageSent",
        "0x0600000000000000000000000000000000000000000000000000000000000003902d",
        "sender",
        "0xa16081f360e3847006db660bae1c6d1b2e17ec2a",
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0600000000000000000000000000000000000000000000000000000000000003902d",
        "nonce",
        "233517", // 3902D
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0600000000000000000000000000000000000000000000000000000000000003902d",
        "sourceDomain",
        "6", // It should be 0, but testing for 0 would always return true if we have wrong decoding
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0600000000000000000000000000000000000000000000000000000000000003902d",
        "message",
        newerEvent.params.message.toHexString(),
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0600000000000000000000000000000000000000000000000000000000000003902d",
        "amount",
        amount.toString(),
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0600000000000000000000000000000000000000000000000000000000000003902d",
        "amount",
        amount.toString(),
      );
    });
  });
});

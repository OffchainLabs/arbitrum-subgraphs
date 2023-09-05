import { assert, describe, test, clearStore, afterAll } from "matchstick-as";
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  handleMessageReceived,
  handleMessageSent,
} from "../src/l-1-usdc-message-transmitter";
import {
  createMessageReceivedEvent,
  createMessageSentEvent,
} from "./l-1-usdc-message-transmitter-utils";

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
          "0000000000000000000000000000000007865C6E87B9F70255377E024ACE6630C1EAA37F000000000000000000000000F5D12029E6A6F2080A6FE7B1E748AE86FDCE5BBC00000000000000000000000000000000000000000000000000000000001E84800000000000000000000000009481EF9E2CA814FC94676DEA3E8C3097B06B3A33",
        ),
      );
      const newMessageReceivedFromAvalanche = createMessageReceivedEvent(
        caller,
        BigInt.fromI32(1),
        BigInt.fromI64(737343059199),
        sender,
        Bytes.fromHexString(
          "0000000000000000000000000000000007865C6E87B9F70255377E024ACE6630C1EAA37F000000000000000000000000F5D12029E6A6F2080A6FE7B1E748AE86FDCE5BBC00000000000000000000000000000000000000000000000000000000001E84800000000000000000000000009481EF9E2CA814FC94676DEA3E8C3097B06B3A33",
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
        "recipient",
        "0xf5d12029e6a6f2080a6fe7b1e748ae86fdce5bbc"
      );
      assert.fieldEquals(
        "MessageReceived",
        "0x0300000000000000000000000000000000000000000000000000000000000000000a",
        "sender",
        "0x9481ef9e2ca814fc94676dea3e8c3097b06b3a33",
      );
    });
  });

  describe("MessageSent", () => {
    test("MessageSent created and stored", () => {
      const newMessageSentToArb = createMessageSentEvent(
        Bytes.fromHexString(
          "00000000000000060000000300000000000394C9000000000000000000000000D0C3DA58F55358142B8D3E06C1C30C5C6114EFE800000000000000000000000012DCFD3FE2E9EAC2859FD1ED86D2AB8C5A2F935200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007865C6E87B9F70255377E024ACE6630C1EAA37F0000000000000000000000007503AAD60FD0D205702B0DCD945A1B36C42101B300000000000000000000000000000000000000000000000000000000000F42400000000000000000000000009481EF9E2CA814FC94676DEA3E8C3097B06B3A33"
        ),
      );
      const newMessageSentToAvalanche = createMessageSentEvent(
        Bytes.fromHexString(
          "000000000000000000000001000000000003902D000000000000000000000000D0C3DA58F55358142B8D3E06C1C30C5C6114EFE8000000000000000000000000EB08F243E5D3FCFF26A9E38AE5520A669F4019D000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007865C6E87B9F70255377E024ACE6630C1EAA37F000000000000000000000000B28CB81B1C50539AE1E941573EBA241E47F6DE5A00000000000000000000000000000000000000000000000000000000000F42400000000000000000000000003A554156AEA1921ABB277F63D6109CA81B530A3E",
        ),
      );

      const sender = Address.fromString("9481EF9E2CA814FC94676DEA3E8C3097B06B3A33");
      // MessageSent from Avalanche is ignored
      handleMessageSent(newMessageSentToArb);
      handleMessageSent(newMessageSentToAvalanche);

      assert.entityCount("MessageSent", 1);
      assert.fieldEquals(
        "MessageSent",
        "0x060000000000000000000000000000000000000000000000000000000000000394c9",
        "sender",
        sender.toHexString()
      );
      assert.fieldEquals(
        "MessageSent",
        "0x060000000000000000000000000000000000000000000000000000000000000394c9",
        "nonce",
        "234697", // 394C9
      );
      assert.fieldEquals(
        "MessageSent",
        "0x060000000000000000000000000000000000000000000000000000000000000394c9",
        "sourceDomain",
        "6", // It should be 0, but testing for 0 would always return true if we have wrong decoding
      );
      assert.fieldEquals(
        "MessageSent",
        "0x060000000000000000000000000000000000000000000000000000000000000394c9",
        "message",
        newMessageSentToArb.params.message.toHexString(),
      );
      assert.fieldEquals(
        "MessageSent",
        "0x060000000000000000000000000000000000000000000000000000000000000394c9",
        "recipient",
        "0x7503aad60fd0d205702b0dcd945a1b36c42101b3"
      );
      assert.fieldEquals(
        "MessageSent",
        "0x060000000000000000000000000000000000000000000000000000000000000394c9",
        "amount",
        "1000000" // F4240
      );
    });

    test("Older MessageSent event with same (nonce, sourceDomain) is skipped", () => {
      const newMessageSentToArb = createMessageSentEvent(
        Bytes.fromHexString(
          "00000000000000060000000300000000000394C9000000000000000000000000D0C3DA58F55358142B8D3E06C1C30C5C6114EFE800000000000000000000000012DCFD3FE2E9EAC2859FD1ED86D2AB8C5A2F935200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007865C6E87B9F70255377E024ACE6630C1EAA37F0000000000000000000000007503AAD60FD0D205702B0DCD945A1B36C42101B30000000000000000000000000000000000000000000000000000000000144B500000000000000000000000009481EF9E2CA814FC94676DEA3E8C3097B06B3A33",
        ),
      );
      
      const sender = Address.fromString("9481EF9E2CA814FC94676DEA3E8C3097B06B3A33");
      handleMessageSent(newMessageSentToArb);

      assert.entityCount("MessageSent", 1);
      assert.fieldEquals(
        "MessageSent",
        "0x060000000000000000000000000000000000000000000000000000000000000394c9",
        "sender",
        sender.toHexString(),
      );
      assert.fieldEquals(
        "MessageSent",
        "0x060000000000000000000000000000000000000000000000000000000000000394c9",
        "nonce",
        "234697", // 394C9
      );
      assert.fieldEquals(
        "MessageSent",
        "0x060000000000000000000000000000000000000000000000000000000000000394c9",
        "sourceDomain",
        "6", // It should be 0, but testing for 0 would always return true if we have wrong decoding
      );
      assert.fieldEquals(
        "MessageSent",
        "0x060000000000000000000000000000000000000000000000000000000000000394c9",
        "message",
        newMessageSentToArb.params.message.toHexString(),
      );
      assert.fieldEquals(
        "MessageSent",
        "0x060000000000000000000000000000000000000000000000000000000000000394c9",
        "amount",
        "1330000" // 144B50
      );
      assert.fieldEquals(
        "MessageSent",
        "0x060000000000000000000000000000000000000000000000000000000000000394c9",
        "recipient",
        "0x7503aad60fd0d205702b0dcd945a1b36c42101b3"
      );

      // Older event is ignored
      const olderEvent = createMessageSentEvent(
        Bytes.fromHexString(
          "00000000000000060000000300000000000394C9000000000000000000000000D0C3DA58F55358142B8D3E06C1C30C5C6114EFE8000000000000000000000000B56571C4944D65CEADD424BFCC08D155B7ECD4C900000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007865C6E87B9F70255377E024ACE6630C1EAA37F0000000000000000000000009481EF9E2CA814FC94676DEA3E8C3097B06B3A330000000000000000000000000000000000000000000000000000000000144B500000000000000000000000009481EF9E2CA814FC94676DEA3E8C3097B06B3A33",
        ),
      );
      olderEvent.block.timestamp = newMessageSentToArb.block.timestamp.minus(
        BigInt.fromI32(1),
      );
      handleMessageSent(olderEvent);

      // No events added
      assert.entityCount("MessageSent", 1);
      assert.fieldEquals(
        "MessageSent",
        "0x060000000000000000000000000000000000000000000000000000000000000394c9",
        "sender",
        sender.toHexString(),
      );
      assert.fieldEquals(
        "MessageSent",
        "0x060000000000000000000000000000000000000000000000000000000000000394c9",
        "nonce",
        "234697", // 394C9
      );
      assert.fieldEquals(
        "MessageSent",
        "0x060000000000000000000000000000000000000000000000000000000000000394c9",
        "sourceDomain",
        "6", // It should be 0, but testing for 0 would always return true if we have wrong decoding
      );
      assert.fieldEquals(
        "MessageSent",
        "0x060000000000000000000000000000000000000000000000000000000000000394c9",
        "message",
        newMessageSentToArb.params.message.toHexString(),
      );
      assert.fieldEquals(
        "MessageSent",
        "0x060000000000000000000000000000000000000000000000000000000000000394c9",
        "amount",
        "1330000" // 144B50
      );
    });

    test("Newer MessageSent event with same (nonce, sourceDomain) replaces the old one", () => {
      const newMessageSentToArb = createMessageSentEvent(
        Bytes.fromHexString(
          "00000000000000060000000300000000000394C9000000000000000000000000D0C3DA58F55358142B8D3E06C1C30C5C6114EFE800000000000000000000000012DCFD3FE2E9EAC2859FD1ED86D2AB8C5A2F935200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007865C6E87B9F70255377E024ACE6630C1EAA37F0000000000000000000000007503AAD60FD0D205702B0DCD945A1B36C42101B30000000000000000000000000000000000000000000000000000000000144B500000000000000000000000009481EF9E2CA814FC94676DEA3E8C3097B06B3A33",
        ),
      );

      const sender = Address.fromString("9481EF9E2CA814FC94676DEA3E8C3097B06B3A33");
      handleMessageSent(newMessageSentToArb);

      assert.entityCount("MessageSent", 1);
      assert.fieldEquals(
        "MessageSent",
        "0x060000000000000000000000000000000000000000000000000000000000000394c9",
        "sender",
        sender.toHexString()
      );
      assert.fieldEquals(
        "MessageSent",
        "0x060000000000000000000000000000000000000000000000000000000000000394c9",
        "nonce",
        "234697", // 394C9
      );
      assert.fieldEquals(
        "MessageSent",
        "0x060000000000000000000000000000000000000000000000000000000000000394c9",
        "sourceDomain",
        "6", // It should be 0, but testing for 0 would always return true if we have wrong decoding
      );
      assert.fieldEquals(
        "MessageSent",
        "0x060000000000000000000000000000000000000000000000000000000000000394c9",
        "message",
        newMessageSentToArb.params.message.toHexString(),
      );
      assert.fieldEquals(
        "MessageSent",
        "0x060000000000000000000000000000000000000000000000000000000000000394c9",
        "amount",
        "1330000" // 144B50
      );
      assert.fieldEquals(
        "MessageSent",
        "0x060000000000000000000000000000000000000000000000000000000000000394c9",
        "recipient",
        "0x7503aad60fd0d205702b0dcd945a1b36c42101b3"
      );

      const newerEvent = createMessageSentEvent(
        Bytes.fromHexString(
          "00000000000000060000000300000000000394C9000000000000000000000000D0C3DA58F55358142B8D3E06C1C30C5C6114EFE8000000000000000000000000B56571C4944D65CEADD424BFCC08D155B7ECD4C900000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007865C6E87B9F70255377E024ACE6630C1EAA37F0000000000000000000000009481EF9E2CA814FC94676DEA3E8C3097B06B3A330000000000000000000000000000000000000000000000000000000000144B500000000000000000000000009481EF9E2CA814FC94676DEA3E8C3097B06B3A33",
        ),
      ); // Recipient was updated to sender
      
      newerEvent.block.timestamp = newMessageSentToArb.block.timestamp.plus(
        BigInt.fromI32(1),
      );
      handleMessageSent(newerEvent);

      assert.entityCount("MessageSent", 1);
      assert.fieldEquals(
        "MessageSent",
        "0x060000000000000000000000000000000000000000000000000000000000000394c9",
        "sender",
        sender.toHexString(),
      );
      assert.fieldEquals(
        "MessageSent",
        "0x060000000000000000000000000000000000000000000000000000000000000394c9",
        "nonce",
        "234697", // 394C9
      );
      assert.fieldEquals(
        "MessageSent",
        "0x060000000000000000000000000000000000000000000000000000000000000394c9",
        "sourceDomain",
        "6", // It should be 0, but testing for 0 would always return true if we have wrong decoding
      );
      assert.fieldEquals(
        "MessageSent",
        "0x060000000000000000000000000000000000000000000000000000000000000394c9",
        "message",
        newerEvent.params.message.toHexString(),
      );
      assert.fieldEquals(
        "MessageSent",
        "0x060000000000000000000000000000000000000000000000000000000000000394c9",
        "amount",
        "1330000" // 144B50
      );
      assert.fieldEquals(
        "MessageSent",
        "0x060000000000000000000000000000000000000000000000000000000000000394c9",
        "recipient",
        sender.toHexString()
      );
    });
  });
});

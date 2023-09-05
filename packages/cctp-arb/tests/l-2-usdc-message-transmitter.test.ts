import { assert, describe, test, clearStore, afterAll } from "matchstick-as";
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  handleMessageReceived,
  handleMessageSent,
} from "../src/l-2-usdc-message-transmitter";
import {
  createMessageReceivedEvent,
  createMessageSentEvent,
} from "./l-2-usdc-message-transmitter-utils";

describe("Message events", () => {
  afterAll(() => { 
    clearStore()
  })

  describe("MessageReceived", () => {
    test("MessageReceived created and stored", () => {
      const newMessageReceivedFromMainnet = createMessageReceivedEvent(
        Address.fromString(
          "0x0000000000000000000000000000000000000001",
        ),
        BigInt.fromI32(0),
        BigInt.fromI32(10),
        Bytes.fromHexString(
          "0x0004000400030004000500060007000800090001000200030000000000000002",
        ),
        Bytes.fromHexString(
          "0000000000000000000000000000000007865C6E87B9F70255377E024ACE6630C1EAA37F000000000000000000000000F5D12029E6A6F2080A6FE7B1E748AE86FDCE5BBC00000000000000000000000000000000000000000000000000000000001E84800000000000000000000000009481EF9E2CA814FC94676DEA3E8C3097B06B3A33",
        ),
      );

      handleMessageReceived(newMessageReceivedFromMainnet);
      assert.entityCount("MessageReceived", 1);

      // Message from mainnet
      assert.fieldEquals(
        "MessageReceived",
        "0x0300000000000000000000000000000000000000000000000000000000000000000a",
        "sourceDomain",
        "0",
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
  })

  describe("MessageSent", () => {
    test("MessageSent created and stored", () => {
      const newMessageSentToMainnet = createMessageSentEvent(
        Bytes.fromHexString(
          "000000000000000300000000000000000003902D000000000000000000000000D0C3DA58F55358142B8D3E06C1C30C5C6114EFE8000000000000000000000000EB08F243E5D3FCFF26A9E38AE5520A669F4019D000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007865C6E87B9F70255377E024ACE6630C1EAA37F000000000000000000000000B28CB81B1C50539AE1E941573EBA241E47F6DE5A00000000000000000000000000000000000000000000000000000000000F42400000000000000000000000003A554156AEA1921ABB277F63D6109CA81B530A3E",
        ),
      );
      const sender = Address.fromString("3A554156AEA1921ABB277F63D6109CA81B530A3E");
      handleMessageSent(newMessageSentToMainnet);

      assert.entityCount("MessageSent", 1);
      assert.fieldEquals(
        "MessageSent",
        "0x0300000000000000000000000000000000000000000000000000000000000003902d",
        "sender",
        sender.toHexString()
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0300000000000000000000000000000000000000000000000000000000000003902d",
        "nonce",
        "233517", // 3902D
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0300000000000000000000000000000000000000000000000000000000000003902d",
        "sourceDomain",
        "3",
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0300000000000000000000000000000000000000000000000000000000000003902d",
        "message",
        newMessageSentToMainnet.params.message.toHexString(),
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0300000000000000000000000000000000000000000000000000000000000003902d",
        "recipient",
        "0xb28cb81b1c50539ae1e941573eba241e47f6de5a",
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0300000000000000000000000000000000000000000000000000000000000003902d",
        "amount",
        "1000000" // F4240
      );
    });

    test("Older MessageSent event with same (nonce, sourceDomain) is skipped", () => {
      const newMessageSentToMainnet = createMessageSentEvent(
        Bytes.fromHexString(
          "000000000000000300000000000000000003902D000000000000000000000000D0C3DA58F55358142B8D3E06C1C30C5C6114EFE8000000000000000000000000EB08F243E5D3FCFF26A9E38AE5520A669F4019D000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007865C6E87B9F70255377E024ACE6630C1EAA37F000000000000000000000000B28CB81B1C50539AE1E941573EBA241E47F6DE5A00000000000000000000000000000000000000000000000000000000000F42400000000000000000000000003A554156AEA1921ABB277F63D6109CA81B530A3E",
        ),
      );

      const sender = Address.fromString("3A554156AEA1921ABB277F63D6109CA81B530A3E");
      handleMessageSent(newMessageSentToMainnet);

      assert.entityCount("MessageSent", 1);
      assert.fieldEquals(
        "MessageSent",
        "0x0300000000000000000000000000000000000000000000000000000000000003902d",
        "sender",
        sender.toHexString()
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0300000000000000000000000000000000000000000000000000000000000003902d",
        "nonce",
        "233517", // 3902D
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0300000000000000000000000000000000000000000000000000000000000003902d",
        "sourceDomain",
        "3",
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0300000000000000000000000000000000000000000000000000000000000003902d",
        "message",
        newMessageSentToMainnet.params.message.toHexString(),
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0300000000000000000000000000000000000000000000000000000000000003902d",
        "recipient",
        "0xb28cb81b1c50539ae1e941573eba241e47f6de5a",
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0300000000000000000000000000000000000000000000000000000000000003902d",
        "amount",
        "1000000" // F4240
      );

      // Older event is ignored
      const olderEvent = createMessageSentEvent(
        Bytes.fromHexString(
          "000000000000000300000000000000000003902D000000000000000000000000D0C3DA58F55358142B8D3E06C1C30C5C6114EFE8000000000000000000000000EB08F243E5D3FCFF26A9E38AE5520A669F4019D000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007865C6E87B9F70255377E024ACE6630C1EAA37F0000000000000000000000009481EF9E2CA814FC94676DEA3E8C3097B06B3A3300000000000000000000000000000000000000000000000000000000000F42400000000000000000000000003A554156AEA1921ABB277F63D6109CA81B530A3E",
        ),
      );
      olderEvent.block.timestamp = newMessageSentToMainnet.block.timestamp.minus(
        BigInt.fromI32(1),
      );
      handleMessageSent(olderEvent);

      // No events added
      assert.entityCount("MessageSent", 1);
      assert.fieldEquals(
        "MessageSent",
        "0x0300000000000000000000000000000000000000000000000000000000000003902d",
        "sender",
        sender.toHexString()
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0300000000000000000000000000000000000000000000000000000000000003902d",
        "nonce",
        "233517", // 3902D
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0300000000000000000000000000000000000000000000000000000000000003902d",
        "sourceDomain",
        "3",
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0300000000000000000000000000000000000000000000000000000000000003902d",
        "message",
        newMessageSentToMainnet.params.message.toHexString(),
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0300000000000000000000000000000000000000000000000000000000000003902d",
        "recipient",
        "0xb28cb81b1c50539ae1e941573eba241e47f6de5a",
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0300000000000000000000000000000000000000000000000000000000000003902d",
        "amount",
        "1000000" // F4240
      );
    });

    test("Newer MessageSent event with same (nonce, sourceDomain) replaces the old one", () => {
      const newMessageSentToMainnet = createMessageSentEvent(
        Bytes.fromHexString(
          "000000000000000300000000000000000003902D000000000000000000000000D0C3DA58F55358142B8D3E06C1C30C5C6114EFE8000000000000000000000000EB08F243E5D3FCFF26A9E38AE5520A669F4019D000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007865C6E87B9F70255377E024ACE6630C1EAA37F000000000000000000000000B28CB81B1C50539AE1E941573EBA241E47F6DE5A00000000000000000000000000000000000000000000000000000000000F42400000000000000000000000003A554156AEA1921ABB277F63D6109CA81B530A3E",
        ),
      );

      const sender = Address.fromString("3A554156AEA1921ABB277F63D6109CA81B530A3E");
      handleMessageSent(newMessageSentToMainnet);

      assert.entityCount("MessageSent", 1);
      assert.fieldEquals(
        "MessageSent",
        "0x0300000000000000000000000000000000000000000000000000000000000003902d",
        "sender",
        sender.toHexString(),
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0300000000000000000000000000000000000000000000000000000000000003902d",
        "nonce",
        "233517", // 3902D
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0300000000000000000000000000000000000000000000000000000000000003902d",
        "sourceDomain",
        "3",
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0300000000000000000000000000000000000000000000000000000000000003902d",
        "message",
        newMessageSentToMainnet.params.message.toHexString(),
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0300000000000000000000000000000000000000000000000000000000000003902d",
        "recipient",
        "0xb28cb81b1c50539ae1e941573eba241e47f6de5a",
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0300000000000000000000000000000000000000000000000000000000000003902d",
        "amount",
        "1000000" // F4240
      );

      const newerEvent = createMessageSentEvent(
        Bytes.fromHexString(
          "000000000000000300000000000000000003902D000000000000000000000000D0C3DA58F55358142B8D3E06C1C30C5C6114EFE8000000000000000000000000EB08F243E5D3FCFF26A9E38AE5520A669F4019D000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007865C6E87B9F70255377E024ACE6630C1EAA37F0000000000000000000000009481EF9E2CA814FC94676DEA3E8C3097B06B3A3300000000000000000000000000000000000000000000000000000000000F42400000000000000000000000003A554156AEA1921ABB277F63D6109CA81B530A3E",
        ),
      );

      newerEvent.block.timestamp = newMessageSentToMainnet.block.timestamp.plus(
        BigInt.fromI32(1),
      );
      handleMessageSent(newerEvent);

      assert.entityCount("MessageSent", 1);
      assert.fieldEquals(
        "MessageSent",
        "0x0300000000000000000000000000000000000000000000000000000000000003902d",
        "sender",
        sender.toHexString(),
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0300000000000000000000000000000000000000000000000000000000000003902d",
        "nonce",
        "233517", // 3902D
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0300000000000000000000000000000000000000000000000000000000000003902d",
        "sourceDomain",
        "3",
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0300000000000000000000000000000000000000000000000000000000000003902d",
        "message",
        newerEvent.params.message.toHexString(),
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0300000000000000000000000000000000000000000000000000000000000003902d",
        "recipient",
        "0x9481ef9e2ca814fc94676dea3e8c3097b06b3a33",
      );
      assert.fieldEquals(
        "MessageSent",
        "0x0300000000000000000000000000000000000000000000000000000000000003902d",
        "amount",
        "1000000" // F4240
      );
    });
  });
});

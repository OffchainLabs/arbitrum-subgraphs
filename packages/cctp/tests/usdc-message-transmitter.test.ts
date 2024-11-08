import { assert, describe, test, clearStore, afterEach } from "matchstick-as";
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  ChainDomain,
  handleMessageReceivedL1,
  handleMessageReceivedL2,
  handleMessageSentL1,
  handleMessageSentL2,
} from "../src/usdc-message-transmitter";
import {
  createMessageReceivedEvent,
  createMessageSentEvent,
} from "./usdc-message-transmitter-utils";

function messageReceivedHandler(
  network: string,
  sourceDomain: ChainDomain
): void {
  const caller = Address.fromString(
    "0x0000000000000000000000000000000000000001"
  );
  const sender = Bytes.fromHexString(
    "0x0004000400030004000500060007000800090001000200030000000000000002"
  );
  const newMessageReceivedFromValidNetwork = createMessageReceivedEvent(
    caller,
    BigInt.fromI32(sourceDomain),
    BigInt.fromI32(10),
    sender,
    Bytes.fromHexString(
      "0000000000000000000000000000000007865C6E87B9F70255377E024ACE6630C1EAA37F000000000000000000000000F5D12029E6A6F2080A6FE7B1E748AE86FDCE5BBC00000000000000000000000000000000000000000000000000000000001E84800000000000000000000000009481EF9E2CA814FC94676DEA3E8C3097B06B3A33"
    )
  );
  const newMessageReceivedFromAvalanche = createMessageReceivedEvent(
    caller,
    BigInt.fromI32(1),
    BigInt.fromI64(737343059199),
    sender,
    Bytes.fromHexString(
      "0000000000000000000000000000000007865C6E87B9F70255377E024ACE6630C1EAA37F000000000000000000000000F5D12029E6A6F2080A6FE7B1E748AE86FDCE5BBC00000000000000000000000000000000000000000000000000000000001E84800000000000000000000000009481EF9E2CA814FC94676DEA3E8C3097B06B3A33"
    )
  );
  const handler =
    network === "L1" ? handleMessageReceivedL1 : handleMessageReceivedL2;
  handler(newMessageReceivedFromValidNetwork);
  handler(newMessageReceivedFromAvalanche);

  // MessageReceived from Avalanche is ignored
  const id = `0x0${sourceDomain}00000000000000000000000000000000000000000000000000000000000000000a`;
  assert.entityCount("MessageReceived", 1);
  assert.fieldEquals(
    "MessageReceived",
    id,
    "sourceDomain",
    sourceDomain.toString()
  );
  assert.fieldEquals(
    "MessageReceived",
    id,
    "recipient",
    "0xf5d12029e6a6f2080a6fe7b1e748ae86fdce5bbc"
  );
  assert.fieldEquals(
    "MessageReceived",
    id,
    "sender",
    "0x9481ef9e2ca814fc94676dea3e8c3097b06b3a33"
  );
}

function messageSentHandler(
  network: string,
  sourceDomain: ChainDomain,
  destinationDomain: ChainDomain
): void {
  const newMessageSentToValidNetwork = createMessageSentEvent(
    Bytes.fromHexString(
      `000000000000000${sourceDomain}0000000${destinationDomain}00000000000394C9000000000000000000000000D0C3DA58F55358142B8D3E06C1C30C5C6114EFE800000000000000000000000012DCFD3FE2E9EAC2859FD1ED86D2AB8C5A2F935200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007865C6E87B9F70255377E024ACE6630C1EAA37F0000000000000000000000007503AAD60FD0D205702B0DCD945A1B36C42101B300000000000000000000000000000000000000000000000000000000000F42400000000000000000000000009481EF9E2CA814FC94676DEA3E8C3097B06B3A33`
    )
  );
  const newMessageSentToAvalanche = createMessageSentEvent(
    Bytes.fromHexString(
      `000000000000000${sourceDomain}00000001000000000003902D000000000000000000000000D0C3DA58F55358142B8D3E06C1C30C5C6114EFE8000000000000000000000000EB08F243E5D3FCFF26A9E38AE5520A669F4019D000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007865C6E87B9F70255377E024ACE6630C1EAA37F000000000000000000000000B28CB81B1C50539AE1E941573EBA241E47F6DE5A00000000000000000000000000000000000000000000000000000000000F42400000000000000000000000003A554156AEA1921ABB277F63D6109CA81B530A3E`
    )
  );
  const sender = Address.fromString("9481EF9E2CA814FC94676DEA3E8C3097B06B3A33");
  // MessageSent from Avalanche is ignored
  const handler = network === "L1" ? handleMessageSentL1 : handleMessageSentL2;
  handler(newMessageSentToValidNetwork);
  handler(newMessageSentToAvalanche);
  const id = `0x0${sourceDomain}0000000000000000000000000000000000000000000000000000000000000394c9`;
  assert.entityCount("MessageSent", 1);
  assert.fieldEquals("MessageSent", id, "sender", sender.toHexString());
  assert.fieldEquals(
    "MessageSent",
    id,
    "nonce",
    "234697" // 394C9
  );
  assert.fieldEquals(
    "MessageSent",
    id,
    "sourceDomain",
    sourceDomain.toString()
  );
  assert.fieldEquals(
    "MessageSent",
    id,
    "message",
    newMessageSentToValidNetwork.params.message.toHexString()
  );
  assert.fieldEquals(
    "MessageSent",
    id,
    "recipient",
    "0x7503aad60fd0d205702b0dcd945a1b36c42101b3"
  );
  assert.fieldEquals(
    "MessageSent",
    id,
    "amount",
    "1000000" // F4240
  );
}

function olderMessageSentIsSkipped(
  network: string,
  sourceDomain: ChainDomain,
  destinationDomain: ChainDomain
): void {
  const newMessageSentToValidNetwork = createMessageSentEvent(
    Bytes.fromHexString(
      `000000000000000${sourceDomain}0000000${destinationDomain}00000000000394C9000000000000000000000000D0C3DA58F55358142B8D3E06C1C30C5C6114EFE800000000000000000000000012DCFD3FE2E9EAC2859FD1ED86D2AB8C5A2F935200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007865C6E87B9F70255377E024ACE6630C1EAA37F0000000000000000000000007503AAD60FD0D205702B0DCD945A1B36C42101B30000000000000000000000000000000000000000000000000000000000144B500000000000000000000000009481EF9E2CA814FC94676DEA3E8C3097B06B3A33`
    )
  );
  const sender = Address.fromString("9481EF9E2CA814FC94676DEA3E8C3097B06B3A33");
  const handler = network === "L1" ? handleMessageSentL1 : handleMessageSentL2;
  handler(newMessageSentToValidNetwork);
  const id = `0x0${sourceDomain}0000000000000000000000000000000000000000000000000000000000000394c9`;
  assert.entityCount("MessageSent", 1);
  assert.fieldEquals("MessageSent", id, "sender", sender.toHexString());
  assert.fieldEquals(
    "MessageSent",
    id,
    "nonce",
    "234697" // 394C9
  );
  assert.fieldEquals(
    "MessageSent",
    id,
    "sourceDomain",
    sourceDomain.toString()
  );
  assert.fieldEquals(
    "MessageSent",
    id,
    "message",
    newMessageSentToValidNetwork.params.message.toHexString()
  );
  assert.fieldEquals(
    "MessageSent",
    id,
    "amount",
    "1330000" // 144B50
  );
  assert.fieldEquals(
    "MessageSent",
    id,
    "recipient",
    "0x7503aad60fd0d205702b0dcd945a1b36c42101b3"
  );
  // Older event is ignored
  const olderEvent = createMessageSentEvent(
    Bytes.fromHexString(
      `000000000000000${sourceDomain}0000000${destinationDomain}00000000000394C9000000000000000000000000D0C3DA58F55358142B8D3E06C1C30C5C6114EFE8000000000000000000000000B56571C4944D65CEADD424BFCC08D155B7ECD4C900000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007865C6E87B9F70255377E024ACE6630C1EAA37F0000000000000000000000009481EF9E2CA814FC94676DEA3E8C3097B06B3A330000000000000000000000000000000000000000000000000000000000144B500000000000000000000000009481EF9E2CA814FC94676DEA3E8C3097B06B3A33`
    )
  );
  olderEvent.block.timestamp =
    newMessageSentToValidNetwork.block.timestamp.minus(BigInt.fromI32(1));
  handler(olderEvent);
  // No events added
  assert.entityCount("MessageSent", 1);
  assert.fieldEquals("MessageSent", id, "sender", sender.toHexString());
  assert.fieldEquals(
    "MessageSent",
    id,
    "nonce",
    "234697" // 394C9
  );
  assert.fieldEquals(
    "MessageSent",
    id,
    "sourceDomain",
    sourceDomain.toString()
  );
  assert.fieldEquals(
    "MessageSent",
    id,
    "message",
    newMessageSentToValidNetwork.params.message.toHexString()
  );
  assert.fieldEquals(
    "MessageSent",
    id,
    "amount",
    "1330000" // 144B50
  );
}

function newerMessageSentAreKept(
  network: string,
  sourceDomain: ChainDomain,
  destinationDomain: ChainDomain
): void {
  const newMessageSentToValidNetwork = createMessageSentEvent(
    Bytes.fromHexString(
      `000000000000000${sourceDomain}0000000${destinationDomain}00000000000394C9000000000000000000000000D0C3DA58F55358142B8D3E06C1C30C5C6114EFE800000000000000000000000012DCFD3FE2E9EAC2859FD1ED86D2AB8C5A2F935200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007865C6E87B9F70255377E024ACE6630C1EAA37F0000000000000000000000007503AAD60FD0D205702B0DCD945A1B36C42101B30000000000000000000000000000000000000000000000000000000000144B500000000000000000000000009481EF9E2CA814FC94676DEA3E8C3097B06B3A33`
    )
  );
  const sender = Address.fromString("9481EF9E2CA814FC94676DEA3E8C3097B06B3A33");
  const handler = network === "L1" ? handleMessageSentL1 : handleMessageSentL2;
  handler(newMessageSentToValidNetwork);
  const id = `0x0${sourceDomain}0000000000000000000000000000000000000000000000000000000000000394c9`;
  assert.entityCount("MessageSent", 1);
  assert.fieldEquals("MessageSent", id, "sender", sender.toHexString());
  assert.fieldEquals(
    "MessageSent",
    id,
    "nonce",
    "234697" // 394C9
  );
  assert.fieldEquals(
    "MessageSent",
    id,
    "sourceDomain",
    sourceDomain.toString()
  );
  assert.fieldEquals(
    "MessageSent",
    id,
    "message",
    newMessageSentToValidNetwork.params.message.toHexString()
  );
  assert.fieldEquals(
    "MessageSent",
    id,
    "amount",
    "1330000" // 144B50
  );
  assert.fieldEquals(
    "MessageSent",
    id,
    "recipient",
    "0x7503aad60fd0d205702b0dcd945a1b36c42101b3"
  );
  const newerEvent = createMessageSentEvent(
    Bytes.fromHexString(
      `000000000000000${sourceDomain}0000000${destinationDomain}00000000000394C9000000000000000000000000D0C3DA58F55358142B8D3E06C1C30C5C6114EFE8000000000000000000000000B56571C4944D65CEADD424BFCC08D155B7ECD4C900000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007865C6E87B9F70255377E024ACE6630C1EAA37F0000000000000000000000009481EF9E2CA814FC94676DEA3E8C3097B06B3A330000000000000000000000000000000000000000000000000000000000144B500000000000000000000000009481EF9E2CA814FC94676DEA3E8C3097B06B3A33`
    )
  ); // Recipient was updated to sender
  newerEvent.block.timestamp =
    newMessageSentToValidNetwork.block.timestamp.plus(BigInt.fromI32(1));
  handler(newerEvent);
  assert.entityCount("MessageSent", 1);
  assert.fieldEquals("MessageSent", id, "sender", sender.toHexString());
  assert.fieldEquals(
    "MessageSent",
    id,
    "nonce",
    "234697" // 394C9
  );
  assert.fieldEquals(
    "MessageSent",
    id,
    "sourceDomain",
    sourceDomain.toString()
  );
  assert.fieldEquals(
    "MessageSent",
    id,
    "message",
    newerEvent.params.message.toHexString()
  );
  assert.fieldEquals(
    "MessageSent",
    id,
    "amount",
    "1330000" // 144B50
  );
  assert.fieldEquals("MessageSent", id, "recipient", sender.toHexString());
}

describe("Message events", () => {
  afterEach(() => {
    clearStore();
  });

  describe("MessageReceived", () => {
    test(`MessageReceived created and stored (L1)`, () => {
      messageReceivedHandler("L1", ChainDomain.Arbitrum);
    });

    test(`MessageReceived created and stored (L2)`, () => {
      messageReceivedHandler("L2", ChainDomain.Mainnet);
    });
  });

  describe("MessageSent", () => {
    test(`MessageSent created and stored (L1)`, () => {
      messageSentHandler("L1", ChainDomain.Mainnet, ChainDomain.Arbitrum);
    });

    test(`MessageSent created and stored (L2)`, () => {
      messageSentHandler("L2", ChainDomain.Arbitrum, ChainDomain.Mainnet);
    });

    test(`Older MessageSent event with same (nonce, sourceDomain) is skipped (L1)`, () => {
      olderMessageSentIsSkipped(
        "L1",
        ChainDomain.Mainnet,
        ChainDomain.Arbitrum
      );
    });

    test(`Older MessageSent event with same (nonce, sourceDomain) is skipped (L2)`, () => {
      olderMessageSentIsSkipped(
        "L2",
        ChainDomain.Arbitrum,
        ChainDomain.Mainnet
      );
    });

    test(`Newer MessageSent event with same (nonce, sourceDomain) replaces the old one (L1)`, () => {
      newerMessageSentAreKept("L1", ChainDomain.Mainnet, ChainDomain.Arbitrum);
    });

    test(`Newer MessageSent event with same (nonce, sourceDomain) replaces the old one (L2)`, () => {
      newerMessageSentAreKept("L2", ChainDomain.Arbitrum, ChainDomain.Mainnet);
    });
  });
});

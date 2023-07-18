import {
  assert,
  describe,
  test,
  clearStore
} from "matchstick-as"
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import { handleMessageReceived, handleMessageSent } from "../src/l-2-usdc-message-transmitter"
import { createMessageReceivedEvent, createMessageSentEvent } from "./l-2-usdc-message-transmitter-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Message events", () => {
  test("MessageReceived created and stored", () => {
    const caller = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    const sender = Address.fromString(
      "0x0000000000000000000000000000000000000002"
    )
    const newMessageReceivedFromMainnet = createMessageReceivedEvent(caller, BigInt.fromI32(0), BigInt.fromI32(0), sender, Bytes.fromHexString('0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000eb08f243e5d3fcff26a9e38ae5520a669f4019d000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000084000000000000000000000000000000005425890298aed601595a70ab815c96711a31bc6500000000000000000000000020799b34e4382ad646bc873c7d96d02ac2f9c202000000000000000000000000000000000000000000000000000000003b8b87c0000000000000000000000000a61ec254ef8f5245375870ef4f3990d94a35190900000000000000000000000000000000000000000000000000000000'))
    const newMessageReceivedFromAvalanche = createMessageReceivedEvent(caller, BigInt.fromI32(1), BigInt.fromI32(0), sender, Bytes.fromHexString('0x0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000eb08f243e5d3fcff26a9e38ae5520a669f4019d000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000084000000000000000000000000000000005425890298aed601595a70ab815c96711a31bc6500000000000000000000000020799b34e4382ad646bc873c7d96d02ac2f9c202000000000000000000000000000000000000000000000000000000003b8b87c0000000000000000000000000a61ec254ef8f5245375870ef4f3990d94a35190900000000000000000000000000000000000000000000000000000000'))
    newMessageReceivedFromAvalanche.transaction.hash = Bytes.fromHexString('0xa16081f360e3847006db660bae1c6d1b2e17ec2b')

    handleMessageReceived(newMessageReceivedFromMainnet)
    handleMessageReceived(newMessageReceivedFromAvalanche)
    assert.entityCount("MessageReceived", 2)

    // Message from mainnet
    assert.fieldEquals(
      "MessageReceived",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a01000000",
      "sourceDomain",
      "0"
    )
    assert.fieldEquals(
      "MessageReceived",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a01000000",
      "caller",
      caller.toHexString()
    )
    assert.fieldEquals(
      "MessageReceived",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a01000000",
      "sender",
      sender.toHexString()
    )

    // Message from avalanche
    assert.fieldEquals(
      "MessageReceived",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2b01000000",
      "sourceDomain",
      "1"
    )
    assert.fieldEquals(
      "MessageReceived",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2b01000000",
      "caller",
      caller.toHexString()
    )
    assert.fieldEquals(
      "MessageReceived",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2b01000000",
      "sender",
      sender.toHexString()
    )

    clearStore()
  })

  test('MessageSent created and stored', () => {
    const newMessageSentToMainnet = createMessageSentEvent(Bytes.fromHexString("000000000000000300000000000000000003902D000000000000000000000000D0C3DA58F55358142B8D3E06C1C30C5C6114EFE8000000000000000000000000EB08F243E5D3FCFF26A9E38AE5520A669F4019D000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007865C6E87B9F70255377E024ACE6630C1EAA37F000000000000000000000000B28CB81B1C50539AE1E941573EBA241E47F6DE5A00000000000000000000000000000000000000000000000000000000000F42400000000000000000000000003A554156AEA1921ABB277F63D6109CA81B530A3E"))
    const newMessageSentToAvalanche = createMessageSentEvent(Bytes.fromHexString("00000000000000030000000100000000000030A7000000000000000000000000D0C3DA58F55358142B8D3E06C1C30C5C6114EFE8000000000000000000000000EB08F243E5D3FCFF26A9E38AE5520A669F4019D000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007865C6E87B9F70255377E024ACE6630C1EAA37F000000000000000000000000B28CB81B1C50539AE1E941573EBA241E47F6DE5A00000000000000000000000000000000000000000000000000000000000F42400000000000000000000000003A554156AEA1921ABB277F63D6109CA81B530A3E"))
    newMessageSentToAvalanche.transaction.hash = Bytes.fromHexString('0xa16081f360e3847006db660bae1c6d1b2e17ec2b')
    
    // MessageSent from Avalanche is ignored
    handleMessageSent(newMessageSentToMainnet)
    handleMessageSent(newMessageSentToAvalanche)

    assert.entityCount("MessageSent", 2)

    // Message to mainnet
    assert.fieldEquals(
      "MessageSent",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a01000000",
      "sender",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a"
    )
    assert.fieldEquals(
      "MessageSent",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a01000000",
      "nonce",
      "233517" // 3902D
    )
    assert.fieldEquals(
      "MessageSent",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a01000000",
      "sourceDomain",
      "3"
    )

    // Message to avalanche
    assert.fieldEquals(
      "MessageSent",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2b01000000",
      "sender",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a"
    )
    assert.fieldEquals(
      "MessageSent",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2b01000000",
      "nonce",
      "12455" // 30A7
    )
    assert.fieldEquals(
      "MessageSent",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2b01000000",
      "sourceDomain",
      "3"
    )
  })
})

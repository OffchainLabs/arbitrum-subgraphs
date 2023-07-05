import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { BigInt, Address, Bytes } from "@graphprotocol/graph-ts"
import { DepositForBurn } from "../generated/schema"
import { DepositForBurn as DepositForBurnEvent } from "../generated/L1USDCTokenMessenger/L1USDCTokenMessenger"
import { handleDepositForBurn } from "../src/l-1-usdc-token-messenger"
import { createDepositForBurnEvent } from "./l-1-usdc-token-messenger-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let nonce = BigInt.fromI32(234)
    let burnToken = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let amount = BigInt.fromI32(234)
    let depositor = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let mintRecipient = Bytes.fromI32(1234567890)
    let destinationDomain = BigInt.fromI32(234)
    let destinationTokenMessenger = Bytes.fromI32(1234567890)
    let destinationCaller = Bytes.fromI32(1234567890)
    let newDepositForBurnEvent = createDepositForBurnEvent(
      nonce,
      burnToken,
      amount,
      depositor,
      mintRecipient,
      destinationDomain,
      destinationTokenMessenger,
      destinationCaller
    )
    handleDepositForBurn(newDepositForBurnEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("DepositForBurn created and stored", () => {
    assert.entityCount("DepositForBurn", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "DepositForBurn",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "nonce",
      "234"
    )
    assert.fieldEquals(
      "DepositForBurn",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "burnToken",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "DepositForBurn",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "amount",
      "234"
    )
    assert.fieldEquals(
      "DepositForBurn",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "depositor",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "DepositForBurn",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "mintRecipient",
      "1234567890"
    )
    assert.fieldEquals(
      "DepositForBurn",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "destinationDomain",
      "234"
    )
    assert.fieldEquals(
      "DepositForBurn",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "destinationTokenMessenger",
      "1234567890"
    )
    assert.fieldEquals(
      "DepositForBurn",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "destinationCaller",
      "1234567890"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})

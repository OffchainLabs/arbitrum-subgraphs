import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import { AttesterDisabled } from "../generated/schema"
import { AttesterDisabled as AttesterDisabledEvent } from "../generated/L1USDCMessageTransmitter/L1USDCMessageTransmitter"
import { handleAttesterDisabled } from "../src/l-1-usdc-message-transmitter"
import { createAttesterDisabledEvent } from "./l-1-usdc-message-transmitter-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let attester = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let newAttesterDisabledEvent = createAttesterDisabledEvent(attester)
    handleAttesterDisabled(newAttesterDisabledEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("AttesterDisabled created and stored", () => {
    assert.entityCount("AttesterDisabled", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "AttesterDisabled",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "attester",
      "0x0000000000000000000000000000000000000001"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})

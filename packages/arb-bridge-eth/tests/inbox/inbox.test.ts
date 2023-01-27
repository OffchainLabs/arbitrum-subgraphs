import { Address, BigInt, Bytes, ethereum, store, log } from "@graphprotocol/graph-ts";
import { ClassicRawMessage, RawMessage, Retryable } from "../../generated/schema";
import { InboxMessageDelivered as InboxMessageDeliveredEvent } from "../../generated/Inbox/Inbox";
import { handleInboxMessageDelivered } from "../../src/bridge";

import { newMockEvent, test, assert, createMockedFunction } from "matchstick-as";
import { applyAlias } from "../../src/utils";

const RAW_ENTITY_TYPE = "RawMessage";
const RETRYABLE_ENTITY_TYPE = "Retryable";
const CLASSIC_RETRYABLE_ENTITY_TYPE = "ClassicRetryable";

const ETH_DEPOSIT_ENTITY_TYPE = "Deposit";
const FIRST_NITRO_BLOCK = 15447158;

const TEST_ADDRESS = Address.fromString("ffffffffffffffffffffffffffffffffffffff00");

const createNewMessage = (
  kind: string,
  messageNum: BigInt,
  data: Bytes,
  blockNumber: BigInt
): InboxMessageDeliveredEvent => {
  let mockEvent = newMockEvent();
  mockEvent.block.number = blockNumber;

  if (kind != RETRYABLE_ENTITY_TYPE && kind != ETH_DEPOSIT_ENTITY_TYPE)
    throw new Error("Currently only supports creating retryables and eth deposits");

  if (blockNumber.ge(BigInt.fromI32(FIRST_NITRO_BLOCK))) {
    let rawMessage = new RawMessage(messageNum.toHexString());
    rawMessage.kind = kind;
    rawMessage.sender = TEST_ADDRESS;
    rawMessage.save();
  } else {
    let rawMessage = new ClassicRawMessage(messageNum.toHexString());
    rawMessage.kind = kind;
    rawMessage.sender = TEST_ADDRESS;
    rawMessage.save();
  }

  let parameters = new Array<ethereum.EventParam>();
  let messageNumParam = new ethereum.EventParam(
    "messageNum",
    ethereum.Value.fromI32(messageNum.toI32())
  );
  let dataParam = new ethereum.EventParam("data", ethereum.Value.fromBytes(data));
  parameters.push(messageNumParam);
  parameters.push(dataParam);

  let newInboxEvent = new InboxMessageDeliveredEvent(
    mockEvent.address,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    parameters,
    mockEvent.receipt
  );

  return newInboxEvent;
};

test("Can mock and call function with different argument types", () => {
  let messageNum = BigInt.fromI32(1);
  // const tokenDepositData = Bytes.fromByteArray(Bytes.fromHexString("0x00000000000000000000000031d3fa5cb29e95eb50e8ad4031334871523e88f4000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000028f0815ec7670000000000000000000000000000000000000000000000000000000000012d00e28000000000000000000000000031d3fa5cb29e95eb50e8ad4031334871523e88f400000000000000000000000031d3fa5cb29e95eb50e8ad4031334871523e88f4000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"))
  const ethDeposit = Bytes.fromByteArray(
    Bytes.fromHexString(
      "0x00000000000000000000000097def9e0bd14fc70df700006e85babebfed271070000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000012d00e28000000000000000000000000097def9e0bd14fc70df700006e85babebfed2710700000000000000000000000097def9e0bd14fc70df700006e85babebfed27107000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
    )
  );
  let newInboxEvent1 = createNewMessage(
    "Retryable",
    messageNum,
    ethDeposit,
    BigInt.fromI32(FIRST_NITRO_BLOCK).plus(BigInt.fromI32(100))
  );
  handleInboxMessageDelivered(newInboxEvent1);

  // the raw message gets removed
  // assert.fieldEquals(RAW_ENTITY_TYPE, messageNum.toHexString(), "kind", "Retryable")
  assert.fieldEquals(
    RETRYABLE_ENTITY_TYPE,
    messageNum.toHexString(),
    "id",
    messageNum.toHexString()
  );
  assert.fieldEquals(RETRYABLE_ENTITY_TYPE, messageNum.toHexString(), "isEthDeposit", "true");

  // assert.fieldEquals()
  messageNum = messageNum.plus(BigInt.fromI32(1));
  const tokenDeposit2 = Bytes.fromByteArray(
    Bytes.fromHexString(
      "0x00000000000000000000000009E9222E96E7B4AE2A407B98D48E330053351EEE000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000009AAD636F364A000000000000000000000000000000000000000000000000000002925554B6F6000000000000000000000000ED6D1DA67D18DF09F42C50E2C4E86370F58A8D20000000000000000000000000ED6D1DA67D18DF09F42C50E2C4E86370F58A8D20000000000000000000000000000000000000000000000000000000000001C345000000000000000000000000000000000000000000000000000000005649AD4400000000000000000000000000000000000000000000000000000000000002E42E567B36000000000000000000000000090185F2135308BAD17527004364EBCC2D37E5F6000000000000000000000000ED6D1DA67D18DF09F42C50E2C4E86370F58A8D20000000000000000000000000ED6D1DA67D18DF09F42C50E2C4E86370F58A8D2000000000000000000000000000000000000000000006EED54A68D4D70AF55AB000000000000000000000000000000000000000000000000000000000000000A000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001A0000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000E0000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000B5370656C6C20546F6B656E0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000055350454C4C000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000000"
    )
  );
  let newInboxEvent2 = createNewMessage(
    "Retryable",
    messageNum,
    tokenDeposit2,
    BigInt.fromI32(FIRST_NITRO_BLOCK).minus(BigInt.fromI32(100))
  );
  handleInboxMessageDelivered(newInboxEvent2);

  assert.fieldEquals(
    CLASSIC_RETRYABLE_ENTITY_TYPE,
    messageNum.toHexString(),
    "id",
    messageNum.toHexString()
  );
  assert.fieldEquals(
    CLASSIC_RETRYABLE_ENTITY_TYPE,
    messageNum.toHexString(),
    "isEthDeposit",
    "false"
  );

  messageNum = messageNum.plus(BigInt.fromI32(1));
  const tokenDeposit = Bytes.fromByteArray(
    Bytes.fromHexString(
      "0x000000000000000000000000096760f208390250649e3e8763348e783aef5562000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000025564458834fa00000000000000000000000000000000000000000000000000000156d198a8360000000000000000000000002dd292297f6b1e84368d3683984f6da4c894eb3b0000000000000000000000002dd292297f6b1e84368d3683984f6da4c894eb3b000000000000000000000000000000000000000000000000000000000006b6ee0000000000000000000000000000000000000000000000000000000058c5212e00000000000000000000000000000000000000000000000000000000000001442e567b36000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000000000000000000002dd292297f6b1e84368d3683984f6da4c894eb3b0000000000000000000000002dd292297f6b1e84368d3683984f6da4c894eb3b00000000000000000000000000000000000000000000000000000001178bb88000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
    )
  );
  log.info("1", []);

  let newInboxEvent3 = createNewMessage(
    "Retryable",
    messageNum,
    tokenDeposit,
    BigInt.fromI32(FIRST_NITRO_BLOCK).plus(BigInt.fromI32(100))
  );
  handleInboxMessageDelivered(newInboxEvent3);
  assert.fieldEquals(
    RETRYABLE_ENTITY_TYPE,
    messageNum.toHexString(),
    "id",
    messageNum.toHexString()
  );
  assert.fieldEquals(RETRYABLE_ENTITY_TYPE, messageNum.toHexString(), "isEthDeposit", "false");

  let retrievedRetryable = Retryable.load(messageNum.toHexString());
  if (!retrievedRetryable) throw new Error("Null!");

  // can get values 2 different ways, with different typings
  // TODO: why is ethereum.Value different to Value
  let valGetter1 = retrievedRetryable.get("destAddr");
  if (!valGetter1) throw new Error("Null!!");

  let valGetter2 = retrievedRetryable.destAddr;
  if (!valGetter2) throw new Error("Null!!!");

  assert.equals(
    ethereum.Value.fromBytes(valGetter1.toBytes()),
    ethereum.Value.fromBytes(valGetter2)
  );

  // i love but i hate typing, there probably is a smarter way of doing this
  const expected = ethereum.Value.fromBytes(
    Bytes.fromByteArray(Address.fromHexString("0x096760f208390250649e3e8763348e783aef5562"))
  );
  assert.equals(expected, ethereum.Value.fromBytes(valGetter1.toBytes()));
});

test("Can properly decode Eth deposit message data", () => {
  // create mock event and run handler
  let messageNum = BigInt.fromI32(1);
  const msgData = Bytes.fromByteArray(
    Bytes.fromHexString(
      "7AC5E909E4DDDCE3B9ECB7D332F991AC037CB6DD000000000000000000000000000000000000000000000000058D15E176280000"
    )
  );

  let newInboxEvent = createNewMessage(
    ETH_DEPOSIT_ENTITY_TYPE,
    messageNum,
    msgData,
    BigInt.fromI32(FIRST_NITRO_BLOCK).plus(BigInt.fromI32(100))
  );
  handleInboxMessageDelivered(newInboxEvent);

  // check EthDeposit entity is properly created

  let id =
    newInboxEvent.transaction.hash.toHexString() + "-" + newInboxEvent.transaction.index.toString();
  assert.fieldEquals(ETH_DEPOSIT_ENTITY_TYPE, id, "id", id);
  assert.fieldEquals(
    ETH_DEPOSIT_ENTITY_TYPE,
    id,
    "sender",
    applyAlias(TEST_ADDRESS, true).toHexString()
  );
  assert.fieldEquals(
    ETH_DEPOSIT_ENTITY_TYPE,
    id,
    "receiver",
    "0x7AC5E909E4DDDCE3B9ECB7D332F991AC037CB6DD".toLowerCase()
  );
  assert.fieldEquals(ETH_DEPOSIT_ENTITY_TYPE, id, "value", "400000000000000000");

  //// test again, address starting with one leading zero
  messageNum = BigInt.fromI32(2);
  const msgDataAddrOneLeadingZero = Bytes.fromByteArray(
    Bytes.fromHexString(
      "08A9626DB08E83D2AFEC24523B727F50E362E4B8000000000000000000000000000000000000000000000000148A04289B940000"
    )
  );
  let eventAddrOneLeadingZero = createNewMessage(
    ETH_DEPOSIT_ENTITY_TYPE,
    messageNum,
    msgDataAddrOneLeadingZero,
    BigInt.fromI32(FIRST_NITRO_BLOCK).plus(BigInt.fromI32(100))
  );
  handleInboxMessageDelivered(eventAddrOneLeadingZero);

  id =
    eventAddrOneLeadingZero.transaction.hash.toHexString() +
    "-" +
    eventAddrOneLeadingZero.transaction.index.toString();
  assert.fieldEquals(ETH_DEPOSIT_ENTITY_TYPE, id, "id", id);
  assert.fieldEquals(
    ETH_DEPOSIT_ENTITY_TYPE,
    id,
    "sender",
    applyAlias(TEST_ADDRESS, true).toHexString()
  );
  assert.fieldEquals(
    ETH_DEPOSIT_ENTITY_TYPE,
    id,
    "receiver",
    "0x08A9626DB08E83D2AFEC24523B727F50E362E4B8".toLowerCase()
  );
  assert.fieldEquals(ETH_DEPOSIT_ENTITY_TYPE, id, "value", "1480000000000000000");

  //// test again, address starting with multiple leading zero
  messageNum = BigInt.fromI32(3);
  const msgDataAddrMultipleLeadingZero = Bytes.fromByteArray(
    Bytes.fromHexString(
      "000206732258D7511FA624127228E6A032718E62000000000000000000000000000000000000000000000000F9CCD8A1C5080000"
    )
  );
  let eventAddrMultipleLeadingZero = createNewMessage(
    ETH_DEPOSIT_ENTITY_TYPE,
    messageNum,
    msgDataAddrMultipleLeadingZero,
    BigInt.fromI32(FIRST_NITRO_BLOCK).plus(BigInt.fromI32(100))
  );
  handleInboxMessageDelivered(eventAddrMultipleLeadingZero);

  id =
    eventAddrMultipleLeadingZero.transaction.hash.toHexString() +
    "-" +
    eventAddrMultipleLeadingZero.transaction.index.toString();
  assert.fieldEquals(ETH_DEPOSIT_ENTITY_TYPE, id, "id", id);
  assert.fieldEquals(
    ETH_DEPOSIT_ENTITY_TYPE,
    id,
    "sender",
    applyAlias(TEST_ADDRESS, true).toHexString()
  );
  assert.fieldEquals(
    ETH_DEPOSIT_ENTITY_TYPE,
    id,
    "receiver",
    "0x000206732258D7511FA624127228E6A032718E62".toLowerCase()
  );
  assert.fieldEquals(ETH_DEPOSIT_ENTITY_TYPE, id, "value", "18000000000000000000");

  //// test again, address starting and ending with zeros
  messageNum = BigInt.fromI32(4);
  const msgDataStartEndZeros = Bytes.fromByteArray(
    Bytes.fromHexString(
      "000000000000000000000000F27208F05048CC80388C4EDFAA36BE458EB1E73F0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000057B52683E4780000000000000000000000000000000000000000000000000000000001E989A2D19000000000000000000000000F27208F05048CC80388C4EDFAA36BE458EB1E73F000000000000000000000000F27208F05048CC80388C4EDFAA36BE458EB1E73F000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
    )
  );
  let eventAddrStartEndZeros = createNewMessage(
    ETH_DEPOSIT_ENTITY_TYPE,
    messageNum,
    msgDataStartEndZeros,
    BigInt.fromI32(FIRST_NITRO_BLOCK).minus(BigInt.fromI32(100))
  );
  handleInboxMessageDelivered(eventAddrStartEndZeros);

  id =
    eventAddrStartEndZeros.transaction.hash.toHexString() +
    "-" +
    eventAddrStartEndZeros.transaction.index.toString();
  assert.fieldEquals(ETH_DEPOSIT_ENTITY_TYPE, id, "id", id);
  assert.fieldEquals(
    ETH_DEPOSIT_ENTITY_TYPE,
    id,
    "sender",
    applyAlias(TEST_ADDRESS, false).toHexString()
  );
  assert.fieldEquals(
    ETH_DEPOSIT_ENTITY_TYPE,
    id,
    "receiver",
    "0xf27208f05048cc80388c4edfaa36be458eb1e73f".toLowerCase()
  );
});

import { handleTicketCreated } from "../../src/mapping";
import {
  Address,
  BigInt,
  Bytes,
  ethereum,
  store,
  log,
} from "@graphprotocol/graph-ts";
import {
  newMockEvent,
  test,
  assert,
  createMockedFunction,
} from "matchstick-as";
import { TicketCreated as TicketCreatedEvent } from "../../generated/ClassicArbRetryableTx/ClassicArbRetryableTx";
import { L1ToL2Transaction } from "../../generated/schema";

const createEthDeposit = (): TicketCreatedEvent => {
  let mockEvent = newMockEvent();

  let parameters = new Array<ethereum.EventParam>();
  let userTxHash = new ethereum.EventParam(
    "userTxHash",
    ethereum.Value.fromBytes(
      Bytes.fromByteArray(
        Bytes.fromHexString(
          "0x55795cbae70c38e3b8ac26e0f9bd69bebe36e452f80eb624a1b5a6f9b97d8db1"
        )
      )
    )
  );
  parameters.push(userTxHash);

  let tx = mockEvent.transaction;
  tx.hash = Bytes.fromByteArray(
    Bytes.fromHexString(
      "0xf3976cd587d833873f508e7fb67f7cbaf8606a51f0eca25981d3f7bc93ff64d3"
    )
  );
  tx.input = Bytes.fromByteArray(
    Bytes.fromHexString(
      "0x679b6ded000000000000000000000000092d7963e38c41e482ae7ef6378f15fb8c3678a500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000294f7fc4e000000000000000000000000092d7963e38c41e482ae7ef6378f15fb8c3678a5000000000000000000000000092d7963e38c41e482ae7ef6378f15fb8c3678a50000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000"
    )
  );
  tx.from = Address.fromString("0x092d7963e38c41e482ae7ef6378f15fb8c3678a5");
  tx.value = BigInt.fromI64(270000000000000000);

  let newDeposit = new TicketCreatedEvent(
    mockEvent.address,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    tx,
    parameters,
    mockEvent.receipt
  );

  return newDeposit;
};

const createTokenDeposit = (): TicketCreatedEvent => {
  let mockEvent = newMockEvent();

  let parameters = new Array<ethereum.EventParam>();
  let userTxHash = new ethereum.EventParam(
    "userTxHash",
    ethereum.Value.fromBytes(
      Bytes.fromByteArray(
        Bytes.fromHexString(
          "0xdff1d27d56fd595e979061e707b0a4867d82f4c326031d060cc4ae5b51c476a6"
        )
      )
    )
  );
  parameters.push(userTxHash);

  let tx = mockEvent.transaction;
  tx.hash = Bytes.fromByteArray(
    Bytes.fromHexString(
      "0x003bcde82f7710122e52fed83d52a6dc70cbbed3d8a52c579d7d9b6f243d97e9"
    )
  );
  tx.input = Bytes.fromByteArray(
    Bytes.fromHexString(
      "0x679b6ded0000000000000000000000009b014455acc2fe90c52803849d0002aeec184a06000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010bad8dca0000000000000000000000000e0bff5a3e31fbc9bfcc229e4e8f15236dd37029f000000000000000000000000e0bff5a3e31fbc9bfcc229e4e8f15236dd37029f000000000000000000000000000000000000000000000000000000000007b7a300000000000000000000000000000000000000000000000000000000119b9690000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001442e567b36000000000000000000000000393fd5b96f6459511d7368778318c31d719720ad000000000000000000000000e0bff5a3e31fbc9bfcc229e4e8f15236dd37029f000000000000000000000000e0bff5a3e31fbc9bfcc229e4e8f15236dd37029f00000000000000000000000000000000000000000000003635c9adc5dea0000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
    )
  );
  tx.from = Address.fromString("0x917dc9a69f65dc3082d518192cd3725e1fa96ca2");
  tx.value = BigInt.fromI64(149478946024016);

  let newDeposit = new TicketCreatedEvent(
    mockEvent.address,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    tx,
    parameters,
    mockEvent.receipt
  );

  return newDeposit;
};

test("Can process eth deposit", () => {
  let newEthDeposit = createEthDeposit();
  handleTicketCreated(newEthDeposit);

  let entity = L1ToL2Transaction.load(newEthDeposit.transaction.hash.toHex());
  if (!entity) throw new Error("No entity found");

  assert.booleanEquals(entity.looksLikeEthDeposit, true);
  assert.bigIntEquals(entity.l2Callvalue, BigInt.zero());

  const expectedL2Calldata = "0x";
  assert.stringEquals(entity.l2Calldata.toHex(), expectedL2Calldata);
});

test("Can process token deposit", () => {
  let newTokenDeposit = createTokenDeposit();
  handleTicketCreated(newTokenDeposit);

  let entity = L1ToL2Transaction.load(newTokenDeposit.transaction.hash.toHex());
  if (!entity) throw new Error("No entity found");

  assert.booleanEquals(entity.looksLikeEthDeposit, false);
  assert.bigIntEquals(entity.l2Callvalue, BigInt.zero());

  const expectedL2Calldata =
    "0x2e567b36000000000000000000000000393fd5b96f6459511d7368778318c31d719720ad000000000000000000000000e0bff5a3e31fbc9bfcc229e4e8f15236dd37029f000000000000000000000000e0bff5a3e31fbc9bfcc229e4e8f15236dd37029f00000000000000000000000000000000000000000000003635c9adc5dea0000000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
  assert.stringEquals(entity.l2Calldata.toHex(), expectedL2Calldata);
});

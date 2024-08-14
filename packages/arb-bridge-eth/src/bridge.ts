import { InboxMessageDelivered as InboxMessageDeliveredEvent } from "../generated/Inbox/Inbox";
import {
  MessageDelivered as MessageDeliveredEvent,
  MessageDelivered1 as NitroMessageDeliveredEvent,
} from "../generated/Bridge/Bridge";
import {
  Retryable,
  RawMessage,
  Deposit,
  ClassicRawMessage,
  ClassicRetryable,
} from "../generated/schema";
import { Bytes, BigInt, ethereum, Address, log, store } from "@graphprotocol/graph-ts";
import {
  applyAlias,
  bigIntToId,
  getL2NitroRetryableTicketId,
  getL2RetryableTicketId,
  isArbOne,
  RetryableTx,
} from "./utils";
import { getOrCreateInbox } from "./bridgeUtils";

const ARB_ONE_INBOX_FIRST_NITRO_BLOCK = 15447158;

////////////////////// Bridge events

export function handleClassicMessageDelivered(event: MessageDeliveredEvent): void {
  handleMessageDelivered(event.params.messageIndex, event.params.kind, event.params.sender, true);
}

export function handleNitroMessageDelivered(event: NitroMessageDeliveredEvent): void {
  handleMessageDelivered(event.params.messageIndex, event.params.kind, event.params.sender, false);
}

function handleMessageDelivered(
  messageIndex: BigInt,
  messageKind: i32,
  sender: Address,
  isClassic: boolean
): void {
  const id = bigIntToId(messageIndex);

  let kind = "";
  if (messageKind == 9) {
    kind = "Retryable";
  } else if (messageKind == 12) {
    kind = "EthDeposit";
  } else {
    kind = "NotSupported";
  }

  if (isClassic) {
    let entity = new ClassicRawMessage(id);
    entity.kind = kind;
    entity.sender = sender;
    entity.save();
  } else {
    let entity = new RawMessage(id);
    entity.kind = kind;
    entity.sender = sender;
    entity.save();
  }
}

////////////////////// Inbox events

export function handleInboxMessageDelivered(event: InboxMessageDeliveredEvent): void {
  getOrCreateInbox(event.address);

  // TODO: handle `InboxMessageDeliveredFromOrigin(indexed uint256)`. Same as this function, but use event.tx.input instead of event data
  const id = bigIntToId(event.params.messageNum);

  let firstNitroBlock = 0;
  if (isArbOne()) {
    firstNitroBlock = ARB_ONE_INBOX_FIRST_NITRO_BLOCK;
  }

  /// handle Nitro
  if (event.block.number.ge(BigInt.fromI32(firstNitroBlock))) {
    let prevEntity = RawMessage.load(id);

    // this assumes that an entity was previously created since the MessageDelivered event is emitted before the inbox event
    if (!prevEntity) {
      log.critical("Wrong order in entity!!", []);
      throw new Error("Oh damn no entity wrong order");
    }

    ///in Nitro Eth deposit is different message type from retrayable
    if (prevEntity.kind == "EthDeposit") {
      handleNitroEthDeposit(event, prevEntity);
      return;
    }
    if (prevEntity.kind == "Retryable") {
      handleNitroRetryable(event, prevEntity);
      return;
    }
  } else {
    /// handle Classic
    let prevEntity = ClassicRawMessage.load(id);

    // this assumes that an entity was previously created since the MessageDelivered event is emitted before the inbox event
    if (!prevEntity) {
      log.critical("Wrong order in entity!!", []);
      throw new Error("Oh damn no entity wrong order");
    }

    //// in classic Eth deposit is retryable
    handleClassicRetryable(event, prevEntity);
    return;
  }

  log.info("Prev entity not a retryable nor ETH deposit, skipping. messageNum: {}", [
    event.params.messageNum.toHexString(),
  ]);
}

function handleNitroEthDeposit(event: InboxMessageDeliveredEvent, rawMessage: RawMessage): void {
  // we track deposits with EthDeposit entities
  let depositId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let entity = new Deposit(depositId);
  entity.type = "EthDeposit";

  // get sender from preceding MessageDelivered event. Sender is aliased so undo alias before storing address
  const address = Address.fromBytes(rawMessage.sender);
  const undoAliasAddress = applyAlias(address, true);
  entity.sender = undoAliasAddress;

  //// get destination address and eth value by parsing the data field

  // data consists of dest address 20 bytes + eth value 32 bytes (created by abi.encodePacked)
  // ethereum.decode requires full 32 byte words for decoding, so we need to add 12 bytes of 0s as prefix
  const completeData = new Bytes(64);
  const zeroBytesToFillPrefix = completeData.length - event.params.data.length;
  for (let i = 0; i < completeData.length; i++) {
    if (i < zeroBytesToFillPrefix) {
      completeData[i] = 0;
    } else {
      completeData[i] = event.params.data[i - zeroBytesToFillPrefix];
    }
  }

  // decode it and save to EthDeposit entity
  const decodedData = ethereum.decode("(address,uint256)", completeData);
  if (decodedData) {
    const decodedTuple = decodedData.toTuple();
    entity.receiver = decodedTuple[0].toAddress();
    entity.ethValue = decodedTuple[1].toBigInt();
  }
  entity.sequenceNumber = event.params.messageNum;
  entity.isClassic = false;
  entity.timestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash.toHexString();
  entity.blockCreatedAt = event.block.number;
  entity.save();

  // delete the old raw message
  const msgId = bigIntToId(event.params.messageNum);
  store.remove("RawMessage", msgId);
}

function handleNitroRetryable(event: InboxMessageDeliveredEvent, rawMessage: RawMessage): void {
  const id = bigIntToId(event.params.messageNum);
  const retryable = RetryableTx.parseRetryable(event.params.data);
  if (retryable) {
    let entity = new Retryable(id);
    // get sender from preceding MessageDelivered event. Sender is aliased so undo alias before storing address
    const messageSenderAddress = Address.fromBytes(rawMessage.sender);
    const undoAliasAddress = applyAlias(messageSenderAddress, true);
    entity.sender = undoAliasAddress;

    entity.value = retryable.l1CallValue;
    entity.isEthDeposit = retryable.dataLength == BigInt.zero();

    entity.retryableTicketID = getL2NitroRetryableTicketId(event, retryable, messageSenderAddress);
    entity.destAddr = retryable.destAddress;
    entity.l2Calldata = retryable.data;
    entity.l2Callvalue = retryable.l2CallValue;
    entity.timestamp = event.block.timestamp;
    entity.transactionHash = event.transaction.hash;
    entity.blockCreatedAt = event.block.number;
    entity.maxSubmissionCost = retryable.maxSubmissionCost;
    entity.save();
    // we delete the old raw message since now we saved the retryable
    store.remove("RawMessage", id);
  } else {
    log.error("Not able to parse tx with id {}", [id.toString()]);
  }
}

function handleClassicRetryable(
  event: InboxMessageDeliveredEvent,
  rawMessage: ClassicRawMessage
): void {
  const id = bigIntToId(event.params.messageNum);
  const retryable = RetryableTx.parseRetryable(event.params.data);

  if (retryable) {
    // if there is no calldata, this is Eth deposit
    if (retryable.dataLength == BigInt.zero()) {
      // we track deposits with EthDeposit entities
      let depositId =
        event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
      let deposit = new Deposit(depositId);
      deposit.type = "EthDeposit";

      // get sender from preceding MessageDelivered event. Sender is unaliased so apply alias to get original address before storing it
      const address = Address.fromBytes(rawMessage.sender);
      const applyAliasAddress = applyAlias(address, false);
      deposit.sender = applyAliasAddress;
      deposit.receiver = retryable.destAddress;
      deposit.ethValue = event.transaction.value;
      deposit.sequenceNumber = event.params.messageNum;
      deposit.isClassic = true;
      deposit.timestamp = event.block.timestamp;
      deposit.transactionHash = event.transaction.hash.toHexString();
      deposit.blockCreatedAt = event.block.number;
      deposit.save();
    }

    let entity = new ClassicRetryable(id);

    // get sender from preceding MessageDelivered event. Sender is unaliased so apply alias to get original address before storing it
    const address = Address.fromBytes(rawMessage.sender);
    const applyAliasAddress = applyAlias(address, false);
    entity.sender = applyAliasAddress;

    entity.value = event.transaction.value;
    entity.isEthDeposit = retryable.dataLength == BigInt.zero();
    entity.retryableTicketID = getL2RetryableTicketId(event.params.messageNum);
    entity.destAddr = retryable.destAddress;
    entity.l2Calldata = retryable.data;
    entity.l2Callvalue = retryable.l2CallValue;
    entity.timestamp = event.block.timestamp;
    entity.transactionHash = event.transaction.hash;
    entity.blockCreatedAt = event.block.number;
    entity.save();
    // we delete the old raw message since now we saved the retryable
    store.remove("ClassicRawMessage", id);
  } else {
    log.error("Not able to parse tx with id {}", [id.toString()]);
  }
}

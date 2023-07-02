import {
  Message
} from "../generated/schema"
import { Address, log } from "@graphprotocol/graph-ts";

export function handleMessageReceived(event: Message): void {
  // this ID is not the same as the outputId used on chain
  // const id = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  // let entity = new OutboxOutput(id);
  // entity.destAddr = event.params.destAddr;
  // entity.l2Sender = event.params.l2Sender;
  // entity.outboxEntry = bigIntToId(event.params.outboxEntryIndex);
  // entity.path = event.params.transactionIndex;
  // // if OutBoxTransactionExecuted was emitted then the OutboxOutput was spent
  // entity.spent = true;
  // entity.save();
  let entity = new Message(event.id)
  entity.destinationCaller = Address.fromBytes(event.destinationCaller)
  log.info('handleMessageReceived', [event.id])
  entity.save()
}
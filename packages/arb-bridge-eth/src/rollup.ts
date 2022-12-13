import {
  IRollupCoreNodeCreated as NodeCreatedEvent,
  IRollupCoreNodeConfirmed as NodeConfirmedEvent,
  IRollupCoreNodeRejected as NodeRejectedEvent,
} from "./interface/IRollupCore";
import { Node as NodeEntity } from "../generated/schema";
import { log } from "@graphprotocol/graph-ts";
import { bigIntToId } from "./utils";

export function handleNodeCreated(event: NodeCreatedEvent): void {
  const id = bigIntToId(event.params.nodeNum);
  let entity = new NodeEntity(id);
  entity.nodeHash = event.params.nodeHash;
  entity.inboxMaxCount = event.params.inboxMaxCount;
  entity.parentHash = event.params.parentNodeHash;
  entity.blockCreatedAt = event.block.number;
  entity.timestampCreated = event.block.timestamp;
  entity.timestampStatusUpdate = null;
  entity.status = "Pending";
  entity.afterSendCount = event.params.assertionIntFields[1][2];
  entity.save();
}

export function handleNodeConfirmed(event: NodeConfirmedEvent): void {
  const id = bigIntToId(event.params.nodeNum);
  // we just edit 1 field, we know the node is already created, so we just update its status
  // used to be faster to do a `new NodeEntity(id)` than load since it wouldn't overwrite other fields
  // but that doesn't seem to hold anymore
  let entity = NodeEntity.load(id);
  if (!entity) {
    log.critical("Should not confirm non-existent node", []);
    throw new Error("no node to confirm");
  }
  entity.timestampStatusUpdate = event.block.timestamp;
  entity.status = "Confirmed";

  if (entity.afterSendCount != event.params.afterSendCount) {
    log.critical("Something went wrong parsing the after send count", []);
    throw new Error("Wrong send cound");
  }

  entity.save();
}

export function handleNodeRejected(event: NodeRejectedEvent): void {
  const id = bigIntToId(event.params.nodeNum);
  // we just edit 1 field, we know the node is already created, so we just update its status
  // used to be faster to do a `new NodeEntity(id)` than load since it wouldn't overwrite other fields
  // but that doesn't seem to hold anymore
  let entity = NodeEntity.load(id);
  if (!entity) {
    log.critical("Should not reject non-existent node", []);
    throw new Error("no node to reject");
  }
  entity.timestampStatusUpdate = event.block.timestamp;
  entity.status = "Rejected";
  entity.save();
}

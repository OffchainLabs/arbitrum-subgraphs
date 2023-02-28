import { ethereum } from "@graphprotocol/graph-ts";
import { Block } from "../generated/schema";

export function handleBlock(block: ethereum.Block): void {
  let id = block.hash;
  let blockEntity = new Block(id);
  blockEntity.number = block.number;
  blockEntity.timestamp = block.timestamp;
  blockEntity.save();
}

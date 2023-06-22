import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { RollupCreated } from "../generated/RollupCreator/RollupCreator";
import { Rollup, RollupCreator } from "../generated/schema";

export function handleRollupCreated(event: RollupCreated): void {
  const rollupCreator = getOrCreateRollupCreator(event.address);
  rollupCreator.totalRollupsCreated = rollupCreator.totalRollupsCreated.plus(BigInt.fromI32(1));
  rollupCreator.save();

  const rollup = new Rollup(event.params.rollupAddress);
  rollup.inbox = event.params.inboxAddress;
  rollup.adminProxy = event.params.adminProxy;
  rollup.bridge = event.params.bridge;
  rollup.sequencerInbox = event.params.sequencerInbox;
  rollup.save();
}

function getOrCreateRollupCreator(rollupCreatorAddress: Address): RollupCreator {
  let rollupCreator = RollupCreator.load(rollupCreatorAddress);
  if (rollupCreator != null) {
    return rollupCreator as RollupCreator;
  }

  rollupCreator = new RollupCreator(rollupCreatorAddress);
  rollupCreator.totalRollupsCreated = BigInt.fromI32(0);
  return rollupCreator;
}

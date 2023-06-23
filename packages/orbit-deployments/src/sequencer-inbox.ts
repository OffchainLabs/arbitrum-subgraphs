import { Address, BigInt } from "@graphprotocol/graph-ts";
import { SequencerBatchDelivered as SequencerBatchDeliveredEvent } from "../generated/templates/SequencerInbox/SequencerInbox";
import { SequencerInbox as SequencerInboxContract } from "../generated/templates/SequencerInbox/SequencerInbox";
import { Rollup, RollupCreator } from "../generated/schema";

const ROLLUP_CREATOR = "0xcb6e6240682eba7b24c82c8a8fd1655b36c23f95";

export function handleSequencerBatchDelivered(event: SequencerBatchDeliveredEvent): void {
  const seqInboxContract = SequencerInboxContract.bind(event.address);
  const rollupAddress = seqInboxContract.rollup();

  // numOfBatches++
  const rollup = Rollup.load(rollupAddress) as Rollup;
  rollup.numOfBatches = rollup.numOfBatches.plus(BigInt.fromI32(1));
  rollup.save();

  if (rollup.numOfBatches.equals(BigInt.fromI32(2))) {
    const rollupCreator = RollupCreator.load(
      Address.fromHexString(ROLLUP_CREATOR)
    ) as RollupCreator;
    rollupCreator.totalRollupsWithPostedBatches = rollupCreator.totalRollupsWithPostedBatches.plus(
      BigInt.fromI32(1)
    );
    rollupCreator.save();
  }
}

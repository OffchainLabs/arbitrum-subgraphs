import { Address, BigInt } from "@graphprotocol/graph-ts";
import { RollupCreated as RollupCreatedEvent } from "../generated/RollupCreator/RollupCreator";
import { Rollup as RollupContract } from "../generated/RollupCreator/Rollup";
import { Rollup, RollupCreator } from "../generated/schema";
import { SequencerInbox } from "../generated/templates";

export function handleRollupCreated(event: RollupCreatedEvent): void {
  const rollupCreator = getOrCreateRollupCreator(event.address);
  rollupCreator.totalRollupsCreated = rollupCreator.totalRollupsCreated.plus(BigInt.fromI32(1));
  rollupCreator.save();

  const rollup = new Rollup(event.params.rollupAddress);
  rollup.inbox = event.params.inboxAddress;
  rollup.adminProxy = event.params.adminProxy;
  rollup.bridge = event.params.bridge;
  rollup.sequencerInbox = event.params.sequencerInbox;

  // fetch remaining info from contract
  const rollupContract = RollupContract.bind(Address.fromBytes(rollup.id));
  rollup.outbox = rollupContract.outbox();
  rollup.chainId = rollupContract.chainId();
  rollup.baseStake = rollupContract.baseStake();
  rollup.latestConfirmed = rollupContract.latestConfirmed();
  rollup.rollupDeploymentBlock = rollupContract.rollupDeploymentBlock();
  rollup.stakeToken = rollupContract.stakeToken();
  rollup.owner = rollupContract.owner();
  rollup.numOfBatches = BigInt.fromI32(0);

  rollup.save();

  startIndexingSequencerInbox(Address.fromBytes(rollup.sequencerInbox));
}

function getOrCreateRollupCreator(rollupCreatorAddress: Address): RollupCreator {
  let rollupCreator = RollupCreator.load(rollupCreatorAddress);
  if (rollupCreator != null) {
    return rollupCreator as RollupCreator;
  }

  rollupCreator = new RollupCreator(rollupCreatorAddress);
  rollupCreator.totalRollupsCreated = BigInt.fromI32(0);
  rollupCreator.totalRollupsWithPostedBatches = BigInt.fromI32(0);
  rollupCreator.save();

  return rollupCreator;
}

function startIndexingSequencerInbox(seqInbox: Address): void {
  SequencerInbox.create(seqInbox);
}

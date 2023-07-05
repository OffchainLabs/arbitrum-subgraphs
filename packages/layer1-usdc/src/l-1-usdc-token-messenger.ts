import { DepositForBurn as DepositForBurnEvent } from "../generated/L1USDCTokenMessenger/L1USDCTokenMessenger";
import { DepositForBurn } from "../generated/schema";

export function handleDepositForBurn(event: DepositForBurnEvent): void {
  let entity = new DepositForBurn(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.nonce = event.params.nonce;
  entity.burnToken = event.params.burnToken;
  entity.amount = event.params.amount;
  entity.depositor = event.params.depositor;
  entity.mintRecipient = event.params.mintRecipient;
  entity.destinationDomain = event.params.destinationDomain;
  entity.destinationTokenMessenger = event.params.destinationTokenMessenger;
  entity.destinationCaller = event.params.destinationCaller;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

import { GatewaySet as GatewaySetEvent, TxToL1 } from "../generated/L2GatewayRouter/L2GatewayRouter";
import { L2ToL1Transaction as L2ToL1TransactionEvent } from "../generated/ArbSys/ArbSys";
import { TicketCreated as TicketCreatedEvent } from "../generated/ArbRetryableTx/ArbRetryableTx";
import { L2ArbitrumGateway } from "../generated/templates"
import { 
  WithdrawalInitiated as WithdrawalInitiatedEvent,
  DepositFinalized as DepositFinalizedEvent,
} from "../generated/templates/L2ArbitrumGateway/L2ArbitrumGateway"
import { Gateway, L2ToL1Transaction, Token, TokenGatewayJoinTable, Withdrawal, L1ToL2Transaction } from "../generated/schema";
import { Address, BigInt, ethereum, Bytes, log } from "@graphprotocol/graph-ts";

export const DISABLED_GATEWAY_ADDR = Address.fromString("0x0000000000000000000000000000000000000001");
const bigIntToId = (input: BigInt): string => input.toHexString()

export const addressToId = (input: Address): string =>
  input.toHexString().toLowerCase();

export const getJoinId = (gatewayId: string, tokenId: string): string =>
  gatewayId.concat(tokenId)

export function handleGatewaySet(event: GatewaySetEvent): void {
  const gatewayId = addressToId(event.params.gateway);
  const tokenId = addressToId(event.params.l1Token);
  const joinId = getJoinId(gatewayId, tokenId)

  if (event.params.gateway == Address.zero()) {
    // TODO: handle gateways being deleted
    return;
  }
  // TODO: should we always create instead of load? should be faster.
  let gatewayEntity = Gateway.load(gatewayId);
  if(gatewayEntity == null) {
    gatewayEntity = new Gateway(gatewayId);
    gatewayEntity.save();
    // we want to track every new arbitrum gateway
    // so we initialize a Data Source Template
    L2ArbitrumGateway.create(event.params.gateway)
  }

  let tokenEntity = Token.load(tokenId);
  if(tokenEntity == null) {
    tokenEntity = new Token(tokenId);
    // TODO: query gateway for L2 address
    // tokenEntity.l2Address = null;
    tokenEntity.save();
  }

  let joinEntity = new TokenGatewayJoinTable(joinId);
  joinEntity.gateway = gatewayId;
  joinEntity.token = tokenId;
  joinEntity.blockNum = event.block.number
  joinEntity.save();
}

export function handleWithdrawal(event: WithdrawalInitiatedEvent): void {
  const withdrawalId = bigIntToId(event.params._l2ToL1Id)
  const withdrawal = new Withdrawal(withdrawalId)

  withdrawal.l2BlockNum = event.block.number
  withdrawal.from = event.params._from
  withdrawal.to = event.params._to
  withdrawal.amount = event.params._amount
  withdrawal.exitNum = event.params._exitNum

  const gatewayId = addressToId(event.address)
  const tokenId = addressToId(event.params.l1Token)
  withdrawal.exitInfo = getJoinId(gatewayId, tokenId)
  withdrawal.l2ToL1Event = withdrawalId

  withdrawal.save()
}

export function handleDeposit(event: DepositFinalizedEvent): void {
  // TODO: add deposit support
  // TODO: add deposit event handler for template data source that tracks withdrawals

  // Right now this method is mimic'ing the GatewaySet handler to cover for permissionless token bridging
  // currently #Hacky but works. can be cleaned up with a bigger refactor
  // this only tracks deposits from the standard gateway for now
  // this is used since we don't "GatewaySet" for the permissionless bridging

  const gatewayAddr = event.transaction.to;

  if(!gatewayAddr) {
    // shouldn't happen, but lets make the compiler happy
    return;
  }

  const gatewayId = addressToId(gatewayAddr);
  const tokenId = addressToId(event.params.l1Token);
  const joinId = getJoinId(gatewayId, tokenId)

  // TODO: should we always create instead of load? should be faster.
  // the issue here is if creating again on subsequent deposits. would that break FKs? 
  let gatewayEntity = Gateway.load(gatewayId);
  if(gatewayEntity == null) {
    gatewayEntity = new Gateway(gatewayId);
    gatewayEntity.save();
    // we don't start a new data source template, since this is not dynamic
  }

  let tokenEntity = Token.load(tokenId);
  if(tokenEntity == null) {
    tokenEntity = new Token(tokenId);
    // TODO: query gateway for L2 address
    // tokenEntity.l2Address = null;
    tokenEntity.save();
  }

  let joinEntity = TokenGatewayJoinTable.load(joinId);
  if(joinEntity == null) {
    joinEntity = new TokenGatewayJoinTable(joinId);
    joinEntity.gateway = gatewayId;
    joinEntity.token = tokenId;
    // if there is no gateway registered yet, then this was std bridged token since GatewaySet wasn't emitted first
    joinEntity.blockNum = event.block.number
    joinEntity.save();
  }
}

export function handleTicketCreated(event: TicketCreatedEvent): void {
  // this event is only emitted once per L1 to L2 ticket and only once in a tx
  const id = event.transaction.hash.toHex()
  let entity = new L1ToL2Transaction(id)

  entity.from = event.transaction.from

  entity.userTxHash = event.params.userTxHash

  // parse the tx input
  // funcSignature:
  //    createRetryableTicket(address,uint256,uint256,address,address,uint256,uint256,bytes)	
  // we want to skip the `0x679b6ded` at the start and parse the bytes length instead of the bytes explicitly
  const inputWithoutSelector = Bytes.fromUint8Array(event.transaction.input.slice(4))
  const parsedWithoutData = ethereum.decode(
    "(address,uint256,uint256,address,address,uint256,uint256,uint256,uint256)",
    inputWithoutSelector
  );
  
  if (!parsedWithoutData) {
    log.critical("didn't expect !parsedWithoutData", [])
    throw new Error("somethin bad happened")
  }

  const parsedArray = parsedWithoutData.toTuple();

  const destAddr = parsedArray[0].toAddress()
  const l2CallValue = parsedArray[1].toBigInt()
  const maxSubmissionCost = parsedArray[2].toBigInt()
  const excessFeeRefundAddress = parsedArray[3].toAddress()
  const callValueRefundAddress = parsedArray[4].toAddress()
  const maxGas = parsedArray[5].toBigInt()
  const gasPriceBid = parsedArray[6].toBigInt()

  // this is due to how dynamic length data types are encoded
  const lengthOfDataLength = parsedArray[7].toBigInt()
  if(lengthOfDataLength != BigInt.fromI32(256)) {
    log.critical("something unexpected went wrong with lengthOfDataLength {}", [lengthOfDataLength.toString()])
    throw new Error("oh damn somethin broke")
  }

  const dataLength = parsedArray[8].toBigInt()
  log.debug("lengthOfDataLength expected: {}", [lengthOfDataLength.toString()])
  log.debug("data length expected: {}", [dataLength.toString()])

  log.debug("input length {}", [inputWithoutSelector.length.toString()])

  // we do this because the graph seems weird when parsing dynamic length data types
  // can maybe be fixed if we don't parse it as `toTuple`
  // https://ethereum.stackexchange.com/questions/114582/the-graph-nodes-cant-decode-abi-encoded-data-containing-arrays
  const sliceStart = ethereum.encode(parsedWithoutData)!.byteLength
  if(!sliceStart) {
    throw new Error("oh damn somethin broke")
  }

  log.debug("expect slice to start at {}", [sliceStart.toString()])
  const l2Calldata = Bytes.fromByteArray(
    Bytes.fromUint8Array(
      inputWithoutSelector.slice(
        sliceStart, sliceStart + dataLength.toI32()
      )
    )
  )

  // we identify if the retryable was created as in the `depositEth` method in the inbox
  // https://github.com/OffchainLabs/arbitrum/blob/98d33a5e92de47de97aec857c7fd92eb63db543e/packages/arb-bridge-eth/contracts/bridge/Inbox.sol#L253-L261
  const looksLikeEthDeposit =
    destAddr.equals(entity.from)
    && l2CallValue.equals(BigInt.zero())
    && event.transaction.value.gt(BigInt.zero())
    && excessFeeRefundAddress.equals(entity.from)
    && callValueRefundAddress.equals(entity.from)
    && maxGas.equals(BigInt.zero())
    && gasPriceBid.equals(BigInt.zero())
    && dataLength.equals(BigInt.zero())

  entity.looksLikeEthDeposit = looksLikeEthDeposit
  entity.ethDepositAmount = event.transaction.value.minus(l2CallValue)
  entity.l2Callvalue = l2CallValue
  entity.l2Calldata = l2Calldata
  
  entity.save();
}


export function handleL2ToL1Transaction(event: L2ToL1TransactionEvent): void {
  const id = bigIntToId(event.params.uniqueId)
  let entity = new L2ToL1Transaction(id);
  entity.caller = event.params.caller;
  entity.destination = event.params.destination;
  entity.batchNumber = event.params.batchNumber;
  entity.indexInBatch = event.params.indexInBatch;
  entity.arbBlockNum = event.params.arbBlockNum;
  entity.ethBlockNum = event.params.ethBlockNum;
  entity.timestamp = event.params.timestamp;
  entity.callvalue = event.params.callvalue;
  entity.data = event.params.data;
  entity.withdrawal = id

  const looksLikeEthWithdrawal =
    event.params.callvalue.gt(BigInt.zero())
    && event.params.data.equals(Bytes.empty())
  
  entity.looksLikeEthWithdrawal = looksLikeEthWithdrawal;
  entity.l2TxHash = event.transaction.hash;

  // TODO: query for L2 to L1 tx proof
  // TODO: don't make this an archive query
  // this will either be the proof or null
  // if not null, backfill previous ones that were null

  entity.save();
}

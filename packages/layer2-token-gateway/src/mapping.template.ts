import { GatewaySet as GatewaySetEvent, TxToL1 } from "../generated/L2GatewayRouter/L2GatewayRouter";
import { L2ToL1Transaction as ClassicL2ToL1TransactionEvent } from "../generated/ClassicArbSys/ClassicArbSys";
import { L2ToL1Tx as NitroL2ToL1TxEvent } from "../generated/NitroArbSys/NitroArbSys";
import { TicketCreated as NitroTicketCreatedEvent } from "../generated/NitroArbRetryableTx/NitroArbRetryableTx";
import { L2ArbitrumGateway } from "../generated/templates"
import { 
  WithdrawalInitiated as WithdrawalInitiatedEvent,
  DepositFinalized as DepositFinalizedEvent,
} from "../generated/templates/L2ArbitrumGateway/L2ArbitrumGateway"
import { Gateway, L2ToL1Transaction, Token, TokenGatewayJoinTable, GatewayWithdrawalData, L1ToL2Transaction } from "../generated/schema";
import { Address, BigInt, ethereum, Bytes, log } from "@graphprotocol/graph-ts";

export const DISABLED_GATEWAY_ADDR = Address.fromString("0x0000000000000000000000000000000000000001");
const bigIntToId = (input: BigInt): string => input.toHexString()

export const addressToId = (input: Address): string =>
  input.toHexString().toLowerCase();

export const getJoinId = (gatewayId: string, tokenId: string): string =>
  gatewayId.concat(tokenId)


const createTokenGatewayPair = (l2Gateway: Address, l1Token: Address, block: ethereum.Block): void => {
  const gatewayId = addressToId(l2Gateway);
  const tokenId = addressToId(l1Token);
  const joinId = getJoinId(gatewayId, tokenId)

  // TODO: should we always create instead of load? should be faster.
  // the issue here is if creating again on subsequent deposits. would that break FKs? 
  let gatewayEntity = Gateway.load(gatewayId);
  // we use moustache to template this value in (as used in the subgraph manifest template)
  const isL2StdGateway = l2Gateway.toString().toLowerCase() == "{{{ l2StandardGateway }}}".toLowerCase()
  if(!isL2StdGateway && gatewayEntity == null) {
    gatewayEntity = new Gateway(gatewayId);
    gatewayEntity.save();
    // we want to track every new arbitrum gateway
    // so we initialize a Data Source Template
    L2ArbitrumGateway.create(l2Gateway)
  }

  let tokenEntity = Token.load(tokenId);
  if(tokenEntity == null) {
    tokenEntity = new Token(tokenId);
    tokenEntity.save();
  }

  let joinEntity = new TokenGatewayJoinTable(joinId);
  joinEntity.gateway = gatewayId;
  joinEntity.token = tokenId;
  joinEntity.blockNum = block.number
  joinEntity.save();
}

export function handleGatewaySet(event: GatewaySetEvent): void {
  // this event is not triggered for the default standard gateway, so we instead declare that bridge on the subgraph manifest separately

  if (event.params.gateway == Address.zero()) {
    // TODO: handle gateways being deleted
    return;
  }
  createTokenGatewayPair(event.params.gateway, event.params.l1Token, event.block)
  
}

export function handleWithdrawal(event: WithdrawalInitiatedEvent): void {
  const withdrawalId = bigIntToId(event.params._l2ToL1Id)
  const withdrawal = new GatewayWithdrawalData(withdrawalId)

  withdrawal.from = event.params._from
  withdrawal.to = event.params._to
  withdrawal.amount = event.params._amount
  withdrawal.exitNum = event.params._exitNum
  withdrawal.l2ToL1Event = withdrawalId

  const gatewayId = addressToId(event.address)
  const tokenId = addressToId(event.params.l1Token)
  withdrawal.tokenGatewayJoin = getJoinId(gatewayId, tokenId)

  withdrawal.save()
}

export function handleDeposit(event: DepositFinalizedEvent): void {
  // TODO: add deposit event handler for template data source that tracks withdrawals

  const gatewayAddr = event.address;

  const gatewayId = addressToId(gatewayAddr);
  const tokenId = addressToId(event.params.l1Token);
  const joinId = getJoinId(gatewayId, tokenId)

  let joinEntity = TokenGatewayJoinTable.load(joinId);
  if(joinEntity == null) {
    // the first deposit to an unrecognised pair is equivalent to a `GatewaySet` to handle the default gateway
    // TODO: check the dest address is actually the expected standard gateway when this happens
    // if there is no gateway registered yet, then this was std bridged token since GatewaySet wasn't emitted first
    joinEntity = new TokenGatewayJoinTable(joinId);
    createTokenGatewayPair(gatewayAddr, event.params.l1Token, event.block)
  }
}

export function handleTicketCreated(event: NitroTicketCreatedEvent): void {
  // would be better to check the mix digest or extra data, but they arent exposed in the subgraph
  const ZERO_HASH = "0x0000000000000000000000000000000000000000000000000000000000000000"
  const isNitro = event.block.stateRoot.toHexString() == ZERO_HASH

  if(isNitro) handleNitroTicketCreated(event)
  else handleClassicTicketCreated(event)
}


// exported so it can be used in testing
export function handleNitroTicketCreated(event: NitroTicketCreatedEvent): void {
    // this event is only emitted once per L1 to L2 ticket and only once in a tx
    const id = event.transaction.hash.toHex()
    let entity = new L1ToL2Transaction(id)
  
    entity.isClassic = false
    entity.from = event.transaction.from
  
    // this is set on the follow up RedeemScheduled
    // we don't currently have a good way of looking up if the tx was successful
    entity.userTxHash = null
}

// exported so it can be used in testing
export function handleClassicTicketCreated(event: NitroTicketCreatedEvent): void {
  // Nitro and Classic ticket creation events are backward compatible

  // TODO: should we skip this if in nitro? it has the same signature

  // this event is only emitted once per L1 to L2 ticket and only once in a tx
  const id = event.transaction.hash.toHex()
  let entity = new L1ToL2Transaction(id)

  entity.isClassic = true
  entity.from = event.transaction.from

  entity.userTxHash = event.params.ticketId

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


export function handleNitroL2ToL1Transaction(event: NitroL2ToL1TxEvent): void {
  // const id = bigIntToId(event.params.position)
  // let entity = new L2ToL1Transaction(id);
  // entity.isClassic = true;
}

export function handleClassicL2ToL1Transaction(event: ClassicL2ToL1TransactionEvent): void {
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
  entity.isClassic = true;

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

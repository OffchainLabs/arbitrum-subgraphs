import {
  Address,
  Bytes,
  ethereum,
  log,
  BigInt,
} from "@graphprotocol/graph-ts";
import { TicketCreated as NitroTicketCreatedEvent } from "../generated/NitroArbRetryableTx/NitroArbRetryableTx";

class RetryableInput {
  constructor(
  public deposit: BigInt,
  public l2Callvalue: BigInt,
  public l2Calldata: Bytes,
  public l2To: Address,
  ) {}
}

export const parseRetryableInput = (
  event: ethereum.Event
): RetryableInput => {
  const funcSig = Bytes.fromUint8Array(event.transaction.input.slice(0, 4));

  if (funcSig.equals(Bytes.fromHexString("0xc9f95d32"))) {
    // parsing fields from
    //   function submitRetryable(
    //     bytes32 requestId,
    //     uint256 l1BaseFee,
    //     uint256 deposit,
    //     uint256 callvalue,
    //     uint256 gasFeeCap,
    //     uint64 gasLimit,
    //     uint256 maxSubmissionFee,
    //     address feeRefundAddress,
    //     address beneficiary,
    //     address retryTo,
    //     bytes calldata retryData
    // ) external;
    const inputWithoutSelector = Bytes.fromUint8Array(
      event.transaction.input.slice(4)
    );
    // TODO: what if we decode one at a time instead of decoding the tuple
    const parsedWithoutData = ethereum.decode(
      "(bytes32,uint256,uint256,uint256,uint256,uint64,uint256,address,address,address,uint256,uint256)",
      inputWithoutSelector
    );
    if (!parsedWithoutData) {
      log.error("didn't expect !parsedWithoutData", []);
      throw new Error("goddamn");
    }
    const parsedArray = parsedWithoutData.toTuple();

    const deposit = parsedArray[2].toBigInt();
    const l2Callvalue = parsedArray[3].toBigInt();
    const l2To = parsedArray[9].toAddress();

    // TODO: DRY up logic used here and classic (ie abi decoding the input data)
    //   const lengthOfDataLength = parsedArray[10].toBigInt()
    const dataLength = parsedArray[11].toBigInt();

    const sliceStart = ethereum.encode(parsedWithoutData)!.byteLength;
    if (!sliceStart) {
      // throw new Error("oh damn somethin broke")
      log.error("ah damn no encoding of start", []);
      throw new Error("goddamn2");
    }

    log.debug("expect slice to start at {}", [sliceStart.toString()]);
    const l2Calldata = Bytes.fromByteArray(
      Bytes.fromUint8Array(
        inputWithoutSelector.slice(sliceStart, sliceStart + dataLength.toI32())
      )
    );

    return new RetryableInput(deposit, l2Callvalue, l2Calldata, l2To)
  } else if (funcSig.equals(Bytes.fromHexString("0x679b6ded"))) {
    // parsing fields from classic
    //   function createRetryableTicket(
    //     address destAddr,
    //     uint256 l2CallValue,
    //     uint256 maxSubmissionCost,
    //     address excessFeeRefundAddress,
    //     address callValueRefundAddress,
    //     uint256 maxGas,
    //     uint256 gasPriceBid,
    //     bytes calldata data
    // ) external payable;

    // we want to skip the `0x679b6ded` at the start and parse the bytes length instead of the bytes explicitly
    const inputWithoutSelector = Bytes.fromUint8Array(
      event.transaction.input.slice(4)
    );
    const parsedWithoutData = ethereum.decode(
      "(address,uint256,uint256,address,address,uint256,uint256,uint256,uint256)",
      inputWithoutSelector
    );

    if (!parsedWithoutData) {
      log.critical("didn't expect !parsedWithoutData", []);
      throw new Error("somethin bad happened");
    }

    const parsedArray = parsedWithoutData.toTuple();

    const l2Callvalue = parsedArray[1].toBigInt();
    const deposit = event.transaction.value;

    // this is due to how dynamic length data types are encoded
    const lengthOfDataLength = parsedArray[7].toBigInt();
    if (lengthOfDataLength != BigInt.fromI32(256)) {
      log.critical(
        "something unexpected went wrong with lengthOfDataLength {}",
        [lengthOfDataLength.toString()]
      );
      throw new Error("oh damn somethin broke");
    }

    const dataLength = parsedArray[8].toBigInt();
    log.debug("lengthOfDataLength expected: {}", [
      lengthOfDataLength.toString(),
    ]);
    log.debug("data length expected: {}", [dataLength.toString()]);

    log.debug("input length {}", [inputWithoutSelector.length.toString()]);

    // we do this because the graph seems weird when parsing dynamic length data types
    // can maybe be fixed if we don't parse it as `toTuple`
    // https://ethereum.stackexchange.com/questions/114582/the-graph-nodes-cant-decode-abi-encoded-data-containing-arrays
    const sliceStart = ethereum.encode(parsedWithoutData)!.byteLength;
    if (!sliceStart) {
      // throw new Error("oh damn somethin broke")
      log.critical("something broke", []);
      throw new Error("oh damn somethin broke 2");
    }

    log.debug("expect slice to start at {}", [sliceStart.toString()]);
    const l2Calldata = Bytes.fromByteArray(
      Bytes.fromUint8Array(
        inputWithoutSelector.slice(sliceStart, sliceStart + dataLength.toI32())
      )
    );

    const l2To = event.transaction.to;
    if(!l2To) {
      log.error("not expected null to since this isn't contract deploy", [])
      throw new Error("not expected null to since this isn't contract deploy")
    }
    
    return new RetryableInput(deposit, l2Callvalue, l2Calldata, l2To)
  } else {
    log.error("not recorgnized retryable input", []);
    throw new Error("Not recognised input");
  }
};

// export class CreateRetryableTicketInputFields {
//   public deposit: BigInt;
//   public l2Callvalue: BigInt;
//   public l2Calldata: Bytes;
//   public l2To: Address;

//   constructor(tx: ethereum.Transaction) {

//   }
// }

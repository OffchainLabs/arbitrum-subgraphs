import { Address, Bytes, ethereum, log, BigInt } from "@graphprotocol/graph-ts";

export class SubmitRetryableInputFields {
  public deposit: BigInt;
  public l2Callvalue: BigInt;
  public l2Calldata: Bytes;
  public l2To: Address;

  constructor(tx: ethereum.Transaction) {
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

    // TODO: check correct function signature
    const inputWithoutSelector = Bytes.fromUint8Array(tx.input.slice(4));
    const parsedWithoutData = ethereum.decode(
      "(bytes32,uint256,uint256,uint256,uint256,uint64,uint256,address,address,address,uint256,uint256)",
      inputWithoutSelector
    );
    if (!parsedWithoutData) {
      log.error("didn't expect !parsedWithoutData", []);
      throw new Error("goddamn");
    }
    const parsedArray = parsedWithoutData.toTuple();

    this.deposit = parsedArray[2].toBigInt();
    this.l2Callvalue = parsedArray[3].toBigInt();
    this.l2To = parsedArray[9].toAddress();

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
    this.l2Calldata = Bytes.fromByteArray(
      Bytes.fromUint8Array(
        inputWithoutSelector.slice(sliceStart, sliceStart + dataLength.toI32())
      )
    );
  }
}

export class CreateRetryableTicketInputFields {
  public deposit: BigInt;
  public l2Callvalue: BigInt;
  public l2Calldata: Bytes;
  public l2To: Address;

  constructor(tx: ethereum.Transaction) {
    // parsing fields from
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

    // TODO: check correct function signature
    // we want to skip the `0x679b6ded` at the start and parse the bytes length instead of the bytes explicitly
    const inputWithoutSelector = Bytes.fromUint8Array(tx.input.slice(4));
    const parsedWithoutData = ethereum.decode(
      "(address,uint256,uint256,address,address,uint256,uint256,uint256,uint256)",
      inputWithoutSelector
    );

    if (!parsedWithoutData) {
      log.critical("didn't expect !parsedWithoutData", []);
      throw new Error("somethin bad happened");
    }

    const parsedArray = parsedWithoutData.toTuple();

    this.l2Callvalue = parsedArray[1].toBigInt();
    this.deposit = tx.value

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
    this.l2Calldata = Bytes.fromByteArray(
      Bytes.fromUint8Array(
        inputWithoutSelector.slice(sliceStart, sliceStart + dataLength.toI32())
      )
    );
  }
}

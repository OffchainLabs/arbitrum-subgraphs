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
    const inputWithoutSelector = Bytes.fromUint8Array(tx.input.slice(4))
    const parsedWithoutData = ethereum.decode(
      "(bytes32,uint256,uint256,uint256,uint256,uint64,uint256,address,address,address,uint256,uint256)",
      inputWithoutSelector
    );
    if (!parsedWithoutData) {
      log.error("didn't expect !parsedWithoutData", [])
      throw new Error("goddamn")
    }
    const parsedArray = parsedWithoutData.toTuple();
  
  
    this.deposit = parsedArray[2].toBigInt()
    this.l2Callvalue = parsedArray[3].toBigInt()
    this.l2To = parsedArray[9].toAddress()
    
  
    // TODO: DRY up logic used here and classic (ie abi decoding the input data)
    //   const lengthOfDataLength = parsedArray[10].toBigInt()
      const dataLength = parsedArray[11].toBigInt()
  
      const sliceStart = ethereum.encode(parsedWithoutData)!.byteLength
      if(!sliceStart) {
        // throw new Error("oh damn somethin broke")
        log.error("ah damn no encoding of start", [])
        throw new Error("goddamn2")
      }
    
      log.debug("expect slice to start at {}", [sliceStart.toString()])
      this.l2Calldata = Bytes.fromByteArray(
        Bytes.fromUint8Array(
          inputWithoutSelector.slice(
            sliceStart, sliceStart + dataLength.toI32()
          )
        )
      )
    }
  }


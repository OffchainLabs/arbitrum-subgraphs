import {
  Bytes,
  BigInt,
  ethereum,
  Address,
  log,
  dataSource,
  crypto,
  ByteArray,
} from "@graphprotocol/graph-ts";
import { encodePadded, padBytes } from "@arbitrum/subgraph-common";

export const getL2ChainId = (): Bytes => {
  const network = dataSource.network();
  if (network == "mainnet") return Bytes.fromByteArray(Bytes.fromHexString("0xa4b1"));
  if (network == "rinkeby") return Bytes.fromByteArray(Bytes.fromHexString("0x066EEB"));
  if (network == "goerli") return Bytes.fromByteArray(Bytes.fromHexString("0x066eed"));

  log.critical("No chain id recognised", []);
  throw new Error("No chain id found");
};

export const bitFlip = (input: BigInt): Bytes => {
  // base hex string is all zeroes, with the highest bit set. equivalent to 1 << 255
  const base = Bytes.fromHexString(
    "0x8000000000000000000000000000000000000000000000000000000000000000"
  );
  const bytes = padBytes(Bytes.fromBigInt(input), 32);

  for (let i: i32 = 0; i < base.byteLength; i++) {
    base[i] = base[i] | bytes[i];
  }

  return Bytes.fromByteArray(base);
};

export const getL2RetryableTicketId = (inboxSequenceNumber: BigInt): Bytes => {
  // keccak256(zeroPad(l2ChainId), zeroPad(bitFlipedinboxSequenceNumber))
  const l2ChainId = getL2ChainId();
  const flipped = bitFlip(inboxSequenceNumber);
  const encoded: ByteArray = encodePadded(l2ChainId, flipped);
  const res = Bytes.fromByteArray(crypto.keccak256(encoded));

  // log.info(
  //   "Getting Retryable ticket Id. l2Chain id {} . inboxSeq {} . flipped {} . encoded {} . retTicketId {}",
  //   [
  //     l2ChainId.toHexString(),
  //     inboxSequenceNumber.toHexString(),
  //     flipped.toHexString(),
  //     encoded.toHexString(),
  //     res.toHexString(),
  //   ]
  // );

  return res;
};

export const bigIntToId = (input: BigInt): string => input.toHexString();

export const bigIntToAddress = (input: BigInt): Address => {
  // remove the prepended 0x
  const hexString = input.toHexString().substr(2);
  // add missing padding so address is 20 bytes long
  const missingZeroes = "0".repeat(40 - hexString.length);
  // build hexstring again
  const addressString = "0x" + missingZeroes + hexString;
  return Address.fromString(addressString);
};

export class RetryableTx {
  private constructor(
    public destAddress: Address,
    public l2CallValue: BigInt,
    public l1CallValue: BigInt,
    public maxSubmissionCost: BigInt,
    public excessFeeRefundAddress: Address,
    public callValueRefundAddress: Address,
    public maxGas: BigInt,
    public gasPriceBid: BigInt,
    public dataLength: BigInt,
    public data: Bytes
  ) {}

  static parseRetryable(data: Bytes): RetryableTx | null {
    const parsedWithoutData = ethereum.decode(
      "(uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256)",
      data
    );
    if (parsedWithoutData) {
      const parsedArray = parsedWithoutData.toTuple();
      const dataLength = parsedArray[8].toBigInt().toI32();
      const l2Calldata = new Bytes(dataLength);

      for (let i = 0; i < dataLength; i++) {
        l2Calldata[dataLength - i - 1] = data[data.length - i - 1];
      }

      return new RetryableTx(
        bigIntToAddress(parsedArray[0].toBigInt()),
        parsedArray[1].toBigInt(),
        parsedArray[2].toBigInt(),
        parsedArray[3].toBigInt(),
        bigIntToAddress(parsedArray[4].toBigInt()),
        bigIntToAddress(parsedArray[5].toBigInt()),
        parsedArray[6].toBigInt(),
        parsedArray[7].toBigInt(),
        BigInt.fromI32(dataLength),
        l2Calldata
      );
    }

    return null;
  }
}

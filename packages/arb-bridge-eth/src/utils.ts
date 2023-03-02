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
import { getBytes, rlpEncodeList } from "./rlp";
import { InboxMessageDelivered as InboxMessageDeliveredEvent } from "../generated/Inbox/Inbox";
import { Inbox } from "../generated/schema";

const NOVA_INBOX_ADDRESS = "0xc4448b71118c9071bcb9734a0eac55d18a153949";
const ADDRESS_ALIAS_OFFSET = "0x1111000000000000000000000000000000001111";

export function isArbOne(): boolean {
  const l2ChainId = getL2ChainId();
  const arbId = Bytes.fromByteArray(Bytes.fromHexString("0xa4b1"));
  return l2ChainId == arbId;
}

export const getL2ChainId = (): Bytes => {
  const network = dataSource.network();
  if (network == "mainnet") {
    // determine if L2 is Nova
    if (Inbox.load(NOVA_INBOX_ADDRESS) != null) {
      return Bytes.fromByteArray(Bytes.fromHexString("0xa4ba"));
    } else {
      // Arb One
      return Bytes.fromByteArray(Bytes.fromHexString("0xa4b1"));
    }
  }

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

export const getL2NitroRetryableTicketId = (
  event: InboxMessageDeliveredEvent,
  retryable: RetryableTx,
  messageSenderAddress: Address
): Bytes => {
  const l2ChainId: Bytes = getL2ChainId();
  const msgNum = padBytes(getBytes(event.params.messageNum), 32);
  const fromAddress: ByteArray = ByteArray.fromHexString(messageSenderAddress.toHexString());
  let l1BaseFee: ByteArray = getBytes(BigInt.fromI32(0));
  if (event.block.baseFeePerGas) {
    l1BaseFee = getBytes(event.block.baseFeePerGas!);
  }
  const l1Value: ByteArray = getBytes(event.transaction.value);
  const maxFeePerGas: ByteArray = getBytes(retryable.gasPriceBid);
  const gasLimit: ByteArray = getBytes(retryable.maxGas);
  const destAddressString: string = retryable.destAddress.toHexString();
  const destAddress: ByteArray = ByteArray.fromHexString(
    destAddressString == "0x0000000000000000000000000000000000000000" ? "0x" : destAddressString
  );
  const l2CallValue: ByteArray = getBytes(retryable.l2CallValue);
  const callValueRefundAddress: ByteArray = ByteArray.fromHexString(
    retryable.callValueRefundAddress.toHexString()
  );
  const maxSubmissionFee: ByteArray = getBytes(retryable.maxSubmissionCost);
  const excessFeeRefundAddress: ByteArray = ByteArray.fromHexString(
    retryable.excessFeeRefundAddress.toHexString()
  );
  const data: ByteArray = ByteArray.fromHexString(retryable.data.toHexString());
  const input: ByteArray[] = [
    l2ChainId,
    msgNum,
    fromAddress,
    l1BaseFee,
    l1Value,
    maxFeePerGas,
    gasLimit,
    destAddress,
    l2CallValue,
    callValueRefundAddress,
    maxSubmissionFee,
    excessFeeRefundAddress,
    data,
  ];

  const rlpEncoded = rlpEncodeList(input);
  const prefix = "0x69";
  const rlpEncodedWithPrefix = ByteArray.fromHexString(prefix).concat(rlpEncoded);

  const ticketId = Bytes.fromByteArray(crypto.keccak256(rlpEncodedWithPrefix));
  return ticketId;
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

export const addressToBigInt = (input: Address): BigInt => {
  const addressBytes = Bytes.fromHexString(input.toHexString());
  // reverse it in order to use big-endian instead of little-endian
  const addressBytesRev = addressBytes.reverse() as Bytes;
  const bigInt = BigInt.fromUnsignedBytes(addressBytesRev);
  return bigInt;
};

/**
 * Apply or undo alias based on Arbitrum smart contract aliasing implementation.
 * @param input address to which alias is applied
 * @param reverse if true undo alias
 * @returns
 */
export const applyAlias = (input: Address, reverse: boolean): Address => {
  let inputBigInt = addressToBigInt(input);

  const offset = Address.fromBytes(Bytes.fromHexString(ADDRESS_ALIAS_OFFSET));
  let offsetAddressBigInt = addressToBigInt(offset);

  // 2^160 - 1
  let maxUint160 = BigInt.fromI32(2)
    .pow(160)
    .minus(BigInt.fromI32(1));

  let result: Address;
  if (reverse) {
    // reverse -> undo alias
    if (inputBigInt.ge(offsetAddressBigInt)) {
      result = bigIntToAddress(inputBigInt.minus(offsetAddressBigInt));
    } else {
      // handle underflow
      let diff = offsetAddressBigInt.minus(inputBigInt);
      let underflowAddress = maxUint160.minus(diff).plus(BigInt.fromI32(1));
      result = bigIntToAddress(underflowAddress);
    }
  } else {
    // apply alias
    if (inputBigInt.plus(offsetAddressBigInt).le(maxUint160)) {
      result = bigIntToAddress(inputBigInt.plus(offsetAddressBigInt));
    } else {
      // handle overflow
      let diff = inputBigInt.plus(offsetAddressBigInt).minus(maxUint160);
      let overflowAddress = diff.minus(BigInt.fromI32(1));
      result = bigIntToAddress(overflowAddress);
    }
  }

  return result;
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

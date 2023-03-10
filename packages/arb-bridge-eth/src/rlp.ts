import { BigInt, ByteArray, Bytes, log } from "@graphprotocol/graph-ts";

export function getBytes(num: BigInt): ByteArray {
  if (num == BigInt.fromI32(0)) {
    return new ByteArray(0);
  }
  const reverse = Bytes.fromUint8Array(Bytes.fromBigInt(num).reverse());
  const stripped = stripZeros(reverse);

  return stripped;
}

function stripZeros(bytes: Bytes): Bytes {
  // Find the first non-zero byte
  let firstNonZeroByteIndex = 0;
  while (firstNonZeroByteIndex < bytes.byteLength && bytes[firstNonZeroByteIndex] == 0) {
    firstNonZeroByteIndex++;
  }

  // If all bytes are zero, return a byte array with a single zero byte
  if (firstNonZeroByteIndex == bytes.length) {
    return new Bytes(1);
  }

  // Create a new byte array with only the non-zero bytes
  let strippedBytes = new Bytes(bytes.length - firstNonZeroByteIndex);
  for (let i = 0; i < strippedBytes.length; i++) {
    strippedBytes[i] = bytes[firstNonZeroByteIndex + i];
  }

  return strippedBytes;
}

function encodeItem(item: ByteArray): ByteArray {
  if (item.byteLength === 1 && item[0] < 0x80) {
    return item;
  } else if (item.byteLength < 56) {
    const prefix = new ByteArray(1);
    prefix[0] = 0x80 + item.byteLength;
    return concatBytes(prefix, item);
  } else {
    const lengthBytes = getLengthBytes(item.byteLength);
    const prefix = new ByteArray(1);
    prefix[0] = 0xb7 + lengthBytes.byteLength;
    const strLength = getBytes(BigInt.fromU32(item.byteLength));
    return concatBytes(
      concatBytes(
        prefix,
        Bytes.fromUint8Array(strLength.slice(strLength.length - lengthBytes.length))
      ),
      item
    );
  }
}

function getLengthBytes(length: i32): ByteArray {
  let lengthBytes = 1;
  let temp = length;
  while (temp > 0xff) {
    temp >>= 8;
    lengthBytes++;
  }
  const bytes = new ByteArray(lengthBytes);
  for (let i = 0; i < lengthBytes; i++) {
    bytes[lengthBytes - 1 - i] = temp & 0xff;
    temp >>= 8;
  }
  return bytes;
}

function concatBytes(a: ByteArray, b: ByteArray): ByteArray {
  return a.concat(b);
}

export function rlpEncodeList(items: ByteArray[]): ByteArray {
  let encodedItems = new ByteArray(0);
  for (let i = 0; i < items.length; i++) {
    const encodedItem = encodeItem(items[i]);
    // log.debug("RLP input: {}; RLP output: {}", [items[i].toHexString(), encodedItem.toHexString()]);
    encodedItems = concatBytes(encodedItems, encodedItem);
  }
  const prefix = new ByteArray(1);
  if (encodedItems.byteLength < 56) {
    prefix[0] = 0xc0 + encodedItems.byteLength;
    return concatBytes(prefix, encodedItems);
  } else {
    const lengthBytes = getLengthBytes(encodedItems.byteLength);
    prefix[0] = 0xf7 + lengthBytes.byteLength;
    const strLength = getBytes(BigInt.fromU32(encodedItems.byteLength));
    return concatBytes(
      concatBytes(
        prefix,
        Bytes.fromUint8Array(strLength.slice(strLength.length - lengthBytes.length))
      ),
      encodedItems
    );
  }
}

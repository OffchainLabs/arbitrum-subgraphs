import { ByteArray, BigInt, Address } from "@graphprotocol/graph-ts";

export const appendBytes = (a: ByteArray, b: ByteArray): ByteArray => {
  let result = new ByteArray(a.length + b.length);

  for (let i: i32 = 0; i < a.length; i++) {
    result[i] = a[i];
  }
  for (let i: i32 = 0; i < b.length; i++) {
    result[a.length + i] = b[i];
  }
  return result;
};

export const padBytes = (_a: ByteArray, expectedLength: i32): ByteArray => {
  if (_a.byteLength < expectedLength) {
    const paddingContent = "00".repeat(expectedLength - _a.length);
    return ByteArray.fromHexString(
      "0x" + paddingContent + _a.toHexString().substr(2)
    );
  }
  return _a;
};

export const encodePadded = (_a: ByteArray, _b: ByteArray): ByteArray =>
  appendBytes(padBytes(_a, 32), padBytes(_b, 32));

export const RETRYABLE_LIFETIME_SECONDS = BigInt.fromI32(604800);

export const bigIntToAddress = (input: BigInt): Address => {
  // remove the prepended 0x
  const hexString = input.toHexString().substr(2);
  // add missing padding so address is 20 bytes long
  const missingZeroes = "0".repeat(40 - hexString.length);
  // build hexstring again
  const addressString = "0x" + missingZeroes + hexString;
  return Address.fromString(addressString);
};

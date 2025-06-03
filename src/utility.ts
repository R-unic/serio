import type { FloatType, IntType, Primitive } from "./types";

const { floor, log, huge: INF } = math;
const NaN = 0 / 0;

type CF__index = <K extends keyof CFrame>(cf: CFrame, index: K) => CFrame[K];
export const CF__index = select(2, xpcall(
  // retarded never cast to avoid roblox-ts error 'Cannot index a method without calling it!'
  () => CFrame.identity[undefined! as keyof CFrame] as never,
  () => debug.info(2, "f")[0]
))[0] as CF__index;

/**
 * Returns a consistently ordered array for a specific Enum.
 *
 * We can't send Enum values over the network as the values aren't always within the 8 bit limit,
 * so instead we send the EnumItem's position in the array returned here.
 */
export function getSortedEnumItems(enumObject: Enum) {
  const enumItems = enumObject.GetEnumItems();
  enumItems.sort((a, b) => a.Value < b.Value);

  return enumItems;
}

export function sizeOfNumberType([kind]: Primitive<IntType | FloatType>) {
  switch (kind) {
    case "u8":
    case "i8":
      return 1;

    case "u16":
    case "i16":
    case "f16":
      return 2;

    case "f24":
      return 3;

    case "u32":
    case "i32":
    case "f32":
      return 4;

    case "f64":
      return 8;
  }
}

export function sign(n: number): -1 | 1 {
  return n < 0 ? -1 : 1;
}

export function readF16(buf: buffer, offset = 0): number {
  const low = buffer.readu8(buf, offset);
  const high = buffer.readu8(buf, offset + 1);
  const f16 = (high << 8) | low;
  return f16ToF32(f16);
}

export function f16ToF32(n: number): number {
  const sign = n >> 15;
  const signMult = sign === 1 ? -1 : 1;
  const exponent = (n >> 10) & 0x1F;
  const mantissa = n & 0x3FF;

  if (exponent === 0)
    return mantissa === 0
      ? signMult * 0
      : signMult * mantissa * 2 ** -24;
  else if (exponent === 0x1F)
    return mantissa !== 0 ? NaN : (sign === 1 ? -INF : INF);

  return signMult * (1 + mantissa / 1024) * 2 ** (exponent - 15);
}

const LOG2 = log(2);
export function f32ToF16(n: number): number {
  let sign = 0;
  if (n < 0) {
    sign = 1;
    n = -n;
  }

  if (n === INF) {
    // overflow to infinity
    return (sign << 15) + (0x1F << 10);
  } else if (n !== n)
    return (sign << 15) + (0x1F << 10) + 1;
  else if (n < 6.10352e-05) {
    // underflow to subnormal
    const bits = floor(n / 5.960464477539063e-08 + 0.5);
    return (sign << 15) + bits;
  } else if (n > 65504)
    return (sign << 15) + (0x1F << 10);

  const exponent = floor(log(n) / LOG2);
  const mantissa = floor((n / 2 ** exponent - 1) * 1024 + 0.5);
  const exponentBits = exponent + 15;
  return (sign << 15) + (exponentBits << 10) + mantissa;
}

export function readF24(buf: buffer, offset = 0): number {
  const b0 = buffer.readu8(buf, offset);
  const b1 = buffer.readu8(buf, offset + 1);
  const b2 = buffer.readu8(buf, offset + 2);
  const f24 = (b2 << 16) | (b1 << 8) | b0;
  return f24ToF32(f24);
}

export function f24ToF32(n: number): number {
  const sign = n >>> 23;
  const signMult = sign ? -1 : 1;
  const exponent = (n >>> 16) & 0x7F; // 7 bits
  const mantissa = n & 0xFFFF;        // 16 bits

  if (exponent === 0) {
    return mantissa === 0
      ? signMult * 0
      : signMult * mantissa * 2 ** -78;
  } else if (exponent === 0x7F) {
    return mantissa !== 0 ? NaN : (sign ? -INF : INF);
  }

  return signMult * (1 + mantissa / 65536) * 2 ** (exponent - 63);
}

export function f32ToF24(n: number): number {
  let sign = 0;
  if (n < 0) {
    sign = 1;
    n = -n;
  }

  if (n === INF)
    return (sign << 23) | (0x7F << 16);
  else if (n !== n)
    return (sign << 23) | (0x7F << 16) | 1;
  else if (n < 2 ** -62) {
    const bits = floor(n / 2 ** -78 + 0.5);
    return (sign << 23) | bits;
  } else if (n > 65504)
    return (sign << 23) | (0x7F << 16);

  const exponent = floor(log(n) / LOG2);
  const mantissa = floor((n / 2 ** exponent - 1) * 65536 + 0.5);
  const exponentBits = exponent + 63;

  return (sign << 23) | (exponentBits << 16) | mantissa;
}
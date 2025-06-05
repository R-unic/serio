import { LOG2, NaN } from "../constants";

const { readu8 } = buffer;
const { floor, log, huge: INF } = math;

export namespace f16 {
  export function read(buf: buffer, offset = 0): number {
    const low = readu8(buf, offset);
    const high = readu8(buf, offset + 1);
    return toF32((high << 8) | low);
  }

  export function toF32(n: number): number {
    const sign = n >>> 23 === 1;
    const signMult = sign ? -1 : 1;
    const exponent = (n >> 10) & 0x1F;
    const mantissa = n & 0x3FF;

    if (exponent === 0)
      return mantissa === 0
        ? 0 * signMult
        : 2 ** -24 * signMult * mantissa;
    else if (exponent === 0x1F)
      return mantissa !== 0
        ? NaN
        : (sign ? -INF : INF);

    return signMult * (1 + mantissa / 1024) * 2 ** (exponent - 15);
  }

  export function fromF32(n: number): number {
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
}
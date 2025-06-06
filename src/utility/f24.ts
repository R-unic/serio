import { LOG2, NaN } from "../constants";
import { u24 } from "./u24";

const { abs, floor, log, huge: INF } = math;

const MIN_NORMAL = 2 ** -62;
const DENORM_SCALE = 2 ** -78;

export namespace f24 {
  export function read(buf: buffer, offset = 0): number {
    return toF32(u24.read(buf, offset));
  }

  export function fromF32(n: number): number {
    let sign = n < 0 ? 1 : 0;
    n = abs(n)

    if (n === INF)
      return (sign << 23) | (0x7F << 16);
    else if (n !== n)
      return (sign << 23) | (0x7F << 16) | 1;
    else if (n < MIN_NORMAL) {
      const bits = floor(n / DENORM_SCALE + 0.5);
      return (sign << 23) | bits;
    } else if (n > 65504)
      return (sign << 23) | (0x7F << 16);

    const exponent = floor(log(n) / LOG2);
    const mantissa = floor((n / 2 ** exponent - 1) * 65536 + 0.5);
    const exponentBits = exponent + 63;
    return (sign << 23) | (exponentBits << 16) | mantissa;
  }

  function toF32(n: number): number {
    const sign = n >>> 23 === 1;
    const signMult = sign ? -1 : 1;
    const exponent = (n >>> 16) & 0x7F; // 7 bits
    const mantissa = n & 0xFFFF;        // 16 bits

    if (exponent === 0)
      return mantissa === 0
        ? 0 * signMult
        : DENORM_SCALE * signMult * mantissa;
    else if (exponent === 0x7F)
      return mantissa !== 0
        ? NaN
        : (sign ? -INF : INF);

    return signMult * (1 + mantissa / 65536) * 2 ** (exponent - 63);
  }
}
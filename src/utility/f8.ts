import { isNaN } from ".";
import { LOG2, NaN } from "../constants";

const { readu8 } = buffer;
const { floor, log, huge: INF } = math;

const MANTISSA_BITS = 3;
const EXPONENT_MAX = 0xF;
const MANTISSA_MAX = 0x7;
const BIAS = 7;
const DENORM_SCALE = 2 ** (1 - BIAS - MANTISSA_BITS);

export namespace f8 {
  export function read(buf: buffer, offset = 0): number {
    return toF32(readu8(buf, offset));
  }

  export function toF32(n: number): number {
    const sign = (n >> 7) & 1;
    const exponent = (n >> 3) & 0xF;
    const mantissa = n & 0x7;
    const signMult = sign ? -1 : 1;
    if (exponent === 0) {
      return mantissa === 0
        ? 0 * signMult
        : signMult * mantissa * DENORM_SCALE;
    }

    if (exponent === EXPONENT_MAX) {
      return mantissa !== 0
        ? NaN
        : (sign ? -INF : INF);
    }

    return signMult
      * (1 + mantissa / (1 << MANTISSA_BITS))
      * 2 ** (exponent - BIAS);
  }

  export function fromF32(n: number): number {
    let sign = 0;
    if (n < 0) {
      sign = 1;
      n = -n;
    }

    if (n === INF) {
      return (sign << 7) | (EXPONENT_MAX << 3);
    }

    if (isNaN(n)) {
      return (sign << 7) | (EXPONENT_MAX << 3) | 1;
    }

    if (n === 0) {
      return sign << 7;
    }

    const exponent = floor(log(n) / LOG2);
    if (exponent < 1 - BIAS) {
      const scaled = n / (2 ** (1 - BIAS - MANTISSA_BITS));
      const mantissa = floor(0.5 + scaled);

      if (mantissa <= 0) return sign << 7;
      if (mantissa > MANTISSA_MAX) return (sign << 7) | 1; // smallest normal

      return (sign << 7) | mantissa;
    }

    if (exponent > BIAS) {
      return (sign << 7) | (EXPONENT_MAX << 3);
    }

    const mantissa = floor(0.5 + (n / 2 ** exponent - 1) * (1 << MANTISSA_BITS));
    const exponentBits = exponent + BIAS;
    return (sign << 7) | (exponentBits << 3) | (mantissa & MANTISSA_MAX);
  }
}
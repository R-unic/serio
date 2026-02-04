import { u12 } from "./u12";

export namespace i12 {
  export function read(
    buf: buffer,
    offset = 0,
    bits: readonly [boolean, boolean, boolean, boolean]
  ): number {
    let value = u12.read(buf, offset, bits);
    const isSigned = (value & 0x800) === 0x800;
    if (isSigned)
      value -= 0x1000;

    return value;
  }

  export function fromI32(n: number): number {
    return n & 0x0FFF;
  }
}
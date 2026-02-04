import { u24 } from "./u24";

export namespace i24 {
  export function read(buf: buffer, offset = 0): number {
    let value = u24.read(buf, offset);
    const isSigned = (value & 0x800000) === 0x800000;
    if (isSigned)
      value -= 0x1000000;

    return value;
  }

  export function fromI32(n: number): number {
    return n & 0xFFFFFF;
  }
}
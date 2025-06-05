const { readu8 } = buffer;

export namespace u24 {
  export function read(buf: buffer, offset = 0): number {
    const b0 = readu8(buf, offset);
    const b1 = readu8(buf, offset + 1);
    const b2 = readu8(buf, offset + 2);
    return (b2 << 16) | (b1 << 8) | b0;
  }

  export function fromU32(n: number): number {
    return n & 0xFFFFFF;
  }
}
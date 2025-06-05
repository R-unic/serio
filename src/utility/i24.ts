const { readu8 } = buffer;

export namespace i24 {
  export function read(buf: buffer, offset = 0): number {
    const b0 = readu8(buf, offset);
    const b1 = readu8(buf, offset + 1);
    const b2 = readu8(buf, offset + 2);
    let n = (b2 << 16) | (b1 << 8) | b0;

    // Sign-extend if the sign bit (bit 23) is set
    const isSigned = (n & 0x800000) === 0x800000;
    if (isSigned)
      n -= 0x1000000;

    return n;
  }

  export function fromI32(n: number): number {
    return n & 0xFFFFFF;
  }
}
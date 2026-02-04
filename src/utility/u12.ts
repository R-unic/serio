const { readu8 } = buffer;

export namespace u12 {
  export function read(
    buf: buffer,
    offset = 0,
    bits: readonly [boolean, boolean, boolean, boolean]
  ): number {
    const low = readu8(buf, offset);

    let high = 0;
    for (const i of $range(0, 3)) {
      if (!bits[i]) continue;
      high |= 1 << (3 - i);
    }

    return (high << 8) | low;
  }

  export function fromU32(n: number): number {
    return n & 0x0FFF;
  }
}
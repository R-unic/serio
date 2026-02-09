import { Assert, Fact, Theory, InlineData } from "@rbxts/runit";
import { deunify } from "@rbxts/flamework-meta-utils";

import { u24 as u24Utility } from "../../src/utility/u24";
import { i24 as i24Utility } from "../../src/utility/i24";
import { f24 as f24Utility } from "../../src/utility/f24";
import { f16 as f16Utility } from "../../src/utility/f16";
import {
  BaseSerializationTest, type TestLiteralUnion, type TestObject, type TestPackedBooleans
} from "./utility";
import type {
  u8, u12, u16, u24, u32, i8, i12, i16, i24, i32, f16, f24, f32, f64,
  String, List, HashSet, HashMap, Packed,
} from "../src/index";
import type { NumberType } from "../src/types";

const { len, readu8, readu16, readu32, readi8, readi16, readi32, readf32, readf64, readstring } = buffer;

function reconstructU12(bits: readonly [boolean, boolean, boolean, boolean], low: number): number {
  const [b11, b10, b9, b8] = bits;

  return ((b11 ? 1 : 0) << 11)
    | ((b10 ? 1 : 0) << 10)
    | ((b9 ? 1 : 0) << 9)
    | ((b8 ? 1 : 0) << 8)
    | low;
}

function reconstructI12(bits: readonly [boolean, boolean, boolean, boolean], low: number): number {
  let value = reconstructU12(bits, low);
  const isSigned = (value & 0x800) === 0x800;
  if (isSigned)
    value -= 0x1000;

  return value;
}

class SerializationTest extends BaseSerializationTest {
  @Theory
  @InlineData(2 ** 8, "u8")
  @InlineData(-1, "u8")
  @InlineData(-200, "i8")
  @InlineData(2 ** 16, "u16")
  @InlineData(-1, "u16")
  @InlineData(-42069, "i16")
  @InlineData(2 ** 32, "u32")
  @InlineData(-1, "u32")
  @InlineData(-(2 ** 32), "i32")
  @InlineData(2 ** 16, "f16")
  @InlineData(2 ** 24, "f24")
  public throwsWhenOutOfRange(n: number, kind: NumberType): void {
    Assert.throws(() => this.serialize(n, {
      text: kind,
      serializerMeta: [kind]
    } as never), "[string \"ReplicatedStorage.Library.utility\"]:21: [@rbxts/serio]: Attempt to serialize value out of bit range");
  }

  @Fact
  public throwsWhenNaN(): void {
    Assert.throws(() => this.serialize<number>(0 / 0), "[@rbxts/serio]: Attempt to serialize NaN value as \"f32\"");
  }

  @Fact
  public u8(): void {
    const n = 69;
    const { buf } = this.serialize<u8>(n);
    Assert.defined(buf);
    Assert.equal(1, len(buf));

    const result = readu8(buf, 0);
    Assert.equal(n, result);
  }

  @Fact
  public u12(): void {
    const n = 4000;
    const { buf } = this.serialize<Packed<u12>>(n);
    Assert.defined(buf);
    Assert.equal(2, len(buf));

    const packedBits = readu8(buf, 0);
    const low = readu8(buf, 1);
    Assert.equal(15, packedBits);
    Assert.equal(160, low);

    const bits = [
      (packedBits & 0b0001) !== 0,
      (packedBits & 0b0010) !== 0,
      (packedBits & 0b0100) !== 0,
      (packedBits & 0b1000) !== 0
    ] as const;

    const result = reconstructU12(bits, low);
    Assert.equal(n, result);
  }

  @Fact
  public u16(): void {
    const n = 42069;
    const { buf } = this.serialize<u16>(n);
    Assert.defined(buf);
    Assert.equal(2, len(buf));

    const result = readu16(buf, 0);
    Assert.equal(n, result);
  }

  @Fact
  public u24(): void {
    const n = 69_420;
    const { buf } = this.serialize<u24>(n);
    Assert.defined(buf);
    Assert.equal(3, len(buf));

    const result = u24Utility.read(buf, 0);
    Assert.equal(n, result);
  }

  @Fact
  public u32(): void {
    const n = 69_420_420;
    const { buf } = this.serialize<u32>(n);
    Assert.defined(buf);
    Assert.equal(4, len(buf));

    const result = readu32(buf, 0);
    Assert.equal(n, result);
  }

  @Fact
  public i8(): void {
    const n = 69;
    const { buf } = this.serialize<i8>(n);
    Assert.defined(buf);
    Assert.equal(1, len(buf));

    const result = readi8(buf, 0);
    Assert.equal(n, result);
  }

  @Fact
  public i12(): void {
    const n = -2000;
    const { buf } = this.serialize<Packed<i12>>(n);
    Assert.defined(buf);
    Assert.equal(2, len(buf));

    const packedBits = readu8(buf, 0);
    const low = readu8(buf, 1);
    Assert.equal(1, packedBits);
    Assert.equal(48, low);

    const bits = [
      (packedBits & 0b0001) !== 0,
      (packedBits & 0b0010) !== 0,
      (packedBits & 0b0100) !== 0,
      (packedBits & 0b1000) !== 0
    ] as const;

    const result = reconstructI12(bits, low);
    Assert.equal(n, result);
  }

  @Fact
  public i16(): void {
    const n = 13337;
    const { buf } = this.serialize<i16>(n);
    Assert.defined(buf);
    Assert.equal(2, len(buf));

    const result = readi16(buf, 0);
    Assert.equal(n, result);
  }

  @Fact
  public i24(): void {
    const n = 69_420;
    const { buf } = this.serialize<i24>(n);
    Assert.defined(buf);
    Assert.equal(3, len(buf));

    const result = i24Utility.read(buf, 0);
    Assert.equal(n, result);
  }

  @Fact
  public i32(): void {
    const n = 69_420_420;
    const { buf } = this.serialize<i32>(n);
    Assert.defined(buf);
    Assert.equal(4, len(buf));

    const result = readi32(buf, 0);
    Assert.equal(n, result);
  }

  @Fact
  public f16(): void {
    const n = 69.42;
    const { buf } = this.serialize<f16>(n);
    Assert.defined(buf);
    Assert.equal(2, len(buf));

    const result = f16Utility.read(buf, 0);
    Assert.fuzzyEqual(n, result, 5e-2);
  }

  @Fact
  public f24(): void {
    const n = 69.45;
    const { buf } = this.serialize<f24>(n);
    Assert.defined(buf);
    Assert.equal(3, len(buf));

    const result = f24Utility.read(buf, 0);
    Assert.fuzzyEqual(n, result, 1e-3);
  }

  @Fact
  public f32(): void {
    const n = 69.420;
    const { buf } = this.serialize<f32>(n);
    Assert.defined(buf);
    Assert.equal(4, len(buf));

    const result = readf32(buf, 0);
    Assert.fuzzyEqual(n, result, 1e-4);
  }

  @Fact
  public f64(): void {
    const n = 69.6942069;
    const { buf } = this.serialize<f64>(n);
    Assert.defined(buf);
    Assert.equal(8, len(buf));

    const result = readf64(buf, 0);
    Assert.equal(n, result);
  }

  @Fact
  public string(): void {
    const s = "abc123";
    const { buf } = this.serialize<string>(s);
    Assert.defined(buf);
    Assert.equal(10, len(buf));

    const length = readu32(buf, 0);
    Assert.equal(s.size(), length);

    const result = readstring(buf, 4, length);
    Assert.equal(s, result);
  }

  @Fact
  public stringCustom(): void {
    const s = "abc123";
    const { buf } = this.serialize<String<u8>>(s);
    Assert.defined(buf);
    Assert.equal(7, len(buf));

    const length = readu8(buf, 0);
    Assert.equal(s.size(), length);

    const result = readstring(buf, 1, length);
    Assert.equal(s, result);
  }

  @Theory
  @InlineData(true)
  @InlineData(false)
  public boolean(value: boolean): void {
    const { buf } = this.serialize<boolean>(value);
    Assert.defined(buf);
    Assert.equal(1, len(buf));

    const result = readu8(buf, 0) === 1;
    Assert.equal(value, result);
  }

  @Theory
  @InlineData("a", 0)
  @InlineData("b", 1)
  @InlineData("c", 2)
  @InlineData("d", 3)
  public literalUnions(value: TestLiteralUnion, expectedIndex: number): void {
    const members = deunify<TestLiteralUnion>();
    const { buf } = this.serialize<TestLiteralUnion>(value);
    Assert.defined(buf);
    Assert.equal(1, len(buf));

    const index = readu8(buf, 0);
    Assert.equal(expectedIndex, index);
    Assert.equal(value, members[index]);
  }

  @Theory
  @InlineData(Enum.UserInputState.Begin)
  @InlineData(Enum.UserInputState.Change)
  @InlineData(Enum.UserInputState.End)
  @InlineData(Enum.UserInputState.Cancel)
  @InlineData(Enum.UserInputState.None)
  public enums(value: Enum.UserInputState): void {
    const { buf } = this.serialize<Enum.UserInputState>(value);
    Assert.defined(buf);
    Assert.equal(1, len(buf));

    const index = readu8(buf, 0);
    Assert.equal(value.Value, index);
  }

  @Fact
  public object(): void {
    const value: TestObject = { a: 69, b: false, c: "b", d: -42069 };
    const { buf } = this.serialize<TestObject>(value);
    Assert.defined(buf);
    Assert.equal(7, len(buf));

    const a = readu8(buf, 0);
    const b = readu8(buf, 1) === 1;
    const cIndex = readu8(buf, 2);
    const c = cIndex === 0 ? "a" : cIndex === 1 ? "b" : "c";
    const d = readi32(buf, 3);
    Assert.equal(value.a, a);
    Assert.equal(value.b, b);
    Assert.equal(value.c, c);
    Assert.equal(value.d, d);
  }

  @Fact
  public optional(): void {
    {
      const value = { foo: 69 };
      const { buf } = this.serialize<{ foo?: u8 }>(value);
      Assert.defined(buf);
      Assert.equal(2, len(buf));

      const exists = readu8(buf, 0) === 1;
      const result = exists ? readu8(buf, 1) : undefined;
      Assert.equal(value.foo, result);
    }
    {
      const { buf } = this.serialize<{ foo?: u8 }>({});
      Assert.defined(buf);
      Assert.equal(1, len(buf));

      const exists = readu8(buf, 0) === 1;
      const result = exists ? readu8(buf, 1) : undefined;
      Assert.undefined(result);
    }
  }

  @Fact
  public packedOptionals(): void {
    const value = { foo: 69, bar: undefined };
    const { buf } = this.serialize<{ foo?: u8, bar?: u8 }>(value);
    Assert.defined(buf);
    Assert.equal(3, len(buf));

    const packed = readu8(buf, 0);
    const isBitSet = (bit: number) => ((packed >> bit - 1) & 1) === 1;
    const fooExists = isBitSet(1);
    const barExists = isBitSet(2);
    const foo = fooExists ? readu8(buf, 1) : undefined;
    const bar = barExists ? readu8(buf, 2) : undefined;
    Assert.equal(value.foo, foo);
    Assert.equal(value.bar, bar);
  }

  @Fact
  public packedBooleans(): void {
    const value: TestPackedBooleans = { a: true, b: false, c: true, d: false, e: true, f: false, g: true, h: false };
    const { buf } = this.serialize<Packed<TestPackedBooleans>>(value, {
      // this is to guarantee the order of the fields
      text: "Packed<Schema>",
      serializerMeta: ["packed", ["object", [
        ["a", ["bool"]],
        ["b", ["bool"]],
        ["c", ["bool"]],
        ["d", ["bool"]],
        ["e", ["bool"]],
        ["f", ["bool"]],
        ["g", ["bool"]],
        ["h", ["bool"]]
      ]]]
    } as never);
    Assert.defined(buf);
    Assert.equal(1, len(buf));

    const packed = readu8(buf, 0);
    const isBitSet = (bit: number) => ((packed >> bit - 1) & 1) === 1;
    const a = isBitSet(1);
    const b = isBitSet(2);
    const c = isBitSet(3);
    const d = isBitSet(4);
    const e = isBitSet(5);
    const f = isBitSet(6);
    const g = isBitSet(7);
    const h = isBitSet(8);
    Assert.true(a);
    Assert.false(b);
    Assert.true(c);
    Assert.false(d);
    Assert.true(e);
    Assert.false(f);
    Assert.true(g);
    Assert.false(h);
  }

  @Fact
  public array(): void {
    const value: number[] = [1, 2, 3, 4];
    const { buf } = this.serialize<u8[]>(value);
    Assert.defined(buf);
    Assert.equal(8, len(buf));

    const length = readu32(buf, 0);
    Assert.equal(value.size(), length);

    for (const i of $range(1, length)) {
      const n = readu8(buf, 4 + (i - 1));
      Assert.equal(value[i - 1], n);
    }
  }

  @Fact
  public arrayCustom(): void {
    const value: number[] = [1, 2, 3, 4];
    const { buf } = this.serialize<List<u8, u8>>(value);
    Assert.defined(buf);
    Assert.equal(5, len(buf));

    const length = readu8(buf, 0);
    Assert.equal(value.size(), length);

    for (const i of $range(1, length)) {
      const n = readu8(buf, 1 + (i - 1));
      Assert.equal(value[i - 1], n);
    }
  }

  @Fact
  public set(): void {
    const value = new Set([1, 2, 3, 4]);
    const { buf } = this.serialize<Set<u8>>(value);
    Assert.defined(buf);
    Assert.equal(8, len(buf));

    const length = readu32(buf, 0);
    Assert.equal(value.size(), length);

    let i = 0;
    for (const element of value) {
      const n = readu8(buf, 4 + i++);
      Assert.equal(element, n);
    }
  }

  @Fact
  public setCustom(): void {
    const value = new Set([1, 2, 3, 4]);
    const { buf } = this.serialize<HashSet<u8, u8>>(value);
    Assert.defined(buf);
    Assert.equal(5, len(buf));

    const length = readu8(buf, 0);
    Assert.equal(value.size(), length);

    let i = 0;
    for (const element of value) {
      const n = readu8(buf, 1 + i++);
      Assert.equal(element, n);
    }
  }

  @Fact
  public map(): void {
    const value = new Map([
      [10, true],
      [20, false],
      [30, true],
      [40, false]
    ]);

    const { buf } = this.serialize<Map<u8, boolean>>(value);
    Assert.defined(buf);
    Assert.equal(12, len(buf));

    const length = readu32(buf, 0);
    Assert.equal(value.size(), length);

    for (const i of $range(1, length, 2)) {
      const k = readu8(buf, 4 + (i - 1));
      const v = readu8(buf, 4 + 1 + (i - 1)) === 1;
      Assert.true(value.has(k));
      Assert.equal(value.get(k), v);
    }
  }

  @Fact
  public mapCustom(): void {
    const value = new Map([
      [10, true],
      [20, false],
      [30, true],
      [40, false]
    ]);

    const { buf } = this.serialize<HashMap<u8, boolean, u8>>(value);
    Assert.defined(buf);
    Assert.equal(9, len(buf));

    const length = readu8(buf, 0);
    Assert.equal(value.size(), length);

    for (const i of $range(1, length, 2)) {
      const k = readu8(buf, 1 + (i - 1));
      const v = readu8(buf, 1 + 1 + (i - 1)) === 1;
      Assert.true(value.has(k));
      Assert.equal(value.get(k), v);
    }
  }
}

export = SerializationTest;
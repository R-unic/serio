import { Assert, Fact, Theory, InlineData } from "@rbxts/runit";
import { deunify } from "@rbxts/flamework-meta-utils";

import { f24 as f24Utility } from "../../src/utility/f24";
import { f16 as f16Utility } from "../../src/utility/f16";
import { f8 as f8Utility } from "../../src/utility/f8";
import {
  BaseSerializationTest, TestTaggedUnion, type TestLiteralUnion, type TestObject, type TestPackedBooleans,
  type TestComplexUnion, type TestBinaryLiteral, type TestManyOptionals, type TestConstantLiteral
} from "./utility";
import type {
  u8, u16, u32, i8, i16, i32, f8, f16, f24, f32, f64,
  String, List, HashSet, HashMap, Packed, Tuple,
  IntWithin, FloatWithin,
} from "../src/index";
import type { NumberType } from "../src/types";

const { len, readu8, readu16, readu32, readi8, readi16, readi32, readf32, readf64, readstring } = buffer;

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
  @InlineData(2 ** 16, "f8")
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
  public intWithinByteAligned(): void {
    const n = 200;
    const { buf } = this.serialize<IntWithin<0, 255>>(n);
    Assert.defined(buf);
    Assert.equal(1, len(buf));

    const result = readu8(buf, 0);
    Assert.equal(n, result);
  }

  @Fact
  public intWithinRequiresPackingWhenNotByteAligned(): void {
    Assert.throws(() => this.serialize<IntWithin<0, 127>>(69));
  }

  @Fact
  public intWithinPacking(): void {
    const { buf } = this.serialize<Packed<{ a: IntWithin<0, 127>, b: IntWithin<0, 127>; }>>({ a: 69, b: 69 });
    Assert.defined(buf);
    Assert.equal(2, len(buf));

    Assert.equal(197, readu8(buf, 0));
    Assert.equal(34, readu8(buf, 1));
  }

  @Fact
  public floatWithin(): void {
    const n = 42.5;
    const { buf } = this.serialize<FloatWithin<0, 100, 8>>(n);
    Assert.defined(buf);
    Assert.equal(1, len(buf));

    const result = readu8(buf, 0);
    Assert.equal(108, result);
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
  public u16(): void {
    const n = 42069;
    const { buf } = this.serialize<u16>(n);
    Assert.defined(buf);
    Assert.equal(2, len(buf));

    const result = readu16(buf, 0);
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
  public i16(): void {
    const n = 13337;
    const { buf } = this.serialize<i16>(n);
    Assert.defined(buf);
    Assert.equal(2, len(buf));

    const result = readi16(buf, 0);
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
  public f8(): void {
    const n = 69.42;
    const { buf } = this.serialize<f8>(n);
    Assert.defined(buf);
    Assert.equal(1, len(buf));

    const result = f8Utility.read(buf, 0);
    Assert.fuzzyEqual(n, result, 3);
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
  @InlineData({ tag: "a", value: 69 }, 0, 1)
  @InlineData({ tag: "b", value: "foo" }, 1, 4)
  public taggedUnions(union: TestTaggedUnion, expectedIndex: number, extraSize: number): void {
    const members = deunify<TestTaggedUnion["tag"]>();
    const { buf } = this.serialize<TestTaggedUnion>(union);
    Assert.defined(buf);
    Assert.equal(1 + extraSize, len(buf));

    const index = readu8(buf, 0);
    const value = union.tag === "a" ? readu8(buf, 1) : readstring(buf, 2, extraSize - 1);
    Assert.equal(expectedIndex, index);
    Assert.equal(union.tag, members[index]);
    Assert.equal(union.value, value);
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
      const { buf } = this.serialize<{ foo?: u8; }>(value);
      Assert.defined(buf);
      Assert.equal(2, len(buf));

      const exists = readu8(buf, 0) === 1;
      const result = exists ? readu8(buf, 1) : undefined;
      Assert.equal(value.foo, result);
    }
    {
      const { buf } = this.serialize<{ foo?: u8; }>({});
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
    const { buf } = this.serialize<{ foo?: u8, bar?: u8; }>(value);
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
      text: "Packed<TestPackedBooleans>",
      serializerMeta: ["packed", ["object_raw", [
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

  @Fact
  public udim(): void {
    const value = new UDim(0.5, 100);
    const { buf } = this.serialize<UDim>(value);
    Assert.defined(buf);
    Assert.equal(6, len(buf));

    Assert.equal(value.Scale, readf32(buf, 0));
    Assert.equal(value.Offset, readu16(buf, 4));
  }

  @Fact
  public udim2(): void {
    // not one of the COMMON_UDIM2S special cases
    const value = UDim2.fromScale(0.3, 0.7);
    const { buf } = this.serialize<UDim2>(value);
    Assert.defined(buf);
    Assert.equal(12, len(buf));

    Assert.equal(value.X.Scale, readf32(buf, 0));
    Assert.equal(value.X.Offset, readu16(buf, 4));
    Assert.equal(value.Y.Scale, readf32(buf, 6));
    Assert.equal(value.Y.Offset, readu16(buf, 10));
  }

  @Fact
  public udim2PackedSpecialCase(): void {
    // UDim2.fromScale(0.5, 0.5) is a COMMON_UDIM2S entry (index 6), so it should shortcut to a single byte
    const value = UDim2.fromScale(0.5, 0.5);
    const { buf } = this.serialize<Packed<{ ud: UDim2; }>>({ ud: value });
    Assert.defined(buf);
    Assert.equal(2, len(buf));

    Assert.equal(1, readu8(buf, 0)); // packed "isOptimized" bit
    Assert.equal(6, readu8(buf, 1)); // special case index
  }

  @Fact
  public rect(): void {
    const value = new Rect(10, 20, 300, 400);
    const { buf } = this.serialize<Rect>(value);
    Assert.defined(buf);
    Assert.equal(16, len(buf)); // 4x f32

    Assert.equal(value.Min.X, readf32(buf, 0));
    Assert.equal(value.Min.Y, readf32(buf, 4));
    Assert.equal(value.Max.X, readf32(buf, 8));
    Assert.equal(value.Max.Y, readf32(buf, 12));
  }

  @Fact
  public color(): void {
    const value = Color3.fromRGB(200, 100, 50);
    const { buf } = this.serialize<Color3>(value);
    Assert.defined(buf);
    Assert.equal(3, len(buf));

    Assert.equal(200, readu8(buf, 0));
    Assert.equal(100, readu8(buf, 1));
    Assert.equal(50, readu8(buf, 2));
  }

  @Fact
  public numberSequence(): void {
    const value = new NumberSequence([
      new NumberSequenceKeypoint(0, 0),
      new NumberSequenceKeypoint(1, 1)
    ]);
    const { buf } = this.serialize<NumberSequence>(value);
    Assert.defined(buf);
    Assert.equal(1 + 6 * 2, len(buf));
    Assert.equal(2, readu8(buf, 0));
  }

  @Fact
  public colorSequence(): void {
    const value = new ColorSequence([
      new ColorSequenceKeypoint(0, Color3.fromRGB(0, 0, 0)),
      new ColorSequenceKeypoint(1, Color3.fromRGB(255, 255, 255))
    ]);
    const { buf } = this.serialize<ColorSequence>(value);
    Assert.defined(buf);
    Assert.equal(1 + 5 * 2, len(buf));
    Assert.equal(2, readu8(buf, 0));
  }

  @Fact
  public tuple(): void {
    const value: [u8, boolean, string] = [69, true, "hi"];
    const { buf } = this.serialize<[u8, boolean, string]>(value);
    Assert.defined(buf);
    Assert.equal(8, len(buf));

    Assert.equal(69, readu8(buf, 0));
    Assert.equal(true, readu8(buf, 1) === 1);
    Assert.equal(2, readu32(buf, 2));
    Assert.equal("hi", readstring(buf, 6, 2));
  }

  @Fact
  public tupleWithRest(): void {
    const value: Tuple<[u8, ...u8[]], u8> = [1, 2, 3, 4] as never;
    const { buf } = this.serialize<Tuple<[u8, ...u8[]], u8>>(value);
    Assert.defined(buf);
    Assert.equal(5, len(buf));

    Assert.equal(3, readu8(buf, 0)); // rest length, written before any elements
    Assert.equal(1, readu8(buf, 1)); // fixed element
    Assert.equal(2, readu8(buf, 2));
    Assert.equal(3, readu8(buf, 3));
    Assert.equal(4, readu8(buf, 4));
  }

  @Fact
  public blob(): void {
    const instance = new Instance("Folder");
    const { buf, blobs } = this.serialize<Instance>(instance);
    Assert.undefined(buf);
    Assert.defined(blobs);
    Assert.equal(1, blobs!.size());
    Assert.equal(instance, blobs![0]);
  }

  @Fact
  public packedOptionalsReal(): void {
    const value = { foo: 69, bar: undefined as u8 | undefined };
    const { buf } = this.serialize<Packed<{ foo?: u8, bar?: u8; }>>(value);
    Assert.defined(buf);
    // 2 packed existence bits (sharing 1 byte) + 1 direct value byte for foo, instead of 3 bytes unpacked
    Assert.equal(2, len(buf));
  }

  @Fact
  public packedTaggedUnion(): void {
    const { buf } = this.serialize<Packed<TestTaggedUnion>>({ tag: "a", value: 69 });
    Assert.defined(buf);
    Assert.equal(2, len(buf));

    Assert.equal(1, readu8(buf, 0)); // packed tag bit ("a" => bit set)
    Assert.equal(69, readu8(buf, 1));
  }

  @Fact
  public packedLiteralUnion(): void {
    const { buf } = this.serialize<Packed<{ x: TestBinaryLiteral; }>>({ x: "a" });
    Assert.defined(buf);
    Assert.equal(1, len(buf));
    Assert.equal(1, readu8(buf, 0)); // "a" => bit set
  }

  @Fact
  public guardUnionThrowsWhenNoMatch(): void {
    Assert.throws(() => this.serialize<TestComplexUnion>({} as never));
  }

  @Fact
  public literalSingleConstant(): void {
    // "kind" is a compile-time constant (not a union), so it costs 0 bytes
    const value: TestConstantLiteral = { kind: "foo", value: 69 };
    const { buf } = this.serialize<TestConstantLiteral>(value);
    Assert.defined(buf);
    Assert.equal(1, len(buf));

    Assert.equal(69, readu8(buf, 0));
  }

  @Fact
  public floatWithinRequiresPackingWhenNotByteAligned(): void {
    // 0-100 quantized to 6 bits is not byte-aligned, so it must be packed
    Assert.throws(() => this.serialize<FloatWithin<0, 100, 6>>(50));
  }

  @Fact
  public packedManyOptionals(): void {
    // 8 packed optional-existence bits don't fit in a single "variable" byte (7 usable bits),
    // so this must span 2 bytes and exercise the continuation-bit scheme.
    // Field order is forced explicitly (as with the packedBooleans test above) since the exact
    // byte assertions below depend on it.
    const value: TestManyOptionals = { a: 5, h: 9 };
    const { buf } = this.serialize<Packed<TestManyOptionals>>(value, {
      text: "Packed<TestManyOptionals>",
      serializerMeta: ["packed", ["object_raw", [
        ["a", ["optional", ["u8"]]],
        ["b", ["optional", ["u8"]]],
        ["c", ["optional", ["u8"]]],
        ["d", ["optional", ["u8"]]],
        ["e", ["optional", ["u8"]]],
        ["f", ["optional", ["u8"]]],
        ["g", ["optional", ["u8"]]],
        ["h", ["optional", ["u8"]]]
      ]]]
    } as never);
    Assert.defined(buf);
    Assert.equal(4, len(buf));

    Assert.equal(3, readu8(buf, 0)); // continuation flag + 'a' exists
    Assert.equal(2, readu8(buf, 1)); // 'h' exists, no continuation
    Assert.equal(5, readu8(buf, 2));
    Assert.equal(9, readu8(buf, 3));
  }

  @Fact
  public bufferResize(): void {
    // longer than the initial 256-byte buffer, forcing a reallocation
    const s = string.rep("a", 500);
    const { buf } = this.serialize<string>(s);
    Assert.defined(buf);
    Assert.equal(4 + 500, len(buf));

    const length = readu32(buf, 0);
    Assert.equal(500, length);
    Assert.equal(s, readstring(buf, 4, length));
  }
}

export = SerializationTest;
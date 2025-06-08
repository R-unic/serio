import type { Modding } from "@flamework/core";
import { Assert, Fact, Theory, InlineData } from "@rbxts/runit";
import { deunify } from "@rbxts/flamework-meta-utils";

import { u24 as u24Utility } from "../../src/utility/u24";
import { i24 as i24Utility } from "../../src/utility/i24";
import { f24 as f24Utility } from "../../src/utility/f24";
import { f16 as f16Utility } from "../../src/utility/f16";
import { AXIS_ALIGNED_ORIENTATIONS, COMMON_VECTORS } from "../../src/constants";
import { fuzzyEq } from "../../src/utility";
import {
  assertFuzzyEqual, getSerializer,
  type SerializeMetadata, type TestLiteralUnion, type TestObject, type TestPackedBooleans
} from "./utility";
import type {
  SerializedData,
  u8, u16, u24, u32, i8, i16, i24, i32, f16, f24, f32, f64,
  String, List, HashSet, HashMap, Vector, Transform, Packed
} from "../src/index";

const angles = CFrame.Angles;
const { rad } = math;
const { len, readu8, readu16, readu32, readi8, readi16, readi32, readf32, readf64, readstring } = buffer;

class SerializationTest {
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
    const n = 420;
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
  public i16(): void {
    const n = 420;
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
    assertFuzzyEqual(n, result, 5e-2);
  }

  @Fact
  public f24(): void {
    const n = 69.45;
    const { buf } = this.serialize<f24>(n);
    Assert.defined(buf);
    Assert.equal(3, len(buf));

    const result = f24Utility.read(buf, 0);
    assertFuzzyEqual(n, result, 1e-3);
  }

  @Fact
  public f32(): void {
    const n = 69.420;
    const { buf } = this.serialize<f32>(n);
    Assert.defined(buf);
    Assert.equal(4, len(buf));

    const result = readf32(buf, 0);
    assertFuzzyEqual(n, result, 1e-4);
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

  @Fact
  public vector(): void {
    const value = vector.create(1, 2, 3) as unknown as Vector3;
    const { buf } = this.serialize<Vector3>(value);
    Assert.defined(buf);
    Assert.equal(12, len(buf));

    const x = readf32(buf, 0);
    const y = readf32(buf, 4);
    const z = readf32(buf, 8);
    Assert.equal(1, x);
    Assert.equal(2, y);
    Assert.equal(3, z);
  }

  @Fact
  public vectorCustom(): void {
    const value = vector.create(1, 2, 3) as unknown as Vector3;
    const { buf } = this.serialize<Vector<u8>>(value);
    Assert.defined(buf);
    Assert.equal(3, len(buf));

    const x = readu8(buf, 0);
    const y = readu8(buf, 1);
    const z = readu8(buf, 2);
    Assert.equal(1, x);
    Assert.equal(2, y);
    Assert.equal(3, z);
  }

  @Theory
  @InlineData(vector.zero)
  @InlineData(vector.one)
  @InlineData(vector.create(-1, -1, -1))
  @InlineData(vector.create(1, 0, 0))
  @InlineData(vector.create(0, 1, 0))
  @InlineData(vector.create(0, 0, 1))
  @InlineData(vector.create(-1, 0, 0))
  @InlineData(vector.create(0, -1, 0))
  @InlineData(vector.create(0, 0, -1))
  @InlineData(vector.create(1, 1, 0))
  @InlineData(vector.create(1, 0, 1))
  @InlineData(vector.create(0, 1, 1))
  @InlineData(vector.create(-1, -1, 0))
  @InlineData(vector.create(-1, 0, -1))
  @InlineData(vector.create(0, -1, -1))
  @InlineData(vector.create(1, -1, 0))
  @InlineData(vector.create(-1, 1, 0))
  @InlineData(vector.create(0, -1, 1))
  @InlineData(vector.create(0, 1, -1))
  @InlineData(vector.create(-1, 0, 1))
  @InlineData(vector.create(1, 0, -1))
  public packedVectorSpecialCases(vector: vector): void {
    const value = vector as unknown as Vector3;
    const expectedIndex = COMMON_VECTORS.findIndex(v => fuzzyEq(v, value));
    Assert.notEqual(-1, expectedIndex);

    const { buf } = this.serialize<Packed<Vector<u8>>>(value);
    Assert.defined(buf);
    Assert.equal(2, len(buf));

    const optimized = (readu8(buf, 0) & 1) === 1;
    Assert.true(optimized);

    const packed = readu8(buf, 1);
    Assert.equal(expectedIndex, packed);
  }

  @Fact
  public cframe(): void {
    const value = new CFrame(1, 2, 3);
    const { buf } = this.serialize<CFrame>(value);
    Assert.defined(buf);
    Assert.equal(18, len(buf));

    const x = readf32(buf, 6);
    const y = readf32(buf, 10);
    const z = readf32(buf, 14);
    Assert.equal(1, x);
    Assert.equal(2, y);
    Assert.equal(3, z);
  }

  @Fact
  public cframeCustom(): void {
    const value = new CFrame(1, 2, 3);
    const { buf } = this.serialize<Transform<u8>>(value);
    Assert.defined(buf);
    Assert.equal(9, len(buf));

    const x = readu8(buf, 6);
    const y = readu8(buf, 7);
    const z = readu8(buf, 8);
    Assert.equal(1, x);
    Assert.equal(2, y);
    Assert.equal(3, z);
  }

  @Fact
  public packedCFrameBothSpecialCases(): void {
    const value = new CFrame(0, 0, 0).mul(CFrame.Angles(0, 0, 0));
    const { buf } = this.serialize<Packed<Transform<u8>>>(value);
    Assert.defined(buf);
    Assert.equal(2, len(buf));

    const isOptimized = (readu8(buf, 0) & 1) === 1;
    Assert.true(isOptimized);

    const packed = readu8(buf, 1);
    const optimizedPosition = packed & 0x60;
    Assert.equal(0x20, optimizedPosition);

    const optimizedRotation = packed & 0x1F;
    Assert.notEqual(0x1F, optimizedRotation);
    Assert.equal(0, optimizedRotation);
  }

  @Theory
  @InlineData(Vector3.zero, 0x20)
  @InlineData(Vector3.one, 0x60)
  public packedCFramePositionSpecialCases(position: Vector3, bits: number): void {
    const value = new CFrame(position).mul(CFrame.Angles(rad(45), 0, 0));
    const { buf } = this.serialize<Packed<Transform<u8>>>(value);
    Assert.defined(buf);
    Assert.equal(8, len(buf));

    const isOptimized = (readu8(buf, 0) & 1) === 1;
    Assert.true(isOptimized);

    const packed = readu8(buf, 1);
    const optimizedPosition = packed & 0x60;
    Assert.equal(bits, optimizedPosition);

    const optimizedRotation = packed & 0x1F;
    Assert.equal(0x1F, optimizedRotation);
  }

  @Theory
  @InlineData(vector.zero)
  @InlineData(vector.create(0, 180, 0))
  @InlineData(vector.create(90, 0, 0))
  @InlineData(vector.create(-90, -180, 0))
  @InlineData(vector.create(0, 180, 180))
  @InlineData(vector.create(0, 0, 180))
  @InlineData(vector.create(-90, 0, 0))
  @InlineData(vector.create(90, 180, 0))
  @InlineData(vector.create(0, 180, 90))
  @InlineData(vector.create(0, 0, -90))
  @InlineData(vector.create(0, 90, 90))
  @InlineData(vector.create(0, -90, -90))
  @InlineData(vector.create(0, 0, 90))
  @InlineData(vector.create(0, -180, -90))
  @InlineData(vector.create(0, -90, 90))
  @InlineData(vector.create(0, 90, -90))
  @InlineData(vector.create(-90, -90, 0))
  @InlineData(vector.create(90, 90, 0))
  @InlineData(vector.create(0, -90, 0))
  @InlineData(vector.create(0, 90, 0))
  @InlineData(vector.create(90, -90, 0))
  @InlineData(vector.create(-90, 90, 0))
  @InlineData(vector.create(0, 90, 180))
  @InlineData(vector.create(0, -90, -180))
  public packedCFrameRotationSpecialCases({ x, y, z }: vector): void {
    const rotation = angles(rad(x), rad(y), rad(z));
    const expectedIndex = AXIS_ALIGNED_ORIENTATIONS.findIndex(v => v === rotation);
    Assert.notEqual(-1, expectedIndex);

    const value = new CFrame(0, 69, 0).mul(rotation);
    const { buf } = this.serialize<Packed<Transform<u8>>>(value);
    Assert.defined(buf);
    Assert.equal(5, len(buf));

    const isOptimized = (readu8(buf, 0) & 1) === 1;
    Assert.true(isOptimized);

    const packed = readu8(buf, 1);
    const optimizedPosition = packed & 0x60;
    Assert.notEqual(0x20, optimizedPosition);
    Assert.notEqual(0x60, optimizedPosition);

    const optimizedRotation = packed & 0x1F;
    Assert.notEqual(0x1F, optimizedRotation);
    Assert.equal(expectedIndex, optimizedRotation);
  }

  /** @metadata macro */
  private serialize<T>(value: T, meta?: Modding.Many<SerializeMetadata<T>>): SerializedData {
    const serializer = getSerializer<T>(meta);
    return serializer?.serialize(value)!;
  }
}

export = SerializationTest;
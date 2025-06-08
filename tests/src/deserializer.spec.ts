import type { Modding } from "@flamework/core";
import { Assert, Fact, Theory, InlineData } from "@rbxts/runit";

import {
  assertFuzzyEqual, assertVectorEqual, assertCFrameEqual, assertIterableEqual, getSerializer,
  type SerializeMetadata, type TestLiteralUnion, type TestObject, type TestPackedBooleans
} from "./utility";
import type {
  u8, u16, u24, u32, i8, i16, i24, i32, f16, f24, f32, f64,
  String, List, HashSet, HashMap, Vector,
  Transform,
  Packed
} from "../src/index";

const angles = CFrame.Angles;
const { rad } = math;

class DeserializationTest {
  @Fact
  public u8(): void {
    const n = 69;
    const result = this.deserialize<u8>(n);
    Assert.equal(n, result);
  }

  @Fact
  public u16(): void {
    const n = 42069;
    const result = this.deserialize<u16>(n);
    Assert.equal(n, result);
  }

  @Fact
  public u24(): void {
    const n = 6_942_069;
    const result = this.deserialize<u24>(n);
    Assert.equal(n, result);
  }

  @Fact
  public u32(): void {
    const n = 69_420_420;
    const result = this.deserialize<u32>(n);
    Assert.equal(n, result);
  }

  @Fact
  public i8(): void {
    const n = -69;
    const result = this.deserialize<i8>(n);
    Assert.equal(n, result);
  }

  @Fact
  public i16(): void {
    const n = -420;
    const result = this.deserialize<i16>(n);
    Assert.equal(n, result);
  }

  @Fact
  public i24(): void {
    const n = -69_420;
    const result = this.deserialize<i24>(n);
    Assert.equal(n, result);
  }

  @Fact
  public i32(): void {
    const n = -69_420_420;
    const result = this.deserialize<i32>(n);
    Assert.equal(n, result);
  }

  @Fact
  public f16(): void {
    const n = 69.42;
    const result = this.deserialize<f16>(n);
    assertFuzzyEqual(n, result, 5e-2);
  }

  @Fact
  public f24(): void {
    const n = 69.45;
    const result = this.deserialize<f24>(n);
    assertFuzzyEqual(n, result, 1e-3);
  }

  @Fact
  public f32(): void {
    const n = 69.420;
    const result = this.deserialize<f32>(n);
    assertFuzzyEqual(n, result, 1e-4);
  }

  @Fact
  public f64(): void {
    const n = 69.42069420;
    const result = this.deserialize<f64>(n);
    Assert.equal(n, result);
  }

  @Fact
  public string(): void {
    const s = "abc123";
    const result = this.deserialize<string>(s);
    Assert.equal(s, result);
  }

  @Fact
  public stringCustom(): void {
    const s = "abc123";
    const result = this.deserialize<String<u8>>(s);
    Assert.equal(s, result);
  }

  @Theory
  @InlineData(true)
  @InlineData(false)
  public boolean(value: boolean): void {
    const result = this.deserialize<boolean>(value);
    Assert.equal(value, result);
  }

  @Theory
  @InlineData("a")
  @InlineData("b")
  @InlineData("c")
  @InlineData("d")
  public literalUnions(value: TestLiteralUnion): void {
    const result = this.deserialize<TestLiteralUnion>(value);
    Assert.equal(value, result);
  }

  @Theory
  @InlineData(Enum.UserInputState.Begin)
  @InlineData(Enum.UserInputState.Change)
  @InlineData(Enum.UserInputState.End)
  @InlineData(Enum.UserInputState.Cancel)
  @InlineData(Enum.UserInputState.None)
  public enums(value: Enum.UserInputState): void {
    const result = this.deserialize<Enum.UserInputState>(value);
    Assert.equal(value, result);
  }

  @Fact
  public object(): void {
    const value: TestObject = { a: 69, b: false, c: "b", d: -42069 };
    const result = this.deserialize<TestObject>(value);
    Assert.equal(value.a, result.a);
    Assert.equal(value.b, result.b);
    Assert.equal(value.c, result.c);
    Assert.equal(value.d, result.d);
  }

  @Fact
  public optional(): void {
    {
      const value = { foo: 69 };
      const result = this.deserialize<{ foo?: u8 }>(value);
      Assert.defined(result.foo);
      Assert.equal(value.foo, result.foo);
    }
    {
      const result = this.deserialize<{ foo?: u8 }>({});
      Assert.undefined(result.foo);
    }
  }

  @Fact
  public packedOptionals(): void {
    const value = { foo: 69, bar: undefined };
    const result = this.deserialize<{ foo?: u8, bar?: u8 }>(value);
    Assert.equal(value.foo, result.foo);
    Assert.equal(value.bar, result.bar);
  }

  @Fact
  public packedBooleans(): void {
    const value: TestPackedBooleans = { a: true, b: false, c: true, d: false, e: true, f: false, g: true, h: false };
    const result = this.deserialize<TestPackedBooleans>(value);
    assertIterableEqual(value as never, result as never);
  }

  @Fact
  public array(): void {
    const value: u8[] = [1, 2, 3, 4];
    const result = this.deserialize(value);
    assertIterableEqual(value, result);
  }

  @Fact
  public arrayCustom(): void {
    const value: number[] = [1, 2, 3, 4];
    const result = this.deserialize<List<u8, u8>>(value);
    assertIterableEqual(value, result);
  }

  @Fact
  public set(): void {
    const value = new Set<TestLiteralUnion>(["a", "b", "c", "d"]);
    const result = this.deserialize(value);
    assertIterableEqual(value as never, result as never);
  }

  @Fact
  public setCustom(): void {
    const value = new Set<TestLiteralUnion>(["a", "b", "c", "d"]);
    const result = this.deserialize<HashSet<TestLiteralUnion, u8>>(value);
    assertIterableEqual(value as never, result as never);
  }

  @Fact
  public map(): void {
    const value = new Map<TestLiteralUnion, u8>([["a", 0], ["b", 1], ["c", 2], ["d", 3]]);
    const result = this.deserialize(value);
    assertIterableEqual(value as never, result as never);
  }

  @Fact
  public mapCustom(): void {
    const value = new Map<TestLiteralUnion, number>([["a", 0], ["b", 1], ["c", 2], ["d", 3]]);
    const result = this.deserialize<HashMap<TestLiteralUnion, u8, u8>>(value);
    assertIterableEqual(value as never, result as never);
  }

  @Fact
  public vector(): void {
    const value = new Vector3(1, 2, 3);
    const result = this.deserialize<Vector3>(value);
    assertVectorEqual(value, result);
  }

  @Fact
  public vectorCustom(): void {
    const value = new Vector3(1, 2, 3);
    const result = this.deserialize<Vector<u8>>(value);
    assertVectorEqual(value, result);
  }

  @Theory
  @InlineData(vector.zero)
  @InlineData(vector.one)
  @InlineData(vector.create(-1, 1, -1))
  @InlineData(vector.create(1, 0, 1))
  @InlineData(vector.create(0, 69, 0))
  public packedVectors(vec: vector): void {
    const result = this.deserialize<Packed<{ vec: Vector<u8> }>>({ vec: vec as never });
    assertVectorEqual(vec as never, result.vec);
  }

  @Fact
  public cframe(): void {
    const value = new CFrame(1, 2, 3).mul(CFrame.Angles(math.rad(45), 0, 0));
    const result = this.deserialize<CFrame>(value);
    assertCFrameEqual(value, result);
  }

  @Fact
  public cframeCustom(): void {
    const value = new CFrame(1, 2, 3).mul(CFrame.Angles(math.rad(45), 0, 0));
    const result = this.deserialize<Transform<u8>>(value);
    assertCFrameEqual(value, result);
  }

  @Theory
  @InlineData(Vector3.zero, vector.zero)
  @InlineData(Vector3.one, vector.zero)
  @InlineData(Vector3.zero, vector.create(45, 0, 0))
  @InlineData(Vector3.one, vector.create(45, 0, 0))
  @InlineData(new Vector3(0, 69, 0), vector.zero)
  @InlineData(new Vector3(0, 69, 0), vector.create(90, 0, 0))
  @InlineData(new Vector3(0, 69, 0), vector.create(45, 0, 0))
  public packedCFrames(position: Vector3, rotation: vector): void {
    const cf = new CFrame(position)
      .mul(angles(rad(rotation.x), rad(rotation.y), rad(rotation.z)));

    const result = this.deserialize<Packed<{ cf: Transform<u8> }>>({ cf });
    assertCFrameEqual(cf, result.cf);
  }

  /** @metadata macro */
  private deserialize<T>(value: T, meta?: Modding.Many<SerializeMetadata<T>>): T {
    const serializer = getSerializer<T>(meta);
    const data = serializer?.serialize(value)!;
    return serializer?.deserialize(data)!;
  }
}

export = DeserializationTest;
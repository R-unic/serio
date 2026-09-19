import type { Modding } from "@flamework/core";
import { Assert, Fact, Theory, InlineData } from "@rbxts/runit";

import {
  assertVectorEqual, assertCFrameEqual, assertIterableEqual, getSerializer,
  type SerializeMetadata, type TestLiteralUnion, type TestObject, type TestPackedBooleans,
  type TestMixedLiteralUnion, type TestTaggedUnion, type TestComplexUnion, type NullableLiteralUnion,
  type TestBinaryLiteral, type TestSingularObjectUnion, type TestManyOptionals, type TestConstantLiteral
} from "./utility";
import type {
  u8, u16, u32, i8, i16, i32, f16, f24, f32, f64,
  String, List, HashSet, HashMap, Vector,
  Transform,
  Packed, Tuple,
  f8,
  IntWithin, FloatWithin
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
  public i32(): void {
    const n = -69_420_420;
    const result = this.deserialize<i32>(n);
    Assert.equal(n, result);
  }

  @Fact
  public intWithinByteAligned(): void {
    const n = 200;
    const result = this.deserialize<IntWithin<0, 255>>(n);
    Assert.equal(n, result);
  }

  @Fact
  public intWithinPacking(): void {
    const value = { a: 69, b: 100 };
    const result = this.deserialize<Packed<{ a: IntWithin<0, 127>, b: IntWithin<0, 127>; }>>(value);
    Assert.equal(value.a, result.a);
    Assert.equal(value.b, result.b);
  }

  @Fact
  public intWithinNegativeRange(): void {
    const value = { a: -50, b: 12 };
    const result = this.deserialize<Packed<{ a: IntWithin<-64, 63>, b: IntWithin<-64, 63>; }>>(value);
    Assert.equal(value.a, result.a);
    Assert.equal(value.b, result.b);
  }

  @Fact
  public floatWithinByteAligned(): void {
    // 0-255 stepping by 1 needs exactly 8 bits, so no packing is required
    const n = 200;
    const result = this.deserialize<FloatWithin<0, 255, 1>>(n);
    Assert.equal(n, result);
  }

  @Fact
  public floatWithinPacking(): void {
    // 0-100 and -50-50 stepping by 2 each need 6 bits, which isn't byte-aligned, so they must be packed
    const value = { a: 42.5, b: -10 };
    const result = this.deserialize<Packed<{ a: FloatWithin<0, 100, 2>, b: FloatWithin<-50, 50, 2>; }>>(value);
    Assert.fuzzyEqual(value.a, result.a, 2);
    Assert.fuzzyEqual(value.b, result.b, 2);
  }

  @Fact
  public f8(): void {
    const n = 69.42;
    const result = this.deserialize<f8>(n);
    Assert.fuzzyEqual(n, result, 3);
  }

  @Fact
  public f8Negative(): void {
    const n = -69.42;
    const result = this.deserialize<f8>(n);
    Assert.fuzzyEqual(n, result, 3);
  }

  @Fact
  public f16(): void {
    const n = 69.42;
    const result = this.deserialize<f16>(n);
    Assert.fuzzyEqual(n, result, 5e-2);
  }

  @Fact
  public f16Negative(): void {
    const n = -69.42;
    const result = this.deserialize<f16>(n);
    Assert.fuzzyEqual(n, result, 5e-2);
  }

  @Fact
  public f24(): void {
    const n = 69.45;
    const result = this.deserialize<f24>(n);
    Assert.fuzzyEqual(n, result, 1e-3);
  }

  @Fact
  public f24Negative(): void {
    const n = -69.45;
    const result = this.deserialize<f24>(n);
    Assert.fuzzyEqual(n, result, 1e-3);
  }

  @Fact
  public f32(): void {
    const n = 69.420;
    const result = this.deserialize<f32>(n);
    Assert.fuzzyEqual(n, result, 1e-4);
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
  @InlineData(undefined)
  public nullableLiteralUnions(value: NullableLiteralUnion): void {
    const result = this.deserialize<NullableLiteralUnion>(value);
    Assert.equal(value, result);
  }

  @Theory
  @InlineData("a")
  @InlineData("b")
  @InlineData("c")
  @InlineData("d")
  public stringLiteralUnions(value: TestLiteralUnion): void {
    const result = this.deserialize<TestLiteralUnion>(value);
    Assert.equal(value, result);
  }

  @Theory
  @InlineData("a")
  @InlineData(69)
  @InlineData(true)
  public mixedLiteralUnions(value: TestMixedLiteralUnion): void {
    const result = this.deserialize<TestMixedLiteralUnion>(value);
    Assert.equal(value, result);
  }

  @Theory
  @InlineData({ tag: "a", value: 69 })
  @InlineData({ tag: "b", value: "hello!" })
  public taggedUnions(value: TestTaggedUnion): void {
    const result = this.deserialize<TestTaggedUnion>(value);
    Assert.isType<TestTaggedUnion>(result);
    Assert.equal(value.tag, result.tag);
    Assert.equal(result.value, value.value);
  }

  @Theory
  @InlineData("abc")
  @InlineData(69)
  @InlineData({ a: "foo" })
  @InlineData({ b: 420 })
  @InlineData(new Vector3(69, 0, 42))
  public complexUnions(value: TestComplexUnion): void {
    const result = this.deserialize<TestComplexUnion>(value);
    if (typeIs(value, "Vector3")) {
      Assert.any(["Vector3", "vector"], ty => Assert.isCheckableType(result, ty as never));

      const v = result as Vector3;
      Assert.equal(value.X, v.X);
      Assert.equal(value.Y, v.Y);
      Assert.equal(value.Z, v.Z);
      return;
    }

    if (!typeIs(result, "table"))
      return Assert.equal(value, result);

    Assert.true("a" in value || "b" in value);
    if ("a" in value) {
      Assert.hasProperty(result, "a");
      Assert.equal(value.a, (result as { a: unknown }).a);
    } else if ("b" in value) {
      Assert.hasProperty(result, "b");
      Assert.equal(value.b, (result as { b: unknown }).b);
    }
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
    const value = new CFrame(1, 2, 3).mul(angles(rad(45), 0, 0));
    const result = this.deserialize<CFrame>(value);
    assertCFrameEqual(value, result);
  }

  @Theory
  @InlineData(new CFrame(1, 2, 3).mul(angles(rad(45), 0, 0)))
  @InlineData(new CFrame(1, 2, 3).mul(angles(rad(45), 0, rad(69))))
  @InlineData(new CFrame(0, 69, 0))
  @InlineData(angles(0, rad(69), 0))
  public cframeCustom(value: CFrame): void {
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
  @InlineData(new Vector3(1, 2, 3), vector.create(45, 0, 69))
  @InlineData(new Vector3(1, 2, 3), vector.create(0, 180, 0))
  @InlineData(new Vector3(1, 2, 3), vector.create(0, -180, 0))
  public packedCFrames(position: Vector3, rotation: vector): void {
    const cf = new CFrame(position)
      .mul(angles(rad(rotation.x), rad(rotation.y), rad(rotation.z)));

    const result = this.deserialize<Packed<{ cf: Transform<u8> }>>({ cf });
    assertCFrameEqual(cf, result.cf);
  }

  @Fact
  public udim(): void {
    const value = new UDim(0.5, 100);
    const result = this.deserialize<UDim>(value);
    Assert.equal(value, result);
  }

  @Fact
  public udim2(): void {
    const value = UDim2.fromScale(0.3, 0.7);
    const result = this.deserialize<UDim2>(value);
    Assert.equal(value, result);
  }

  @Fact
  public udim2PackedSpecialCase(): void {
    const value = UDim2.fromScale(0.5, 0.5);
    const result = this.deserialize<Packed<{ ud: UDim2; }>>({ ud: value });
    Assert.equal(value, result.ud);
  }

  @Fact
  public rect(): void {
    const value = new Rect(10, 20, 300, 400);
    const result = this.deserialize<Rect>(value);
    Assert.equal(value, result);
  }

  @Theory
  @InlineData(Enum.UserInputState.Begin)
  @InlineData(Enum.UserInputState.Change)
  @InlineData(Enum.UserInputState.End)
  @InlineData(Enum.UserInputState.Cancel)
  @InlineData(Enum.UserInputState.None)
  public packedEnum(value: Enum.UserInputState): void {
    const result = this.deserialize<Packed<{ state: Enum.UserInputState, flag: boolean; }>>({ state: value, flag: true });
    Assert.equal(value, result.state);
    Assert.true(result.flag);
  }

  @Fact
  public color(): void {
    const value = Color3.fromRGB(200, 100, 50);
    const result = this.deserialize<Color3>(value);
    Assert.equal(value, result);
  }

  @Fact
  public numberSequence(): void {
    const value = new NumberSequence([
      new NumberSequenceKeypoint(0, 0),
      new NumberSequenceKeypoint(0.5, 0.75),
      new NumberSequenceKeypoint(1, 1)
    ]);
    const result = this.deserialize<NumberSequence>(value);
    Assert.equal(value.Keypoints.size(), result.Keypoints.size());

    for (const i of $range(1, value.Keypoints.size())) {
      const expected = value.Keypoints[i - 1];
      const actual = result.Keypoints[i - 1];
      Assert.fuzzyEqual(expected.Time, actual.Time, 1e-3);
      Assert.fuzzyEqual(expected.Value, actual.Value, 1e-3);
      Assert.fuzzyEqual(expected.Envelope, actual.Envelope, 1e-3);
    }
  }

  @Fact
  public colorSequence(): void {
    const value = new ColorSequence([
      new ColorSequenceKeypoint(0, Color3.fromRGB(10, 20, 30)),
      new ColorSequenceKeypoint(1, Color3.fromRGB(200, 150, 100))
    ]);
    const result = this.deserialize<ColorSequence>(value);
    Assert.equal(value.Keypoints.size(), result.Keypoints.size());

    for (const i of $range(1, value.Keypoints.size())) {
      const expected = value.Keypoints[i - 1];
      const actual = result.Keypoints[i - 1];
      Assert.fuzzyEqual(expected.Time, actual.Time, 1e-3);
      Assert.equal(expected.Value, actual.Value);
    }
  }

  @Fact
  public tuple(): void {
    const value: [u8, boolean, string] = [69, true, "hi"];
    const result = this.deserialize<[u8, boolean, string]>(value);
    assertIterableEqual(value as never, result as never);
  }

  @Fact
  public tupleWithRest(): void {
    const value: Tuple<[u8, ...u8[]], u8> = [1, 2, 3, 4] as never;
    const result = this.deserialize<Tuple<[u8, ...u8[]], u8>>(value);
    assertIterableEqual(value as never, result as never);
  }

  @Fact
  public blob(): void {
    const instance = new Instance("Folder");
    const result = this.deserialize<Instance>(instance);
    Assert.equal(instance, result);
  }

  @Fact
  public packedOptionalsReal(): void {
    const value = { foo: 69, bar: undefined as u8 | undefined };
    const result = this.deserialize<Packed<{ foo?: u8, bar?: u8; }>>(value);
    Assert.equal(value.foo, result.foo);
    Assert.equal(value.bar, result.bar);
  }

  @Fact
  public packedTaggedUnion(): void {
    const value: TestTaggedUnion = { tag: "a", value: 69 };
    const result = this.deserialize<Packed<TestTaggedUnion>>(value);
    Assert.isType<TestTaggedUnion>(result);
    Assert.equal(value.tag, result.tag);
    Assert.equal(result.value, value.value);
  }

  @Fact
  public packedLiteralUnion(): void {
    const result = this.deserialize<Packed<{ x: TestBinaryLiteral; }>>({ x: "a" });
    Assert.equal("a", result.x);
  }

  @Fact
  public guardUnionSingularObject(): void {
    const result = this.deserialize<TestSingularObjectUnion>({ tag: 5 });
    Assert.isType<{ tag: u8; }>(result);
    Assert.equal(5, (result as { tag: u8; }).tag);
  }

  @Fact
  public literalSingleConstant(): void {
    const value: TestConstantLiteral = { kind: "foo", value: 69 };
    const result = this.deserialize<TestConstantLiteral>(value);
    Assert.equal("foo", result.kind);
    Assert.equal(69, result.value);
  }

  @Fact
  public packedBooleansReal(): void {
    // uses a distinct `text` key (and explicit field order) so this doesn't collide, via the
    // shared serializer cache in ./utility, with SerializationTest's "Packed<TestPackedBooleans>" test
    const value: TestPackedBooleans = { a: true, b: false, c: true, d: false, e: true, f: false, g: true, h: false };
    const result = this.deserialize<Packed<TestPackedBooleans>>(value, {
      text: "Packed<TestPackedBooleans>RoundTrip",
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
    assertIterableEqual(value as never, result as never);
  }

  @Fact
  public packedManyOptionals(): void {
    // shares the explicit metadata (and `text` cache key) used by SerializationTest's test of the same name
    const value: TestManyOptionals = { a: 5, h: 9 };
    const result = this.deserialize<Packed<TestManyOptionals>>(value, {
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
    Assert.equal(5, result.a);
    Assert.equal(9, result.h);
    Assert.undefined(result.b);
    Assert.undefined(result.c);
    Assert.undefined(result.d);
    Assert.undefined(result.e);
    Assert.undefined(result.f);
    Assert.undefined(result.g);
  }

  @Fact
  public cframeIdentity(): void {
    const value = new CFrame();
    const result = this.deserialize<CFrame>(value);
    assertCFrameEqual(value, result);
  }

  @Fact
  public bufferResize(): void {
    const s = string.rep("a", 500);
    const result = this.deserialize<string>(s);
    Assert.equal(s, result);
  }

  /** @metadata macro */
  private deserialize<T>(value: T, meta?: Modding.Many<SerializeMetadata<T>>): T {
    const serializer = getSerializer<T>(meta);
    const data = serializer?.serialize(value)!;
    return serializer?.deserialize(data)!;
  }
}

export = DeserializationTest;
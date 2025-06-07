import type { Modding } from "@flamework/core";
import { Assert, Fact, Theory, InlineData } from "@rbxts/runit";

import { assertFuzzyEqual, assertIterableEqual, getSerializer, type TestLiteralUnion, type TestObject, type SerializeMetadata } from "./utility";
import type { u8, u16, u24, u32, i8, i16, i24, i32, f16, f24, f32, f64, String, List, HashSet, HashMap } from "../src/index";

const { len, readu8 } = buffer;

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

  /** @metadata macro */
  private deserialize<T>(value: T, meta?: Modding.Many<SerializeMetadata<T>>): T {
    const serializer = getSerializer<T>(meta);
    const data = serializer?.serialize(value)!;
    return serializer?.deserialize(data)!;
  }
}

export = DeserializationTest;
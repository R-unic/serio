import type { Modding } from "@flamework/core";
import { Assert, Fact } from "@rbxts/runit";

import { assertFuzzyEqual, getSerializer, type SerializeMetadata } from "./utility";
import type { u8, u16, u24, u32, i8, i16, i24, i32, f16, f24, f32, f64 } from "../src/index";

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
    const n = 69.6942069;
    const result = this.deserialize<f64>(n);
    Assert.equal(n, result);
  }

  /** @metadata macro */
  private deserialize<T>(value: T, meta?: Modding.Many<SerializeMetadata<T>>): T {
    const serializer = getSerializer<T>(meta);
    const data = serializer?.serialize(value)!;
    return serializer?.deserialize(data)!;
  }
}

export = DeserializationTest;
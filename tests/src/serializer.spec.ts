import { Assert, Fact, Theory, InlineData } from "@rbxts/runit";
import type { Modding } from "@flamework/core";

import { u24 as u24Utility } from "./utility/u24";
import { i24 as i24Utility } from "./utility/i24";
import { f24 as f24Utility } from "./utility/f24";
import { f16 as f16Utility } from "./utility/f16";
import type { Serializer, SerializerMetadata, SerializedData, u8, u16, u24, u32, i8, i16, i24, i32, f16, f24, f32, f64, String } from "./index";
import createSerializer from "./index"
import { deunify } from "@rbxts/flamework-meta-utils";

const { len, readu8, readu16, readu32, readi8, readi16, readi32, readf32, readf64, readstring } = buffer;

function fuzzyEqual(a: number, b: number, epsilon = 1e-6): void {
  Assert.true(math.abs(a - b) <= epsilon);
}

interface SerializeMetadata<T> {
  readonly text: Modding.Generic<T, "text">;
  readonly serializerMeta: Modding.Many<SerializerMetadata<T>>;
}

class SerializationTest {
  private readonly serializers = new Map<string, Serializer<any>>;

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
    fuzzyEqual(n, result, 0.05);
  }

  @Fact
  public f24(): void {
    const n = 69.45;
    const { buf } = this.serialize<f24>(n);
    Assert.defined(buf);
    Assert.equal(3, len(buf));

    const result = f24Utility.read(buf, 0);
    fuzzyEqual(n, result, 1e-3);
  }

  @Fact
  public f32(): void {
    const n = 69.420;
    const { buf } = this.serialize<f32>(n);
    Assert.defined(buf);
    Assert.equal(4, len(buf));

    const result = readf32(buf, 0);
    fuzzyEqual(n, result, 1e-4);
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
    const result = readstring(buf, 1, length);
    Assert.equal(s, result);
  }

  @Fact
  public boolean(): void {
    const value = true;
    const { buf } = this.serialize<boolean>(value);
    Assert.defined(buf);
    Assert.equal(1, len(buf));

    const result = readu8(buf, 0) === 1;
    Assert.equal(value, result);
  }

  @Fact
  public literalUnions(): void {
    type LiteralUnion = "a" | "b" | "c" | "d";
    const members = deunify<LiteralUnion>();

    const value: LiteralUnion = "d";
    const { buf } = this.serialize<LiteralUnion>(value);
    Assert.defined(buf);
    Assert.equal(1, len(buf));

    const index = readu8(buf, 0);
    Assert.equal(3, index);
    Assert.equal(value, members[index]);
  }

  @Fact
  public enums(): void {
    const value = Enum.UserInputState.Begin;
    const { buf } = this.serialize<Enum.UserInputState>(value);
    Assert.defined(buf);
    Assert.equal(1, len(buf));

    const index = readu8(buf, 0);
    Assert.equal(0, index);
  }

  /** @metadata macro */
  private serialize<T>(value: T, meta?: Modding.Many<SerializeMetadata<T>>): SerializedData {
    if (meta === undefined)
      return undefined!;

    const { text, serializerMeta } = meta;
    let serializer = this.serializers.get(text);
    if (serializer === undefined)
      this.serializers.set(text, serializer = createSerializer<T>(serializerMeta));

    return serializer.serialize(value);
  }
}

export = SerializationTest;
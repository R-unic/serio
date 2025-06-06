import { Assert, Fact, Theory, InlineData } from "@rbxts/runit";
import type { Modding } from "@flamework/core";

import { u24 as u24Utility } from "./utility/u24";
import { i24 as i24Utility } from "./utility/i24";
import { f24 as f24Utility } from "./utility/f24";
import { f16 as f16Utility } from "./utility/f16";
import type { Serializer, SerializerMetadata, SerializedData, u8, u16, u24, u32, i8, i16, i24, i32, f16, f24, f32 } from "./index";
import createSerializer from "./index"

const { len, readu8, readu16, readu32, readi8, readi16, readi32, readf32, readf64, readstring } = buffer;

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

  /** @metadata macro */
  private serialize<T>(value: T, meta?: Modding.Many<SerializeMetadata<T>>): SerializedData {
    if (meta === undefined)
      return undefined!;

    const { text, serializerMeta } = meta;
    print(text)
    let serializer = this.serializers.get(text);
    if (serializer === undefined)
      this.serializers.set(text, serializer = createSerializer<T>(serializerMeta));

    return serializer.serialize(value);
  }
}

export = SerializationTest;
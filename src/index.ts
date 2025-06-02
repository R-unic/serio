import type { Modding } from "@flamework/core";

import { getSerializeFunction } from "./serializer";
import { getDeserializeFunction } from "./deserializer";
import type { SerializerMetadata } from "./metadata";
import type { ProcessedInfo, SerializedData, SerializerSchema } from "./types";

class Serializer<T> {
  public readonly serialize: (value: T) => SerializedData;
  public readonly deserialize: (data: SerializedData) => T;

  public constructor(schema: SerializerSchema) {
    const info: ProcessedInfo = { schema, containsPacking: false, minimumPackedBits: 0 };
    this.serialize = getSerializeFunction(info);
    this.deserialize = getDeserializeFunction(info);
  }
}

export * from "./data-types";

/** @metadata macro */
export function createSerializer<T>(meta?: Modding.Many<SerializerMetadata<T>>): Serializer<T> {
  return new Serializer(meta as never);
}
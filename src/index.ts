import type { Modding } from "@flamework/core";

import { getSerializeFunction } from "./serializer";
import { getDeserializeFunction } from "./deserializer";
import { processInfo, type ProcessedInfo } from "./info-processing";
import type { SerializerMetadata } from "./metadata";
import type { SerializedData } from "./types";

export class Serializer<T> {
  public readonly serialize: (value: T) => SerializedData;
  public readonly deserialize: (data: SerializedData) => T;

  public constructor(info: ProcessedInfo) {
    this.serialize = getSerializeFunction(info);
    this.deserialize = getDeserializeFunction(info);
  }

  /** @metadata macro */
  public getSchema(meta?: Modding.Many<SerializerMetadata<T>>): SerializerMetadata<T> {
    assert(meta !== undefined);
    return meta;
  }
}

export * from "./data-types";
export { SerializerMetadata } from "./metadata";
export { SerializedData };

/** @metadata macro */
export default function createSerializer<T>(meta?: Modding.Many<SerializerMetadata<T>>): Serializer<T> {
  const processed = processInfo(meta as never);
  return new Serializer(processed);
}
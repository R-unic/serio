import type { Modding } from "@flamework/core";
import { Assert } from "@rbxts/runit";

import type { Serializer, SerializerMetadata } from "../src/index";
import createSerializer from "../src/index";

export interface SerializeMetadata<T> {
  readonly text: Modding.Generic<T, "text">;
  readonly serializerMeta: Modding.Many<SerializerMetadata<T>>;
}

const serializers = new Map<string, Serializer<any>>;

/** @metadata macro */
export function getSerializer<T>(meta?: SerializeMetadata<T>): Serializer<T> | undefined {
  if (meta === undefined) return;

  const { text, serializerMeta } = meta;
  let serializer = serializers.get(text);
  if (serializer === undefined)
    serializers.set(text, serializer = createSerializer<T>(serializerMeta));

  return serializer;
}

export function assertFuzzyEqual(a: number, b: number, epsilon = 1e-6): void {
  Assert.true(math.abs(a - b) <= epsilon);
}
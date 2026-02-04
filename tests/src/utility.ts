import type { Modding } from "@flamework/core";
import { Assert } from "@rbxts/runit";

import type { Serializer, SerializerMetadata, SerializedData, String, Vector, u8, i32, u16 } from "../src/index";
import createSerializer from "../src/index";

export type NullableLiteralUnion = TestLiteralUnion | undefined;
export type TestLiteralUnion = "a" | "b" | "c" | "d";
export type TestMixedLiteralUnion = "a" | 69 | true;
export type TestTaggedUnion = { tag: "a", value: u8 } | { tag: "b", value: String<u8> };
export type TestComplexUnion = String<u8> | u8 | { a: String<u8> } | { b: u16 } | Vector<u8>;

export interface TestObject {
  readonly a: u8;
  readonly b: boolean;
  readonly c: "a" | "b" | "c";
  readonly d: i32;
}

export interface TestPackedBooleans {
  readonly a: boolean;
  readonly b: boolean;
  readonly c: boolean;
  readonly d: boolean;
  readonly e: boolean;
  readonly f: boolean;
  readonly g: boolean;
  readonly h: boolean;
}

export interface SerializeMetadata<T> {
  readonly text: Modding.Generic<T, "text">;
  readonly serializerMeta: SerializerMetadata<T>;
}

const serializers = new Map<string, Serializer<any>>;

/** @metadata macro */
export function getSerializer<T>(meta?: SerializeMetadata<T>): Serializer<T> | undefined {
  if (meta === undefined) return;

  const { text, serializerMeta } = meta;
  let serializer = serializers.get(text);
  if (!serializer)
    serializers.set(text, serializer = createSerializer<T>(serializerMeta as never));

  return serializer;
}

/** shallow */
export function assertIterableEqual(expected: defined[], actual: defined[]): void {
  Assert.equal(expected.size(), actual.size());

  // mega hack
  for (const [key, element] of pairs(expected as unknown as ReadonlyMap<string | number, unknown>)) {
    const resultElement = (actual as unknown as ReadonlyMap<string | number, unknown>).get(key);
    Assert.defined(resultElement);
    Assert.equal(element, resultElement);
  }
}

export function assertCFrameEqual(expected: CFrame, actual: CFrame, angleEpsilon = 1e-2 * 5): void {
  Assert.appendFailedMessage("CFrame X Coordinate", () =>
    Assert.equal(expected.X, actual.X)
  );
  Assert.appendFailedMessage("CFrame Y Coordinate", () =>
    Assert.equal(expected.Y, actual.Y)
  );
  Assert.appendFailedMessage("CFrame Z Coordinate", () =>
    Assert.equal(expected.Z, actual.Z)
  );

  Assert.appendFailedMessage("CFrame Rotation NaN Check", () => {
    assertNotNaNVector(expected.XVector);
    assertNotNaNVector(expected.YVector);
    assertNotNaNVector(expected.ZVector);
  });
  assertVectorFuzzyEqual(expected.XVector, actual.XVector, angleEpsilon, "CFrame X Vector");
  assertVectorFuzzyEqual(expected.YVector, actual.YVector, angleEpsilon, "CFrame Y Vector");
  assertVectorFuzzyEqual(expected.ZVector, actual.ZVector, angleEpsilon, "CFrame Z Vector");
}

export function assertVectorFuzzyEqual(expected: Vector3, actual: Vector3, epsilon = 1e-6, extraMessage?: string): void {
  const extra = extraMessage === undefined ? "" : extraMessage + " ";
  Assert.appendFailedMessage(extra + "X Coordinate", () =>
    Assert.fuzzyEqual(expected.X, actual.X, epsilon)
  );
  Assert.appendFailedMessage(extra + "Y Coordinate", () =>
    Assert.fuzzyEqual(expected.Y, actual.Y, epsilon)
  );
  Assert.appendFailedMessage(extra + "Z Coordinate", () =>
    Assert.fuzzyEqual(expected.Z, actual.Z, epsilon)
  );
}

const NaN = 0 / 0;
export function assertNotNaNVector(vector: Vector3): void {
  Assert.notEqual(vector.X, NaN);
  Assert.notEqual(vector.Y, NaN);
  Assert.notEqual(vector.Z, NaN);
}

export function assertVectorEqual(expected: Vector3, actual: Vector3): void {
  Assert.equal(expected.X, actual.X);
  Assert.equal(expected.Y, actual.Y);
  Assert.equal(expected.Z, actual.Z);
}

export class BaseSerializationTest {
  /** @metadata macro */
  protected serialize<T>(value: T, meta?: Modding.Many<SerializeMetadata<T>>): SerializedData {
    const serializer = getSerializer<T>(meta)!;
    return serializer.serialize(value);
  }
}
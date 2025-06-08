import type { Modding } from "@flamework/core";
import { Assert } from "@rbxts/runit";

import { isNaN } from "../src/utility/index";
import type { Serializer, SerializerMetadata, u8, i32 } from "../src/index";
import createSerializer from "../src/index";

export type TestLiteralUnion = "a" | "b" | "c" | "d";
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

export function assertCFrameEqual(expected: CFrame, actual: CFrame, angleEpsilon = 1e-4): void {
  Assert.equal(expected.X, actual.X);
  Assert.equal(expected.Y, actual.Y);
  Assert.equal(expected.Z, actual.Z);

  assertVectorFuzzyEqual(expected.XVector, actual.XVector, angleEpsilon);
  assertVectorFuzzyEqual(expected.YVector, actual.YVector, angleEpsilon);
  assertVectorFuzzyEqual(expected.ZVector, actual.ZVector, angleEpsilon);
}

export function assertVectorFuzzyEqual(expected: Vector3, actual: Vector3, epsilon = 1e-6): void {
  assertFuzzyEqual(expected.X, actual.X, epsilon);
  assertFuzzyEqual(expected.Y, actual.Y, epsilon);
  assertFuzzyEqual(expected.Z, actual.Z, epsilon);
}

export function assertVectorEqual(expected: Vector3, actual: Vector3): void {
  Assert.equal(expected.X, actual.X);
  Assert.equal(expected.Y, actual.Y);
  Assert.equal(expected.Z, actual.Z);
}

export function assertFuzzyEqual(a: number, b: number, epsilon = 1e-6): void {
  Assert.true(math.abs(a - b) <= epsilon);
}
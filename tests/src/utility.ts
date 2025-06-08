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
  Assert.appendFailedMessage("CFrame X Coordinate", () =>
    Assert.equal(expected.X, actual.X)
  );
  Assert.appendFailedMessage("CFrame Y Coordinate", () =>
    Assert.equal(expected.Y, actual.Y)
  );
  Assert.appendFailedMessage("CFrame Z Coordinate", () =>
    Assert.equal(expected.Z, actual.Z)
  );

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

export function assertVectorEqual(expected: Vector3, actual: Vector3): void {
  Assert.equal(expected.X, actual.X);
  Assert.equal(expected.Y, actual.Y);
  Assert.equal(expected.Z, actual.Z);
}
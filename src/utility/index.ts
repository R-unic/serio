import { IS_LUNE } from "../constants";
import type { NumberType, Primitive } from "../types";

const { sort } = table;
const { magnitude } = vector;

export * from "./fastcalls";

export function fuzzyEq(a: Vector3, b: Vector3, epsilon = 1e-6): boolean {
  if (IS_LUNE) {
    if (typeOf(a) === "vector")
      a = new Vector3(a.X, a.Y, a.Z);
    if (typeOf(b) === "vector")
      b = new Vector3(b.X, b.Y, b.Z);
  }

  let difference = a.sub(b) as unknown as vector;
  if (IS_LUNE && typeIs(difference, "Vector3"))
    difference = vector.create(difference.X, difference.Y, difference.Z);

  return magnitude(difference) <= epsilon;
}

/**
 * Returns a consistently ordered array for a specific Enum.
 *
 * We can't send Enum values over the network as the values aren't always within the 8 bit limit,
 * so instead we send the EnumItem's position in the array returned here.
 */
export function getSortedEnumItems(enumObject: Enum): EnumItem[] {
  const enumItems = enumObject.GetEnumItems();
  sort(enumItems, (a, b) => a.Value < b.Value);

  return enumItems;
}

const numberTypeSizes: Record<NumberType, number> = {
  u8: 1, i8: 1,
  u16: 2, i16: 2, f16: 2,
  u24: 3, i24: 3, f24: 3,
  u32: 4, i32: 4, f32: 4,
  f64: 8,
};

export function sizeOfNumberType([kind]: Primitive<NumberType>): number {
  return numberTypeSizes[kind];
}

export function sign(n: number): -1 | 1 {
  return n < 0 ? -1 : 1;
}
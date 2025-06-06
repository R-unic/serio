import type { NumberType, Primitive } from "../types";

const { info } = debug;
const { sort } = table;
const { magnitude } = vector;

type CF__index = <K extends keyof CFrame>(cf: CFrame, index: K) => CFrame[K];
export const CF__index = select(2, xpcall(
  // retarded never cast to avoid roblox-ts error 'Cannot index a method without calling it!'
  () => CFrame.identity[undefined! as keyof CFrame] as never,
  () => info(2, "f")[0]
))[0] as CF__index;

export function fuzzyEq(a: Vector3, b: Vector3, epsilon = 1e-6): boolean {
  return magnitude(a.sub(b) as never) <= epsilon;
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
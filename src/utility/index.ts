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

export function sizeOfNumberType([kind]: Primitive<NumberType>): number {
  switch (kind) {
    case "u8":
    case "i8":
      return 1;

    case "u16":
    case "i16":
    case "f16":
      return 2;

    case "u24":
    case "i24":
    case "f24":
      return 3;

    case "u32":
    case "i32":
    case "f32":
      return 4;

    case "f64":
      return 8;
  }
}

export function sign(n: number): -1 | 1 {
  return n < 0 ? -1 : 1;
}
import type { Modding } from "@flamework/core";

import type { AnySize } from "./types";
import type { f16_meta, f24_meta, f32_meta, f64_meta, i16_meta, i24_meta, i32_meta, i8_meta, list_meta, map_meta, packed_meta, set_meta, string_meta, transform_meta, tuple_meta, u16_meta, u24_meta, u32_meta, u8_meta, udim2_meta, udim_meta, vector_meta } from "./meta-symbols";

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32];
type StripMeta<T, Depth extends number = 32> =
  [Depth] extends [never]
  ? T
  : T extends string | number | boolean | undefined
  ? T
  : T extends Callback
  ? T
  : T extends Vector
  ? Vector3
  : T extends Transform
  ? CFrame
  : T extends String
  ? string
  : T extends buffer
  ? buffer
  : T extends Packed<infer V>
  ? StripMeta<V, Prev[Depth]>
  : T extends List<infer V>
  ? StripMeta<V, Prev[Depth]>
  : T extends Tuple<infer V>
  ? StripMeta<V, Prev[Depth]>
  : T extends HashSet<infer V>
  ? StripMeta<V, Prev[Depth]>
  : T extends { readonly [set_meta]?: infer V extends unknown[] }
  ? Map<StripMeta<V[number], Prev[Depth]>, StripMeta<V[number], Prev[Depth]>>
  : T extends HashMap<infer K, infer V>
  ? Map<StripMeta<K, Prev[Depth]>, StripMeta<V, Prev[Depth]>>
  : T extends { readonly [map_meta]?: [infer V] }
  ? Map<StripMeta<V, Prev[Depth]>, StripMeta<V, Prev[Depth]>>
  : T extends u8 | u16 | u24 | u32 | i8 | i16 | i24 | i32 | f16 | f24 | f32 | f64
  ? number
  : T extends Color3
  ? { R: number, G: number, B: number }
  : T extends readonly (infer U)[]
  ? readonly StripMeta<U, Prev[Depth]>[]
  : T extends ReadonlyMap<unknown, unknown>
  ? T
  : T extends object
  ? {
    [K in keyof T as
    K extends symbol ? never : K
    ]: StripMeta<T[K], Prev[Depth]>
  }
  : T;

export type SchemaGuard<T> = Modding.Generic<StripMeta<T>, "guard">;

export type u8 = number & { readonly [u8_meta]?: never };
export type u16 = number & { readonly [u16_meta]?: never };
export type u24 = number & { readonly [u24_meta]?: never };
export type u32 = number & { readonly [u32_meta]?: never };
export type i8 = number & { readonly [i8_meta]?: never };
export type i16 = number & { readonly [i16_meta]?: never };
export type i24 = number & { readonly [i24_meta]?: never };
export type i32 = number & { readonly [i32_meta]?: never };
export type f16 = number & { readonly [f16_meta]?: never };
export type f24 = number & { readonly [f24_meta]?: never };
export type f32 = number & { readonly [f32_meta]?: never };
export type f64 = number & { readonly [f64_meta]?: never };

export type String<LengthType extends AnySize = u32> = string & { readonly [string_meta]?: [LengthType] };

/** UDim */
export type ScaleOffset<
  Scale extends number = f32,
  Offset extends number = u16
> = UDim & { readonly [udim_meta]?: [Scale, Offset] };

/** UDim2 */
export type ScaleOffset2<
  ScaleX extends number = f32,
  OffsetX extends number = u16,
  ScaleY extends number = ScaleX,
  OffsetY extends number = OffsetX
> = UDim2 & { readonly [udim2_meta]?: [ScaleX, OffsetX, ScaleY, OffsetY] };

/** Vector3 */
export type Vector<
  X extends number = f32,
  Y extends number = X,
  Z extends number = X
> = Vector3 & { readonly [vector_meta]?: [X, Y, Z] };

/** CFrame */
export type Transform<
  X extends number = f32,
  Y extends number = X,
  Z extends number = X
> = CFrame & { readonly [transform_meta]?: [X, Y, Z] };

/** T[] */
export type List<T, LengthType extends AnySize = u32> =
  T[] & { readonly [list_meta]?: [T, LengthType] };

/** [A, B, C] */
export type Tuple<T extends unknown[], LengthType extends AnySize = u32> =
  T & { readonly [tuple_meta]?: [T, LengthType] };

/** Set<T> */
export type HashSet<T, LengthType extends AnySize = u32> =
  Set<T> & { readonly [set_meta]?: [T, LengthType] };

/** Map<K, V> */
export type HashMap<K, V, LengthType extends AnySize = u32> =
  Map<K, V> & { readonly [map_meta]?: [K, V, LengthType] };

/** Bitpacks all descendant fields */
export type Packed<T> = T & { readonly [packed_meta]?: [T] };
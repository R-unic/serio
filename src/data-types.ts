import type { AnySize } from "./types";

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32];
export type StripMeta<T, Depth extends number = 32> =
  [Depth] extends [never]
  ? T
  : StripMetaStep<T, Depth>;

type Primitive =
  | string
  | number
  | boolean
  | undefined;

type IsPrimitiveLike<T> =
  [T] extends [Primitive] ? true :
  T extends number ? true :
  T extends string ? true :
  T extends boolean ? true :
  false;

type NormalizePrimitive<T> =
  IsPrimitiveLike<T> extends true
  ? T extends number
  ? number
  : T extends string
  ? string
  : T extends boolean
  ? boolean
  : T
  : T;

type StripMetaProps<T> = {
  [K in keyof T as
  K extends symbol
  ? never
  : K extends `_${string}`
  ? never
  : K
  ]: T[K]
};

type StripMetaStep<T, Depth extends number> =
  IsPrimitiveLike<T> extends true
  ? NormalizePrimitive<T>
  : T extends Vector
  ? Vector3
  : T extends Transform
  ? CFrame
  : T extends ScaleOffset
  ? UDim
  : T extends ScaleOffset2
  ? UDim2
  : T extends String
  ? string
  : T extends buffer
  ? buffer
  : T extends Callback
  ? T
  : T extends readonly (infer U)[]
  ? readonly StripMeta<U, Prev[Depth]>[]
  : T extends { readonly _packed?: [infer V] }
  ? StripMeta<V, Prev[Depth]>
  : T extends List<infer V>
  ? StripMeta<V, Prev[Depth]>[]
  : T extends Tuple<infer V>
  ? { [K in keyof V]: StripMeta<V[K], Prev[Depth]> }
  : T extends HashSet<infer V>
  ? Set<StripMeta<V, Prev[Depth]>>
  : T extends HashMap<infer K, infer V>
  ? Map<StripMeta<K, Prev[Depth]>, StripMeta<V, Prev[Depth]>>
  : T extends object
  ? {
    [K in keyof StripMetaProps<T>]: StripMeta<StripMetaProps<T>[K], Prev[Depth]>
  }
  : T;

export type u8 = number & { readonly _u8?: never };
export type u16 = number & { readonly _u16?: never };
export type u24 = number & { readonly _u24?: never };
export type u32 = number & { readonly _u32?: never };
export type i8 = number & { readonly _i8?: never };
export type i16 = number & { readonly _i16?: never };
export type i24 = number & { readonly _i24?: never };
export type i32 = number & { readonly _i32?: never };
export type f16 = number & { readonly _f16?: never };
export type f24 = number & { readonly _f24?: never };
export type f32 = number & { readonly _f32?: never };
export type f64 = number & { readonly _f64?: never };

export type String<LengthType extends AnySize = u32> = string & { readonly _string?: [LengthType] };

/** UDim */
export type ScaleOffset<
  Scale extends number = f32,
  Offset extends number = u16
> = UDim & { readonly _udim?: [Scale, Offset] };

/** UDim2 */
export type ScaleOffset2<
  ScaleX extends number = f32,
  OffsetX extends number = u16,
  ScaleY extends number = ScaleX,
  OffsetY extends number = OffsetX
> = UDim2 & { readonly _udim2?: [ScaleX, OffsetX, ScaleY, OffsetY] };

/** Vector3 */
export type Vector<
  X extends number = f32,
  Y extends number = X,
  Z extends number = X
> = Vector3 & { readonly _vector?: [X, Y, Z] };

/** CFrame */
export type Transform<
  X extends number = f32,
  Y extends number = X,
  Z extends number = X
> = CFrame & { readonly _cf?: [X, Y, Z] };

/** T[] */
export type List<T, LengthType extends AnySize = u32> =
  T[] & { readonly _list?: [T, LengthType] };

/** [A, B, C] */
export type Tuple<T extends unknown[], LengthType extends AnySize = u32> =
  T & { readonly _tuple?: [T, LengthType] };

/** Set<T> */
export type HashSet<T, LengthType extends AnySize = u32> =
  Set<T> & { readonly _set?: [T, LengthType] };

/** Map<K, V> */
export type HashMap<K, V, LengthType extends AnySize = u32> =
  Map<K, V> & { readonly _map?: [K, V, LengthType] };

/** Bitpacks all descendant fields */
export type Packed<T> = T & { readonly _packed?: [T] };
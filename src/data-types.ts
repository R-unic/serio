import type { AnySize } from "./types";

export type u8 = number & { /* @hidden */ _u8?: never };
export type u16 = number & { /* @hidden */ _u16?: never };
export type u24 = number & { /* @hidden */ _u24?: never };
export type u32 = number & { /* @hidden */ _u32?: never };
export type i8 = number & { /* @hidden */ _i8?: never };
export type i16 = number & { /* @hidden */ _i16?: never };
export type i24 = number & { /* @hidden */ _i24?: never };
export type i32 = number & { /* @hidden */ _i32?: never };
export type f16 = number & { /* @hidden */ _f16?: never };
export type f24 = number & { /* @hidden */ _f24?: never };
export type f32 = number & { /* @hidden */ _f32?: never };
export type f64 = number & { /* @hidden */ _f64?: never };

export type String<LengthType extends AnySize = u32> = string & { /* @hidden */ _string?: [LengthType] };

/** Vector3 */
export type Vector<
  X extends number = f32,
  Y extends number = X,
  Z extends number = X
> = Vector3 & { /* @hidden */ _vector?: [X, Y, Z] };

/** CFrame */
export type Transform<
  X extends number = f32,
  Y extends number = X,
  Z extends number = X
> = CFrame & { /* @hidden */ _cf?: [X, Y, Z] };

/** T[] */
export type List<T, LengthType extends AnySize = u32> =
  T[] & { /* @hidden */ _list?: [T, LengthType] };

/** [T] */
export type Tuple<T extends unknown[], LengthType extends AnySize = u32> =
  T & { /* @hidden */ _tuple?: [T, LengthType] };

/** Set<T> */
export type HashSet<T, LengthType extends AnySize = u32> =
  Set<T> & { /* @hidden */ _set?: [T, LengthType] };

/** Map<K, V> */
export type HashMap<K, V, LengthType extends AnySize = u32> =
  Map<K, V> & { /* @hidden */ _map?: [K, V, LengthType] };

/** Bitpacks all descendant fields */
export type Packed<T> = T & { /* @hidden */ _packed?: [T] };
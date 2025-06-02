export type u8 = number & { _u8?: never };
export type u16 = number & { _u16?: never };
export type u32 = number & { _u32?: never };
export type i8 = number & { _i8?: never };
export type i16 = number & { _i16?: never };
export type i32 = number & { _i32?: never };
export type f16 = number & { _f16?: never };
export type f24 = number & { _f24?: never };
export type f32 = number & { _f32?: never };
export type f64 = number & { _f64?: never };

/** Vector3 */
export type Vector<
  X extends number = f32,
  Y extends number = X,
  Z extends number = X
> = Vector3 & { _vector?: [X, Y, Z] };

/** CFrame */
export type Transform<
  X extends number = f32,
  Y extends number = X,
  Z extends number = X
> = CFrame & { _cf?: [X, Y, Z] };

/** T[] */
export type List<T, Size extends number> = T[] & { _list?: [T, Size] };
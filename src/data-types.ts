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
export type Vector<T extends number> = Vector3 & { _vector?: [T] };
export type List<T, Size extends number> = T[] & { _list?: [T, Size] };

export type Packed<T> = T & { _packed?: [T] };
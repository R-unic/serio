import type { Modding } from "@flamework/core";

import type { FindDiscriminator, HasNominal, HasSingularObjectConstituent, IsDiscriminableUnion, IsLiteralUnion, IsTableObject, IsUnion } from "./unions";
import type { HasRest, RestType, SplitRest } from "./tuples";
import type { StripMeta, f32, u16, u32, u8 } from "../data-types";

type GetEnumType<T> = [T] extends [EnumItem] ? ExtractKeys<Enums, T["EnumType"]> : never;

/** A shortcut for defining Roblox datatypes (which map directly to a simple type) */
interface DataTypes {
  readonly numbersequence: NumberSequence;
  readonly colorsequence: ColorSequence;
  readonly color: Color3;
}

type TupleMetadata<T extends unknown[]> =
  ["_tuple", T] extends [keyof T, { readonly _tuple?: [infer V extends unknown[], infer RestLengthType]; }]
  ? [
    "tuple",
    SplitRest<V> extends infer A ? { [K in keyof A]: SerializerMetadata<A[K]> } : never,
    HasRest<V> extends true ? SerializerMetadata<RestType<V>> : undefined,
    HasRest<V> extends true ? SerializerMetadata<RestLengthType> : undefined
  ]
  : [
    "tuple",
    SplitRest<T> extends infer A ? { [K in keyof A]: SerializerMetadata<A[K]> } : never,
    HasRest<T> extends true ? SerializerMetadata<RestType<T>> : undefined,
    HasRest<T> extends true ? SerializerMetadata<u32> : undefined
  ];

type ListMetadata<T extends unknown[]> =
  ["_list", T] extends [keyof T, { readonly _list?: [infer V, infer Size]; }]
  ? ["list", SerializerMetadata<V>, SerializerMetadata<Size>]
  : ["list", SerializerMetadata<T[number]>, SerializerMetadata<u32>];

type ArrayMetadata<T extends unknown[]> = [T] extends [{ length: number }]
  ? TupleMetadata<T>
  : ListMetadata<T>;

type IsExactlyBoolean<T> =
  [T] extends [boolean]
  ? ([boolean] extends [T] ? true : false)
  : false;

export type SerializerMetadata<T> =
  IsExactlyBoolean<T> extends true
  ? ["bool"]
  : IsLiteralUnion<T> extends true
  ? ["literal", NonNullable<T>[], true extends IsUnion<T> ? (undefined extends T ? 1 : 0) : -1]
  : unknown extends T
  ? ["optional", ["blob"]]
  : ["_packed", T] extends [keyof T, { readonly _packed?: [infer V] }]
  ? ["packed", SerializerMetadata<V>]
  : undefined extends T
  ? ["optional", SerializerMetadata<NonNullable<T>>]
  : keyof T extends never
  ? ["blob"]
  : [T] extends [{ readonly _f64?: never }]
  ? ["f64"] // u4
  : [T] extends [{ readonly _f32?: never }]
  ? ["f32"]
  : [T] extends [{ readonly _f24?: never }]
  ? ["f24"]
  : [T] extends [{ readonly _f16?: never }]
  ? ["f16"]
  : [T] extends [{ readonly _u8?: never }]
  ? ["u8"]
  : [T] extends [{ readonly _u16?: never }]
  ? ["u16"]
  : [T] extends [{ readonly _u12?: never }]
  ? ["u12"]
  : [T] extends [{ readonly _u24?: never }]
  ? ["u24"]
  : [T] extends [{ readonly _u32?: never }]
  ? ["u32"]
  : [T] extends [{ readonly _i8?: never }]
  ? ["i8"]
  : [T] extends [{ readonly _i12?: never }]
  ? ["i12"]
  : [T] extends [{ readonly _i16?: never }]
  ? ["i16"]
  : [T] extends [{ readonly _i24?: never }]
  ? ["i24"]
  : [T] extends [{ readonly _i32?: never }]
  ? ["i32"]
  : [T] extends [boolean]
  ? ["bool"]
  : [T] extends [number]
  ? ["f32"]
  : ["_string", T] extends [keyof T, { readonly _string?: [infer V] }]
  ? ["string", SerializerMetadata<V>]
  : [T] extends [string]
  ? ["string", SerializerMetadata<u32>]
  : ["_udim", T] extends [keyof T, { readonly _udim?: [infer Scale, infer Offset] }]
  ? ["udim", SerializerMetadata<Scale>, SerializerMetadata<Offset>]
  : [T] extends [UDim]
  ? ["udim", SerializerMetadata<f32>, SerializerMetadata<u16>]
  : ["_udim2", T] extends [keyof T, { readonly _udim2?: [infer ScaleX, infer OffsetX, infer ScaleY, infer OffsetY] }]
  ? ["udim2", SerializerMetadata<ScaleX>, SerializerMetadata<OffsetX>, SerializerMetadata<ScaleY>, SerializerMetadata<OffsetY>]
  : [T] extends [UDim2]
  ? ["udim2", SerializerMetadata<f32>, SerializerMetadata<u16>, SerializerMetadata<f32>, SerializerMetadata<u16>]
  : ["_vector", T] extends [keyof T, { readonly _vector?: [infer X, infer Y, infer Z] }]
  ? ["vector", SerializerMetadata<X>, SerializerMetadata<Y>, SerializerMetadata<Z>]
  : [T] extends [Vector3]
  ? ["vector", SerializerMetadata<f32>, SerializerMetadata<f32>, SerializerMetadata<f32>]
  : ["_cf", T] extends [keyof T, { readonly _cf?: [infer X, infer Y, infer Z] }]
  ? ["cframe", SerializerMetadata<X>, SerializerMetadata<Y>, SerializerMetadata<Z>]
  : [T] extends [CFrame]
  ? ["cframe", SerializerMetadata<f32>, SerializerMetadata<f32>, SerializerMetadata<f32>]
  : ["_set", T] extends [keyof T, { readonly _set?: [infer V, infer LengthType] }]
  ? ["set", SerializerMetadata<V>, SerializerMetadata<LengthType>]
  : [T] extends [ReadonlySet<infer V>]
  ? ["set", SerializerMetadata<V>, SerializerMetadata<u32>]
  : ["_map", T] extends [keyof T, { readonly _map?: [infer K, infer V, infer LengthType] }]
  ? ["map", SerializerMetadata<K>, SerializerMetadata<V>, SerializerMetadata<LengthType>]
  : [T] extends [ReadonlyMap<infer K, infer V>]
  ? ["map", SerializerMetadata<K>, SerializerMetadata<V>, SerializerMetadata<u32>]
  : [T] extends [DataTypes[keyof DataTypes]]
  ? [ExtractKeys<DataTypes, T>]
  : [T] extends [unknown[]]
  ? ArrayMetadata<T>
  : [T] extends [EnumItem]
  ? ["enum", GetEnumType<T>]
  : IsDiscriminableUnion<T> extends true
  ? [
    "union",
    FindDiscriminator<T>,
    FindDiscriminator<T> extends infer D
    ? (T extends T ? [T[D & keyof T], SerializerMetadata<Omit<T, D & keyof T>>] : never)[]
    : never,
    // This is the byte size length. This is annoying (and slow) to calculate in TS, so it's done at runtime.
    -1,
  ]
  : IsUnion<T> extends true
  ? [
    "guard_union",
    (HasSingularObjectConstituent<T> extends infer U
      ? T extends T
      ? [IsTableObject<T>, U] extends [true, true]
      ? [SerializerMetadata<T>, undefined]
      : [SerializerMetadata<T>, Modding.Generic<StripMeta<T>, "guard">]
      : never
      : never)[],
  ]
  : true extends HasNominal<keyof T>
  ? ["blob"]
  : T extends object
  ? [
    "object",
    {
      [K in keyof T]-?: [K, SerializerMetadata<T[K]>];
    }[keyof T][],
  ]
  : ["blob"];
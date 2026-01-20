import type { Modding } from "@flamework/core";

import type { FindDiscriminator, HasNominal, HasSingularObjectConstituent, IsDiscriminableUnion, IsLiteralUnion, IsTableObject, IsUnion } from "./unions";
import type { HasRest, RestType, SplitRest } from "./tuples";
import type { StripMeta, f16, f24, f32, f64, i16, i24, i32, i8, u16, u24, u32, u8 } from "../data-types";
import type { f16_meta, f24_meta, f32_meta, f64_meta, i16_meta, i24_meta, i32_meta, i8_meta, list_meta, map_meta, packed_meta, set_meta, string_meta, transform_meta, tuple_meta, u16_meta, u24_meta, u32_meta, u8_meta, udim2_meta, udim_meta, vector_meta } from "../meta-symbols";

type GetEnumType<T> = [T] extends [EnumItem] ? ExtractKeys<Enums, T["EnumType"]> : never;

/** A shortcut for defining Roblox datatypes (which map directly to a simple type) */
interface DataTypes {
  readonly numbersequence: NumberSequence;
  readonly colorsequence: ColorSequence;
  readonly color: Color3;
}

type TupleMetadata<T extends unknown[]> =
  [typeof tuple_meta, T] extends [keyof T, { readonly [tuple_meta]?: [infer V extends unknown[], infer RestLengthType]; }]
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
  [typeof list_meta, T] extends [keyof T, { readonly [list_meta]?: [infer V, infer Size]; }]
  ? ["list", SerializerMetadata<V>, SerializerMetadata<Size>]
  : ["list", SerializerMetadata<T[number]>, SerializerMetadata<u32>];

type ArrayMetadata<T extends unknown[]> = [T] extends [{ length: number }]
  ? TupleMetadata<T>
  : ListMetadata<T>;

export type SerializerMetadata<T> =
  IsLiteralUnion<T> extends true
  ? ["literal", NonNullable<T>[], true extends IsUnion<T> ? (undefined extends T ? 1 : 0) : -1]
  : unknown extends T
  ? ["optional", ["blob"]]
  : [typeof packed_meta, T] extends [keyof T, { readonly [packed_meta]?: [infer V] }]
  ? ["packed", SerializerMetadata<V>]
  : undefined extends T
  ? ["optional", SerializerMetadata<NonNullable<T>>]
  : [T] extends [f64]
  ? ["f64"]
  : [T] extends [f32]
  ? ["f32"]
  : [T] extends [f24]
  ? ["f24"]
  : [T] extends [f16]
  ? ["f16"]
  : [T] extends [u8]
  ? ["u8"]
  : [T] extends [u16]
  ? ["u16"]
  : [T] extends [u24]
  ? ["u24"]
  : [T] extends [u32]
  ? ["u32"]
  : [T] extends [i8]
  ? ["i8"]
  : [T] extends [i16]
  ? ["i16"]
  : [T] extends [i24]
  ? ["i24"]
  : [T] extends [i32]
  ? ["i32"]
  : [T] extends [boolean]
  ? ["bool"]
  : [T] extends [number]
  ? ["f32"]
  : [typeof string_meta, T] extends [keyof T, { readonly [string_meta]?: [infer V] }]
  ? ["string", SerializerMetadata<V>]
  : [T] extends [string]
  ? ["string", SerializerMetadata<u32>]
  : [typeof udim_meta, T] extends [keyof T, { readonly [udim_meta]?: [infer Scale, infer Offset] }]
  ? ["udim", SerializerMetadata<Scale>, SerializerMetadata<Offset>]
  : [T] extends [UDim]
  ? ["udim", SerializerMetadata<f32>, SerializerMetadata<u16>]
  : [typeof udim2_meta, T] extends [keyof T, { readonly [udim2_meta]?: [infer ScaleX, infer OffsetX, infer ScaleY, infer OffsetY] }]
  ? ["udim2", SerializerMetadata<ScaleX>, SerializerMetadata<OffsetX>, SerializerMetadata<ScaleY>, SerializerMetadata<OffsetY>]
  : [T] extends [UDim2]
  ? ["udim2", SerializerMetadata<f32>, SerializerMetadata<u16>, SerializerMetadata<f32>, SerializerMetadata<u16>]
  : [typeof vector_meta, T] extends [keyof T, { readonly [vector_meta]?: [infer X, infer Y, infer Z] }]
  ? ["vector", SerializerMetadata<X>, SerializerMetadata<Y>, SerializerMetadata<Z>]
  : [T] extends [Vector3]
  ? ["vector", SerializerMetadata<f32>, SerializerMetadata<f32>, SerializerMetadata<f32>]
  : [typeof transform_meta, T] extends [keyof T, { readonly [transform_meta]?: [infer X, infer Y, infer Z] }]
  ? ["cframe", SerializerMetadata<X>, SerializerMetadata<Y>, SerializerMetadata<Z>]
  : [T] extends [CFrame]
  ? ["cframe", SerializerMetadata<f32>, SerializerMetadata<f32>, SerializerMetadata<f32>]
  : [typeof set_meta, T] extends [keyof T, { readonly [set_meta]?: [infer V, infer LengthType] }]
  ? ["set", SerializerMetadata<V>, SerializerMetadata<LengthType>]
  : [T] extends [ReadonlySet<infer V>]
  ? ["set", SerializerMetadata<V>, SerializerMetadata<u32>]
  : [typeof map_meta, T] extends [keyof T, { readonly [map_meta]?: [infer K, infer V, infer LengthType] }]
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
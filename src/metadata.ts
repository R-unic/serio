import type { f32, u32 } from "./data-types";

type IsNumber<T, K extends string> = `_${K}` extends keyof T ? true : false;
type HasNominal<T> = T extends T ? (T extends `_nominal_${string}` ? true : never) : never;
type GetEnumType<T> = [T] extends [EnumItem] ? ExtractKeys<Enums, T["EnumType"]> : never;

/** A shortcut for defining Roblox datatypes (which map directly to a simple type) */
interface DataTypes {
  numbersequence: NumberSequence;
  colorsequence: ColorSequence;
  color: Color3;
}


export type SerializerMetadata<T> = unknown extends T
  ? ["optional", ["blob"]]
  : undefined extends T
  ? ["optional", SerializerMetadata<NonNullable<T>>]
  : IsNumber<T, "f64"> extends true
  ? ["f64"]
  : IsNumber<T, "f32"> extends true
  ? ["f32"]
  : IsNumber<T, "f24"> extends true
  ? ["f24"]
  : IsNumber<T, "f16"> extends true
  ? ["f16"]
  : IsNumber<T, "u8"> extends true
  ? ["u8"]
  : IsNumber<T, "u16"> extends true
  ? ["u16"]
  : IsNumber<T, "u32"> extends true
  ? ["u32"]
  : IsNumber<T, "i8"> extends true
  ? ["i8"]
  : IsNumber<T, "i16"> extends true
  ? ["i16"]
  : IsNumber<T, "i32"> extends true
  ? ["i32"]
  : [T] extends [boolean]
  ? ["bool"]
  : [T] extends [number]
  ? ["f32"]
  : ["_string", T] extends [keyof T, { _string?: [infer V] }]
  ? ["string", SerializerMetadata<V>]
  : [T] extends [string]
  ? ["string", SerializerMetadata<u32>]
  : ["_vector", T] extends [keyof T, { _vector?: [infer X, infer Y, infer Z] }]
  ? ["vector", SerializerMetadata<X>, SerializerMetadata<Y>, SerializerMetadata<Z>]
  : [T] extends [Vector3]
  ? ["vector", SerializerMetadata<f32>, SerializerMetadata<f32>, SerializerMetadata<f32>]
  : ["_cf", T] extends [keyof T, { _cf?: [infer X, infer Y, infer Z] }]
  ? ["cframe", SerializerMetadata<X>, SerializerMetadata<Y>, SerializerMetadata<Z>]
  : [T] extends [CFrame]
  ? ["cframe", SerializerMetadata<f32>, SerializerMetadata<f32>, SerializerMetadata<f32>]
  : [T] extends [DataTypes[keyof DataTypes]]
  ? [ExtractKeys<DataTypes, T>]
  : ["_list", T] extends [keyof T, { _list?: [infer V, infer Size] }]
  ? ["list", SerializerMetadata<V>, SerializerMetadata<Size>]
  : [T] extends [EnumItem]
  ? ["enum", GetEnumType<T>]
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
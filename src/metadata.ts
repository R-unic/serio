type IsNumber<T, K extends string> = `_${K}` extends keyof T ? true : false;
type HasNominal<T> = T extends T ? (T extends `_nominal_${string}` ? true : never) : never;

/** A shortcut for defining Roblox datatypes (which map directly to a simple type) */
interface DataTypes {
  cframe: CFrame;
  numbersequence: NumberSequence;
  colorsequence: ColorSequence;
  color3: Color3;
}

export type SerializerMetadata<T> = unknown extends T
  ? ["optional", ["blob"]]
  : ["_packed", T] extends [keyof T, { _packed?: [infer V] }]
  ? ["packed", SerializerMetadata<V>]
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
  ? ["f64"]
  : [T] extends [string]
  ? ["string"]
  : ["_vector", T] extends [keyof T, { _vector?: [infer V] }]
  ? ["vector", SerializerMetadata<V>]
  : [T] extends [DataTypes[keyof DataTypes]]
  ? [ExtractKeys<DataTypes, T>]
  : ["_list", T] extends [keyof T, { _list?: [infer V, infer Size] }]
  ? ["list", SerializerMetadata<V>, SerializerMetadata<Size>]
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
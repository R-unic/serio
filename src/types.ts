export interface SerializedData {
  readonly buf?: buffer;
  readonly blobs?: defined[];
}

export type Modifiers = "optional" | "packed";
export type IntType = "i8" | "i16" | "i32" | "u8" | "u16" | "u32";
export type PrimitiveDataType =
  | IntType
  | "f16" | "f24" | "f32" | "f64"
  | "bool"

export type Primitive<T extends PrimitiveDataType = PrimitiveDataType> = [T];
export type SerializerSchema =
  | Primitive
  | ["vector", xType: Primitive<IntType>, yType: Primitive<IntType>, zType: Primitive<IntType>]
  | ["cframe", xType: Primitive<IntType>, yType: Primitive<IntType>, zType: Primitive<IntType>]
  | ["object", [fieldName: string, fieldType: SerializerSchema][]]
  | ["list", elementType: SerializerSchema, lengthType: Primitive<IntType>]
  | ["tuple", elementTypes: SerializerSchema[], restElementType?: SerializerSchema]
  | ["string", sizeType: Primitive<IntType>]
  | ["set", elementType: SerializerSchema, lengthType: Primitive<IntType>]
  | ["map", keyType: SerializerSchema, valueType: SerializerSchema, lengthType: Primitive<IntType>]
  | ["enum", string]
  | ["union", string, [unknown, SerializerSchema][], number]
  | ["literal", defined[], number]
  | ["blob", defined]
  | [Modifiers, SerializerSchema];
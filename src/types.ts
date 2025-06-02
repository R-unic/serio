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
  | "enum";

export type Primitive<T extends PrimitiveDataType = PrimitiveDataType> = [T];
export type SerializerSchema =
  | Primitive
  | ["vector", xType: Primitive<IntType>, yType: Primitive<IntType>, zType: Primitive<IntType>]
  | ["cframe", xType: Primitive<IntType>, yType: Primitive<IntType>, zType: Primitive<IntType>]
  | ["object", [fieldName: string, fieldType: SerializerSchema][]]
  | ["list", elementType: SerializerSchema, sizeType: Primitive<IntType>]
  | ["string", sizeType: Primitive<IntType>]
  | ["enum", string]
  | ["blob", defined]
  | [Modifiers, SerializerSchema];

export interface ProcessedInfo {
  readonly schema: SerializerSchema;
  readonly containsPacking: boolean;
  readonly containsUnknownPacking: boolean;
  readonly minimumPackedBits: number;
  readonly minimumPackedBytes: number;
  readonly sortedEnums: Record<string, EnumItem[]>;
}
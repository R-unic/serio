export interface SerializedData {
  readonly buf: buffer;
  readonly blobs: defined[];
}

export type Modifiers = "optional" | "packed";
export type IntTypes = "i8" | "i16" | "i32" | "u8" | "u16" | "u32";
export type PrimitiveDataType =
  | IntTypes
  | "f16" | "f24" | "f32" | "f64"
  | "bool"
  | "string";

export type Primitive = [PrimitiveDataType];
export type SerializerSchema =
  | Primitive
  | ["vector", coordSize: Primitive]
  | ["object", [fieldName: string, SerializerSchema][]]
  | ["list", element: SerializerSchema, size: Primitive]
  | ["blob", Instance]
  | [Modifiers, SerializerSchema];

export interface ProcessedInfo {
  readonly schema: SerializerSchema;
  readonly containsPacking: boolean;
  readonly minimumPackedBits: number;
}
import type { u8, u16, u24, u32, u12 } from "./data-types";

export interface SerializedData {
  readonly buf?: buffer;
  readonly blobs?: defined[];
}

export type Modifiers = "optional" | "packed";
export type IntType = "i8" | "i12" | "i16" | "i24" | "i32" | "u8" | "u12" | "u16" | "u24" | "u32";
export type FloatType = "f16" | "f24" | "f32" | "f64";
export type NumberType = IntType | FloatType;

export type PrimitiveDataType =
  | NumberType
  | "bool"
  | "color"
  | "colorsequence"
  | "numbersequence"

export type USize = u8 | u12 | u16 | u24 | u32;
export type Primitive<T extends PrimitiveDataType = PrimitiveDataType> = [T];
export type SerializerSchema =
  | Primitive
  | ["udim", scaleType: Primitive<NumberType>, offsetType: Primitive<NumberType>]
  | ["udim2", scaleXType: Primitive<NumberType>, offsetXType: Primitive<NumberType>, scaleYType: Primitive<NumberType>, offsetYType: Primitive<NumberType>]
  | ["vector", xType: Primitive<NumberType>, yType: Primitive<NumberType>, zType: Primitive<NumberType>]
  | ["cframe", xType: Primitive<NumberType>, yType: Primitive<NumberType>, zType: Primitive<NumberType>]
  | ["object", [fieldName: string, fieldType: SerializerSchema][]]
  | ["list", elementType: SerializerSchema, lengthType: Primitive<IntType>]
  | ["tuple", elementTypes: SerializerSchema[], restElementType?: SerializerSchema, restLengthType?: Primitive<IntType>]
  | ["string", sizeType: Primitive<IntType>]
  | ["set", elementType: SerializerSchema, lengthType: Primitive<IntType>]
  | ["map", keyType: SerializerSchema, valueType: SerializerSchema, lengthType: Primitive<IntType>]
  | ["enum", string]
  | ["union", string, [unknown, SerializerSchema][], number]
  | ["guard_union", (readonly [SerializerSchema, ((value: unknown) => boolean) | undefined])[]]
  | ["literal", values: defined[], index: number]
  | ["blob", value: defined]
  | [Modifiers, body: SerializerSchema];
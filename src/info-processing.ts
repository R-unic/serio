import { ProcessedInfo, SerializerSchema } from "./types";

export function processInfo(schema: SerializerSchema): ProcessedInfo {
  const info: ProcessedInfo = {
    schema,
    containsPacking: false,
    minimumPackedBits: 0
  };



  return info;
}
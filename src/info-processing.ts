import { ProcessedInfo, SerializerSchema } from "./types";
import { getSortedEnumItems } from "./utility";

const { max, ceil } = math;

function passOverSchema(schema: SerializerSchema, info: ProcessedInfo): SerializerSchema {
  switch (schema[0]) {
    case "enum": {
      const index = schema[1]!;
      if (info.sortedEnums[index] === undefined)
        info.sortedEnums[index] = getSortedEnumItems(Enum[index as never])

      break;
    }
  }

  return schema;
}

function getMinimumPackedBytes(info: ProcessedInfo): number {
  return max(0, ceil(info.minimumPackedBits / 8) - (info.containsUnknownPacking ? 1 : 0));
}

export function processInfo(rawSchema: SerializerSchema): ProcessedInfo {
  const info: Writable<ProcessedInfo> = {
    schema: rawSchema,
    containsPacking: false,
    containsUnknownPacking: false,
    minimumPackedBits: 0,
    minimumPackedBytes: 0,
    sortedEnums: {}
  };

  info.schema = passOverSchema(rawSchema, info);
  info.minimumPackedBytes = getMinimumPackedBytes(info);

  return info;
}
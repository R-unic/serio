import { SerializerSchema } from "./types";
import { getSortedEnumItems } from "./utility";

const { max, ceil } = math;

const enum IterationFlags {
  Default,
  SizeUnknown,
  Packed
}

export interface ProcessedInfo {
  readonly flags: IterationFlags;
  readonly schema: SerializerSchema;
  readonly containsPacking: boolean;
  readonly containsUnknownPacking: boolean;
  readonly minimumPackedBits: number;
  readonly minimumPackedBytes: number;
  readonly sortedEnums: Record<string, EnumItem[]>;
}

function addPackedBit(info: Writable<ProcessedInfo>): void {
  const newLocal = (info.flags & IterationFlags.Packed) === 0;
  if (newLocal) return;
  info.containsPacking = true;

  if ((info.flags & IterationFlags.SizeUnknown) !== 0)
    info.containsUnknownPacking = true;
  else
    // We only keep track of guaranteed packing bits, which we can use for optimization.
    info.minimumPackedBits += 1;
}

/**
 * Mutates the given ProcessedInfo object while traversing the given schema in
 * order to collect information about it.
 *
 * This function is used to prepare the schema for the serialization and
 * deserialization processes. It traverses the schema and adds information to
 * the ProcessedInfo object about the schema's layout. This information is
 * necessary for the serialization and deserialization processes to work
 * correctly.
 */
function schemaPass(schema: SerializerSchema, info: Writable<ProcessedInfo>): SerializerSchema {
  const [kind] = schema;
  switch (kind) {
    case "optional": {
      addPackedBit(info);
      info.flags |= IterationFlags.SizeUnknown;

      schema = [kind, schemaPass(schema[1], info)];
      break;
    }
    case "packed": {
      info.flags |= IterationFlags.Packed;

      schema = [kind, schemaPass(schema[1], info)];
      break;
    }

    case "object": {
      const fields = schema[1];
      const newFields = fields.map<(typeof fields)[number]>(([name, meta]) => [name, schemaPass(meta, info)]);
      schema = ["object", newFields];
      break;
    }
    // case "cframe":
    case "bool":
      addPackedBit(info);
      break;
    // case "set":
    case "list": {
      info.flags |= IterationFlags.SizeUnknown;

      schema = [kind, schemaPass(schema[1], info), schema[2]];
      break;
    }
    case "enum": {
      const index = schema[1]!;
      if (info.sortedEnums[index] === undefined)
        info.sortedEnums[index] = getSortedEnumItems(Enum[index as never]);

      break;
    }
  }

  return schema;
}

function getMinimumPackedBytes({ minimumPackedBits, containsUnknownPacking }: ProcessedInfo): number {
  return max(0, ceil(minimumPackedBits / 8) - (containsUnknownPacking ? 1 : 0));
}

export function processInfo(rawSchema: SerializerSchema): ProcessedInfo {
  const info: Writable<ProcessedInfo> = {
    schema: rawSchema,
    flags: IterationFlags.Default,
    containsPacking: false,
    containsUnknownPacking: false,
    minimumPackedBits: 0,
    minimumPackedBytes: 0,
    sortedEnums: {}
  };

  info.schema = schemaPass(rawSchema, info);
  info.minimumPackedBytes = getMinimumPackedBytes(info);

  return info;
}
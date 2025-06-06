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
  if ((info.flags & IterationFlags.Packed) === 0) return;
  info.containsPacking = true;

  if ((info.flags & IterationFlags.SizeUnknown) !== 0)
    info.containsUnknownPacking = true;
  else
    // We only keep track of guaranteed packing bits, which we can use for optimization.
    info.minimumPackedBits++;
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
    case "union": {
      const [_, name, options] = schema;
      const optionsSize = options.size();
      // Whenever we only have two options, we can use a single bit.
      // We use a byte size of `-1` to indicate a packable union.
      const isPackable = (info.flags & IterationFlags.Packed) !== 0 && optionsSize === 2;
      if (isPackable)
        addPackedBit(info);

      info.flags |= IterationFlags.SizeUnknown;
      schema = [
        kind,
        name,
        options.map(([key, schema]): [unknown, SerializerSchema] => [key, schemaPass(schema, info)]),
        isPackable ? -1 : (optionsSize > 256 ? 2 : 1),
      ];
      break;
    }
    case "literal": {
      const [_, possibleValues, size] = schema;
      const possibleValuesSize = possibleValues.size();
      // Whenever we only have two options, we can use a single bit.
      // We exclude undefined using `data[2] === 0` as it complicates thing.
      if ((info.flags & IterationFlags.Packed) !== 0 && possibleValuesSize === 2 && size === 0) {
        addPackedBit(info);

        // We use `-1` as the size to signify that this union can be packed,
        // as it's not a valid value otherwise.
        return [kind, possibleValues, -1];
      }

      // Since `undefined` is not included in the size of `data[1]`,
      // we add the existing value of `data[3]` (which is 1 if undefined is in the union) to `data[1]`
      // to determine the final required size.
      // A size of -1 means this isn't a union.
      const finalSize = size === -1
        ? 0
        : (size + possibleValuesSize > 256 ? 2 : 1);

      schema = [kind, possibleValues, finalSize];
      break;
    }
    case "object": {
      const [_, fields] = schema;
      const newFields = fields.map<(typeof fields)[number]>(([name, meta]) => [name, schemaPass(meta, info)]);
      schema = ["object", newFields];
      break;
    }
    case "udim2":
    case "vector":
    case "cframe":
    case "bool":
      addPackedBit(info);
      break;
    case "set":
    case "list": {
      info.flags |= IterationFlags.SizeUnknown;

      schema = [kind, schemaPass(schema[1], info), schema[2]];
      break;
    }
    case "map": {
      info.flags |= IterationFlags.SizeUnknown;

      schema = [kind, schemaPass(schema[1], info), schemaPass(schema[2], info), schema[3]];
      break;
    }
    case "tuple": {
      const [_, elementTypes, restElementType] = schema;
      const fixedElements = elementTypes.map(v => schemaPass(v, info));

      let restElement;
      if (restElementType !== undefined) {
        info.flags |= IterationFlags.SizeUnknown;

        restElement = schemaPass(restElementType, info);
      }

      schema = [kind, fixedElements, restElement];
      break;
    }
    case "enum": {
      const [_, index] = schema;
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
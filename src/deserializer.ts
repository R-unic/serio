import type { ProcessedInfo, SerializedData, SerializerSchema } from "./types";
import { readF16, readF24 } from "./utility";

export function getDeserializeFunction<T>(
  { schema, containsPacking, minimumPackedBits }: ProcessedInfo
): (data: SerializedData) => T {
  let buf!: buffer;
  let offset!: number;
  let blobs: defined[] | undefined;
  let blobIndex = 0;
  let packing = false;

  function deserialize(meta: SerializerSchema): unknown {
    const currentOffset = offset;

    switch (meta[0]) {
      case "u8":
        offset += 1;
        return buffer.readu8(buf, currentOffset);
      case "u16":
        offset += 2;
        return buffer.readu16(buf, currentOffset);
      case "u32":
        offset += 4;
        return buffer.readu32(buf, currentOffset);
      case "i8":
        offset += 1;
        return buffer.readi8(buf, currentOffset);
      case "i16":
        offset += 2;
        return buffer.readi16(buf, currentOffset);
      case "i32":
        offset += 4;
        return buffer.readi32(buf, currentOffset);
      case "f16":
        offset += 2;
        return readF16(buf, currentOffset);
      case "f24":
        offset += 3;
        return readF24(buf, currentOffset);
      case "f32":
        offset += 4;
        return buffer.readf32(buf, currentOffset);
      case "bool":
        offset += 1;
        return buffer.readu8(buf, currentOffset) === 1;
      case "vector": {
        const coordSize = meta[1]!;
        const x = deserialize(coordSize) as number;
        const y = deserialize(coordSize) as number;
        const z = deserialize(coordSize) as number;

        return new Vector3(x, y, z);
      }

      case "list": {
        const [_, elementMeta, sizeMeta] = meta;
        const size = deserialize(sizeMeta ?? ["u32"]) as number;
        const list: defined[] = [];
        for (const _ of $range(1, size))
          list.push(deserialize(elementMeta!)!);

        return list
      }
      case "object": {
        const fields = meta[1]!;

        const obj: Record<string, unknown> = {};
        for (const [name, fieldMeta] of fields)
          obj[name] = deserialize(fieldMeta);

        return obj;
      }

      case "optional": {
        const [_, valueMeta] = meta;
        offset += 1;
        const exists = buffer.readu8(buf, currentOffset);
        return exists === 1 ? deserialize(valueMeta) : undefined;
      }
    }

  }

  return (data: SerializedData) => {
    blobs = data.blobs;
    buf = data.buf;
    offset = 0;
    blobIndex = 0;

    return deserialize(schema) as T;
  };
}

import { f32ToF16, f32ToF24 } from "./utility";
import type { SerializerSchema, SerializedData, ProcessedInfo } from "./types";

const { ceil, log } = math;

export function getSerializeFunction<T>(
  { schema, containsPacking, minimumPackedBits }: ProcessedInfo
): (value: T) => SerializedData {
  // const bits = table.create<boolean>(1);
  let currentSize = 2 ** 8;
  let buf = buffer.create(currentSize);
  let offset!: number;
  let blobs!: defined[];
  let packing = false;

  function allocate(size: number): void {
    offset += size;

    if (offset > currentSize) {
      const newSize = 2 ** ceil(log(offset) / log(2));
      const oldBuffer = buf;

      currentSize = newSize;
      buf = buffer.create(newSize);
      buffer.copy(buf, 0, oldBuffer);
    }
  }

  function serialize(value: unknown, meta: SerializerSchema): void {
    const currentOffset = offset;

    switch (meta[0]) {
      case "u8": {
        allocate(1);
        buffer.writeu8(buf, currentOffset, value as never);
        break;
      }
      case "u16": {
        allocate(2);
        buffer.writeu16(buf, currentOffset, value as never);
        break;
      }
      case "u32": {
        allocate(4);
        buffer.writeu32(buf, currentOffset, value as never);
        break;
      }
      case "i8": {
        allocate(1);
        buffer.writei8(buf, currentOffset, value as never);
        break;
      }
      case "i16": {
        allocate(2);
        buffer.writei16(buf, currentOffset, value as never);
        break;
      }
      case "i32": {
        allocate(4);
        buffer.writei32(buf, currentOffset, value as never);
        break;
      }
      case "f16": {
        allocate(2);
        const f16 = f32ToF16(value as never);
        buffer.writeu8(buf, currentOffset, f16 & 0xFF); // lower byte
        buffer.writeu8(buf, currentOffset + 1, f16 >> 8); // upper byte
        break;
      }
      case "f24": {
        allocate(3);
        const f24 = f32ToF24(value as never);
        buffer.writeu8(buf, currentOffset, f24 & 0xFF); // lower byte
        buffer.writeu8(buf, currentOffset + 1, f24 >> 8); // middle byte
        buffer.writeu8(buf, currentOffset + 2, f24 >> 16); // upper byte
        break;
      }
      case "f32": {
        allocate(4);
        buffer.writef32(buf, currentOffset, value as never);
        break;
      }
      case "f64": {
        allocate(8);
        buffer.writef64(buf, currentOffset, value as never);
        break;
      }
      case "bool": {
        allocate(1);
        buffer.writeu8(buf, currentOffset, value ? 1 : 0);
        break;
      }
      case "vector": {
        const coordSize = meta[1]!;
        const vector = value as Vector3;
        serialize(vector.X, coordSize);
        serialize(vector.Y, coordSize);
        serialize(vector.Z, coordSize);
        break;
      }

      case "list": {
        const [_, elementMeta, sizeMeta] = meta;
        const list = value as unknown[];

        serialize(list.size(), sizeMeta ?? ["u32"]);
        for (const element of list)
          serialize(element, elementMeta!);

        break;
      }
      case "object": {
        const fields = meta[1]!;
        const object = value as Record<string, unknown>;

        for (const [name, schema] of fields)
          serialize(object[name], schema);

        break;
      }

      case "optional": {
        const [_, valueMeta] = meta;
        const exists = value !== undefined;
        allocate(1);

        if (!exists)
          buffer.writeu8(buf, currentOffset, 0);
        else {
          buffer.writeu8(buf, currentOffset, 1);
          serialize(value, valueMeta);
        }
        break;
      }
    }
  }

  return (value: T) => {
    offset = 0;
    blobs = [];
    serialize(value, schema);

    const trimmed = buffer.create(offset);
    buffer.copy(trimmed, 0, buf, 0, offset);

    return { buf: trimmed, blobs };
  };
}
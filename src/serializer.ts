
import { f32ToF16, f32ToF24, getIntTypeSize as sizeOfIntType, sign } from "./utility";
import type { SerializerSchema, SerializedData, ProcessedInfo } from "./types";

const { ceil, log, map, pi: PI } = math;
const toAxisAngle = CFrame.identity.ToAxisAngle as (cf: CFrame) => ReturnType<CFrame["ToAxisAngle"]>;

export function getSerializeFunction<T>(
  { schema, containsPacking, minimumPackedBits, sortedEnums }: ProcessedInfo
): (value: T) => SerializedData {
  // const bits = table.create<boolean>(1);
  let currentSize = 2 ** 8;
  let buf = buffer.create(currentSize);
  let offset!: number;
  let blobs!: defined[];
  let packing = false;

  function allocate(size: number): void {
    if ((offset += size) <= currentSize) return;

    const newSize = 2 ** ceil(log(offset) / log(2));
    const oldBuffer = buf;
    currentSize = newSize;
    buf = buffer.create(newSize);
    buffer.copy(buf, 0, oldBuffer);
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
      case "string": {
        const [_, lengthType] = meta;
        const str = value as string;
        const length = str.size();
        const lengthSize = sizeOfIntType(lengthType);
        serialize(length, lengthType);
        allocate(length);
        buffer.writestring(buf, currentOffset + lengthSize, str);
        break;
      }
      case "enum": {
        const enumIndex = sortedEnums[meta[1]!].indexOf(value as never);

        allocate(1);
        buffer.writeu8(buf, currentOffset, enumIndex);
        break;
      }
      case "vector": {
        const [_, xType, yType, zType] = meta;
        const vector = value as Vector3;
        serialize(vector.X, xType);
        serialize(vector.Y, yType);
        serialize(vector.Z, zType);
        break;
      }
      case "cframe": {
        const [_, xType, yType, zType] = meta;
        const cframe = value as CFrame;

        const [axis, angle] = toAxisAngle(cframe);
        const zSign = sign(axis.Z);
        const xAxis = axis.X;
        const maxY = (1 - xAxis ** 2) ** 0.5;
        const mappedX = map(xAxis, -1, 1, 0, 2 ** 16 - 1);
        const mappedY = map(axis.Y, -maxY, maxY, 0, 2 ** 15 - 1) * zSign;
        const mappedAngle = map(angle, 0, PI, 0, 2 ** 16 - 1)

        {
          let length = buffer.len(buf);
          const minimumSize = 9;
          const targetOffset = currentOffset + minimumSize;
          if (targetOffset > length) {
            let newBytes = minimumSize * 2;
            length *= 2;
            while (targetOffset > length) {
              length *= 2;
              newBytes *= 2;
            }

            allocate(newBytes);
          }
        }

        serialize(mappedX, ["u16"]);
        serialize(mappedY, ["i16"]);
        serialize(mappedAngle, ["u16"]);
        serialize(cframe.X, xType);
        serialize(cframe.Y, yType);
        serialize(cframe.Z, zType);
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

      case "blob": {
        blobs.push(value!);
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

    return {
      buf: buffer.len(trimmed) === 0 ? undefined : trimmed,
      blobs: blobs.isEmpty() ? undefined : blobs
    };
  };
}

import { f32ToF16, f32ToF24, sizeOfIntType, sign, CF__index } from "./utility";
import { AXIS_ALIGNED_ORIENTATIONS, COMMON_VECTORS } from "./constants";
import type { ProcessedInfo } from "./info-processing";
import type { SerializerSchema, SerializedData } from "./types";

const { min, max, ceil, log, map, pi: PI } = math;
const toAxisAngle = CFrame.identity.ToAxisAngle as (cf: CFrame) => ReturnType<CFrame["ToAxisAngle"]>;

export function getSerializeFunction<T>(
  { schema, containsPacking, containsUnknownPacking, minimumPackedBits, minimumPackedBytes, sortedEnums }: ProcessedInfo
): (value: T) => SerializedData {
  let bits = table.create<boolean>(minimumPackedBits);
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

  function serialize(value: unknown, meta: SerializerSchema, serializeOffset = offset): void {
    const currentOffset = serializeOffset;

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
        if (packing) {
          bits.push(value as never);
          break;
        }

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
        if (packing) {
          const index = COMMON_VECTORS.indexOf(vector);
          const isOptimized = index !== -1;
          print("optimized:", isOptimized)
          print(bits.push(isOptimized));

          if (isOptimized) {
            allocate(1);
            buffer.writeu8(buf, currentOffset, index);
            break;
          }
        }

        serialize(vector.X, xType);
        serialize(vector.Y, yType);
        serialize(vector.Z, zType);
        break;
      }
      case "cframe": {
        const [_, xType, yType, zType] = meta;
        const cframe = value as CFrame;

        if (packing) {
          // 1-5: Orientation, 6-7: Position, 8: unused
          let optimizedPosition = false;
          let optimizedRotation = false;
          let packed = 0;

          const position = CF__index(cframe, "Position");
          const rotation = CF__index(cframe, "Rotation");
          if (position === Vector3.zero) {
            optimizedPosition = true;
            packed += 0x20;
          } else if (position === Vector3.one) {
            optimizedPosition = true;
            packed += 0x20;
            packed += 0x40;
          }

          const specialCase = AXIS_ALIGNED_ORIENTATIONS.indexOf(rotation);
          if (specialCase !== -1) {
            optimizedRotation = true;
            packed += specialCase;
          } else
            packed += 0x1F;

          const isOptimized = optimizedPosition || optimizedRotation;
          bits.push(isOptimized);
          allocate((isOptimized ? 1 : 0) + (optimizedPosition ? 0 : 12) + (optimizedRotation ? 0 : 6));

          let newOffset = currentOffset;
          if (isOptimized) {
            buffer.writeu8(buf, newOffset, packed);
            newOffset += 1;
          }

          if (!optimizedRotation) {
            const [axis, angle] = toAxisAngle(cframe);
            const zSign = sign(axis.Z);
            const xAxis = axis.X;
            const maxY = (1 - xAxis ** 2) ** 0.5;
            const mappedX = map(xAxis, -1, 1, 0, 2 ** 16 - 1);
            const mappedY = map(axis.Y, -maxY, maxY, 0, 2 ** 15 - 1) * zSign;
            const mappedAngle = map(angle, 0, PI, 0, 2 ** 16 - 1);

            buffer.writeu16(buf, newOffset, mappedX);
            buffer.writei16(buf, newOffset + 2, mappedY);
            buffer.writeu16(buf, newOffset + 4, mappedAngle);
            newOffset += 6;
          }

          if (!optimizedPosition) {
            serialize(cframe.X, xType, newOffset);
            newOffset += sizeOfIntType(xType);
            serialize(cframe.Y, yType, newOffset);
            newOffset += sizeOfIntType(yType);
            serialize(cframe.Z, zType, newOffset);
            newOffset += sizeOfIntType(zType);
          }

          break;
        }

        const [axis, angle] = toAxisAngle(cframe);
        const zSign = sign(axis.Z);
        const xAxis = axis.X;
        const maxY = (1 - xAxis ** 2) ** 0.5;
        const mappedX = map(xAxis, -1, 1, 0, 2 ** 16 - 1);
        const mappedY = map(axis.Y, -maxY, maxY, 0, 2 ** 15 - 1) * zSign;
        const mappedAngle = map(angle, 0, PI, 0, 2 ** 16 - 1);

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

        buffer.writeu16(buf, currentOffset, mappedX);
        buffer.writei16(buf, currentOffset + 2, mappedY);
        buffer.writeu16(buf, currentOffset + 4, mappedAngle);
        offset += 6;

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
        if (packing) {
          bits.push(exists);
          if (exists)
            serialize(value, valueMeta);

          break;
        }

        allocate(1);
        buffer.writeu8(buf, currentOffset, exists ? 1 : 0);
        if (exists)
          serialize(value, valueMeta);

        break;
      }
      case "packed": {
        const [_, innerType] = meta;
        const enclosingPacking = packing;
        packing = true;

        serialize(value, innerType);
        packing = enclosingPacking;
        break;
      }

      case "blob": {
        blobs.push(value!);
        break;
      }
    }
  }

  function writeBits(buf: buffer, offset: number, bitOffset: number, bytes: number, variable: boolean): void {
    const bitSize = bits.size();
    for (const byte of $range(0, bytes - 1)) {
      let currentByte = 0;
      for (const bit of $range(variable ? 1 : 0, min(7, bitSize - bitOffset))) {
        currentByte += (bits[bitOffset] ? 1 : 0) << bit;
        bitOffset += 1;
      }

      if (variable && byte !== bytes - 1)
        currentByte += 1;

      buffer.writeu8(buf, offset, currentByte);
      offset += 1;
    }
  }

  function calculatePackedBytes(): LuaTuple<[number, number, number]> {
    const minimumBytes = minimumPackedBytes;
    if (!containsUnknownPacking)
      return $tuple(minimumBytes, 0, minimumBytes);

    const variableBytes = max(1, ceil((bits.size() - minimumBytes * 8) / 7));
    const totalByteCount = minimumBytes + variableBytes;
    return $tuple(minimumBytes, variableBytes, totalByteCount);
  }

  return (value: T) => {
    offset = 0;
    blobs = [];
    bits = [];
    serialize(value, schema);

    if (!containsPacking) {
      const trimmed = buffer.create(offset);
      buffer.copy(trimmed, 0, buf, 0, offset);

      return createSerializedData(trimmed, blobs);
    }

    const [minimumBytes, variableBytes, totalBytes] = calculatePackedBytes();
    const trimmed = buffer.create(offset + totalBytes);
    buffer.copy(trimmed, totalBytes, buf, 0, offset);

    if (minimumBytes > 0)
      writeBits(trimmed, 0, 0, minimumBytes, false);

    if (variableBytes > 0)
      writeBits(trimmed, minimumBytes, minimumBytes * 8, variableBytes, true);

    return createSerializedData(trimmed, blobs);
  };
}

function createSerializedData(trimmed: buffer, blobs: defined[]): SerializedData {
  return {
    buf: buffer.len(trimmed) === 0 ? undefined : trimmed,
    blobs: blobs.isEmpty() ? undefined : blobs
  };
}
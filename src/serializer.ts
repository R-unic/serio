
import { sizeOfNumberType, sign, CF__index, fuzzyEq, isNumberType, assertNumberRange, isNaN } from "./utility";
import { f16 } from "./utility/f16";
import { f24 } from "./utility/f24";
import { u24 } from "./utility/u24";
import { i24 } from "./utility/i24";
import { AXIS_ALIGNED_ORIENTATIONS, COMMON_UDIM2S, COMMON_VECTORS } from "./constants";
import type { ProcessedInfo } from "./info-processing";
import type { SerializerSchema, SerializedData } from "./types";

const { min, max, clamp, ceil, map, pi: PI } = math;
const {
  copy, create: createBuffer, len: bufferLength,
  writei8, writei16, writei32, writeu8, writeu16, writeu32, writef32, writef64, writestring
} = buffer;
const toAxisAngle = CFrame.identity.ToAxisAngle as (cf: CFrame) => ReturnType<CFrame["ToAxisAngle"]>;

const LIMIT_16_BITS = 2 ** 16 - 1;
const LIMIT_15_BITS = 2 ** 15 - 1;

export function getSerializeFunction<T>(
  { schema, containsPacking, containsUnknownPacking, minimumPackedBits, minimumPackedBytes, sortedEnums }: ProcessedInfo
): (value: T) => SerializedData {
  let bits = table.create<boolean>(minimumPackedBits);
  let currentSize = 2 ** 8;
  let buf = createBuffer(currentSize);
  let packing = false;
  let offset!: number;
  let blobs!: defined[];
  let originalValue!: T;

  function allocate(size: number): void {
    if ((offset += size) <= currentSize) return;

    const newSize = max(currentSize * 2, offset);
    const oldBuffer = buf;
    currentSize = newSize;
    buf = createBuffer(newSize);
    copy(buf, 0, oldBuffer);
  }

  function serialize(value: unknown, meta: SerializerSchema, serializeOffset = offset): void {
    const currentOffset = serializeOffset;
    validate(value, meta);

    switch (meta[0]) {
      case "u8": {
        allocate(1);
        writeu8(buf, currentOffset, value as never);
        break;
      }
      case "u16": {
        allocate(2);
        writeu16(buf, currentOffset, value as never);
        break;
      }
      case "u24": {
        const bytes = u24.fromU32(value as never);
        allocate(3);
        writeu8(buf, currentOffset, bytes & 0xFF); // lower byte
        writeu8(buf, currentOffset + 1, (bytes >> 8) & 0xFF); // middle byte
        writeu8(buf, currentOffset + 2, (bytes >> 16) & 0xFF); // upper byte
        break;
      }
      case "u32": {
        allocate(4);
        writeu32(buf, currentOffset, value as never);
        break;
      }
      case "i8": {
        allocate(1);
        writei8(buf, currentOffset, value as never);
        break;
      }
      case "i16": {
        allocate(2);
        writei16(buf, currentOffset, value as never);
        break;
      }
      case "i24": {
        const bytes = i24.fromI32(value as never);
        allocate(3);
        writei8(buf, currentOffset, bytes & 0xFF); // lower byte
        writei8(buf, currentOffset + 1, (bytes >> 8) & 0xFF); // middle byte
        writei8(buf, currentOffset + 2, (bytes >> 16) & 0xFF); // upper byte
        break;
      }
      case "i32": {
        allocate(4);
        writei32(buf, currentOffset, value as never);
        break;
      }
      case "f16": {
        const bytes = f16.fromF32(value as never);
        allocate(2);
        writeu8(buf, currentOffset, bytes & 0xFF); // lower byte
        writeu8(buf, currentOffset + 1, (bytes >> 8) & 0xFF); // upper byte
        break;
      }
      case "f24": {
        const bytes = f24.fromF32(value as never);
        allocate(3);
        writeu8(buf, currentOffset, bytes & 0xFF); // lower byte
        writeu8(buf, currentOffset + 1, (bytes >> 8) & 0xFF); // middle byte
        writeu8(buf, currentOffset + 2, (bytes >> 16) & 0xFF); // upper byte
        break;
      }
      case "f32": {
        allocate(4);
        writef32(buf, currentOffset, value as never);
        break;
      }
      case "f64": {
        allocate(8);
        writef64(buf, currentOffset, value as never);
        break;
      }
      case "bool": {
        if (packing) {
          bits.push(value as never);
          break;
        }

        allocate(1);
        writeu8(buf, currentOffset, value ? 1 : 0);
        break;
      }
      case "string": {
        const [_, lengthType] = meta;
        const str = value as string;
        const length = str.size();
        const lengthSize = sizeOfNumberType(lengthType);
        assertNumberRange(length, lengthSize, false, "string length");
        serialize(length, lengthType);
        allocate(length);
        writestring(buf, currentOffset + lengthSize, str);
        break;
      }
      case "set": {
        // We could just generate `Map<V, true>` for sets, but this is more efficient as it omits serializing a boolean per value.
        const [_, valueType, lengthType] = meta;

        const set = value as Set<unknown>;
        serialize(set.size(), lengthType);
        for (const elementValue of set)
          serialize(elementValue, valueType);

        break;
      }
      case "map": {
        const [_, keyType, valueType, lengthType] = meta;
        const map = value as Map<unknown, unknown>;

        serialize(map.size(), lengthType);
        for (const [key, value] of map) {
          serialize(key, keyType);
          serialize(value, valueType);
        }

        break;
      }
      case "enum": {
        const enumIndex = sortedEnums[meta[1]!].indexOf(value as never);

        assertNumberRange(enumIndex, 1, false, "enum index");
        allocate(1);
        writeu8(buf, currentOffset, enumIndex);
        break;
      }
      case "numbersequence": {
        const keypoints = (value as NumberSequence).Keypoints;
        const keypointCount = keypoints.size();
        assertNumberRange(keypointCount, 1, false, "number sequence keypoints length");
        allocate(1 + keypointCount * 6);
        writeu8(buf, currentOffset, keypointCount);

        for (const i of $range(1, keypointCount)) {
          const keypointOffset = currentOffset + 1 + 6 * (i - 1);
          const keypoint = keypoints[i - 1];
          writeu16(buf, keypointOffset, keypoint.Time * 0xFFFF);
          writeu16(buf, keypointOffset + 2, keypoint.Value * 0xFFFF);
          writeu16(buf, keypointOffset + 4, keypoint.Envelope * 0xFFFF);
        }

        break;
      }
      case "colorsequence": {
        const keypoints = (value as ColorSequence).Keypoints;
        const keypointCount = keypoints.size();
        assertNumberRange(keypointCount, 1, false, "color sequence keypoints length");
        allocate(1 + keypointCount * 5);
        writeu8(buf, currentOffset, keypointCount);

        for (const i of $range(1, keypointCount)) {
          const keypointOffset = currentOffset + 1 + 5 * (i - 1);
          const keypoint = keypoints[i - 1];
          writeu16(buf, keypointOffset, keypoint.Time * 0xFFFF);
          serialize(keypoint.Value, ["color"], keypointOffset + 2);
        }

        break;
      }
      case "color": {
        const color = value as Color3;
        allocate(3);
        writeu8(buf, currentOffset, color.R * 0xFF);
        writeu8(buf, currentOffset + 1, color.G * 0xFF);
        writeu8(buf, currentOffset + 2, color.B * 0xFF);
        break;
      }
      case "udim": {
        const [_, xType, yType] = meta;
        const udim = value as UDim;
        serialize(udim.Scale, xType);
        serialize(udim.Offset, yType);
        break;
      }
      case "udim2": {
        const [_, scaleXType, offsetXType, scaleYType, offsetYType] = meta;
        const udim2 = value as UDim2;
        if (packing) {
          // 3 bits for special cases
          const specialCase = COMMON_UDIM2S.indexOf(udim2);
          const isOptimized = specialCase !== -1;
          const packed = isOptimized ? specialCase : 0x7;
          bits.push(isOptimized);

          if (isOptimized) {
            allocate(1);
            writeu8(buf, currentOffset, packed);
            break;
          }
        }

        serialize(udim2.X, ["udim", scaleXType, offsetXType]);
        serialize(udim2.Y, ["udim", scaleYType, offsetYType]);
        break;
      }
      case "vector": {
        const [_, xType, yType, zType] = meta;
        const vector3 = value as Vector3;
        if (packing) {
          const specialCase = COMMON_VECTORS.findIndex(v => fuzzyEq(v, vector3));
          const isOptimized = specialCase !== -1;
          const packed = isOptimized ? specialCase : 0x3F;
          bits.push(isOptimized);

          if (isOptimized) {
            allocate(1);
            writeu8(buf, currentOffset, packed);
            break;
          }
        }

        serialize(vector3.X, xType);
        serialize(vector3.Y, yType);
        serialize(vector3.Z, zType);
        break;
      }
      case "cframe": {
        const [_, xType, yType, zType] = meta;
        const cframe = value as CFrame;
        const position = CF__index(cframe, "Position");

        if (packing) {
          // 1-5: Orientation, 6-7: Position, 8: unused
          let optimizedPosition = false;
          let optimizedRotation = false;
          let packed = 0;

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

          const headerBytes = isOptimized ? 1 : 0;
          const rotationBytes = optimizedRotation ? 0 : 6;
          const totalBytes = headerBytes + rotationBytes;
          allocate(totalBytes);

          let newOffset = currentOffset;
          if (isOptimized) {
            writeu8(buf, newOffset, packed);
            newOffset += 1;
          }

          if (!optimizedRotation) {
            writeCFrameAngles(cframe, newOffset);
            newOffset += 6;
          }

          if (!optimizedPosition)
            serialize(position, ["vector", xType, yType, zType], newOffset);

          break;
        }

        allocate(6); // minimum
        writeCFrameAngles(cframe, currentOffset);
        serialize(position, ["vector", xType, yType, zType]);
        break;
      }
      case "list": {
        const [_, elementMeta, sizeMeta] = meta;
        const list = value as unknown[];

        serialize(list.size(), sizeMeta);
        for (const element of list)
          serialize(element, elementMeta);

        break;
      }
      case "object": {
        const [_, fields] = meta;
        const object = value as Record<string, unknown>;

        for (const [name, schema] of fields)
          serialize(object[name], schema);

        break;
      }
      case "union": {
        const [_, tagName, tagged, byteSize] = meta;
        const objectTag = (value as Map<unknown, unknown>).get(tagName);
        const tagMap = new Map(tagged.map<[unknown, [number, SerializerSchema]]>(([tag, schema], i) => [tag, [i, schema]]));
        const [tagIndex, tagMetadata] = tagMap.get(objectTag)!;

        if (byteSize === 1) {
          assertNumberRange(tagIndex, 1, false, "literal union tag index");
          allocate(1);
          writeu8(buf, currentOffset, tagIndex);
        } else if (byteSize === 2) {
          assertNumberRange(tagIndex, 2, false, "literal union tag index");
          allocate(2);
          writeu16(buf, currentOffset, tagIndex);
        } else if (byteSize === -1)
          bits.push(tagIndex === 0);

        serialize(value, tagMetadata);
        break;
      }
      case "literal": {
        const [_, literals, byteSize] = meta;
        if (byteSize === -1) {
          bits.push(value === literals[0]);
          break;
        }

        const index = literals.indexOf(value as defined);
        if (index === -1)
          throw `[@rbxts/serio]: Failed to serialize unknown literal value '${value}'
          Stemmed from: ${originalValue}`;

        assertNumberRange(index, byteSize, false, "literal index");
        allocate(byteSize);
        if (byteSize === 1)
          writeu8(buf, currentOffset, index);
        else if (byteSize === 2)
          writeu16(buf, currentOffset, index);

        break;
      }
      case "tuple": {
        const [_, elements, restMetadata] = meta;
        const tuple = value as unknown[];
        const size = tuple.size();

        if (restMetadata !== undefined) {
          const restSize = size - elements.size();
          assertNumberRange(restSize, 2, false, "tuple rest length");
          allocate(2);
          writeu16(buf, currentOffset, restSize);
        }

        for (const i of $range(1, size)) {
          const newMetadata = elements[i - 1] ?? restMetadata;
          if (newMetadata === undefined) continue;

          serialize(tuple[i - 1], newMetadata);
        }

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
        writeu8(buf, currentOffset, exists ? 1 : 0);
        if (exists)
          serialize(value, valueMeta);

        break;
      }
      case "packed": {
        const [_, innerType] = meta;
        const enclosing = packing;
        packing = true;
        serialize(value, innerType);
        packing = enclosing;
        break;
      }

      case "blob": {
        blobs.push(value!);
        break;
      }

      default:
        throw `[@rbxts/serio]: Cannot serialize unknown schema type '${meta[0]}'`;
    }
  }

  function writeCFrameAngles(cframe: CFrame, offset: number): void {
    const [axis, angle] = toAxisAngle(cframe);
    let zAxis = axis.Z;
    if (isNaN(zAxis))
      zAxis = 0;

    const zSign = sign(zAxis);
    let xAxis = axis.X;
    if (isNaN(xAxis))
      xAxis = 0;
    let yAxis = axis.Y;
    if (isNaN(yAxis))
      yAxis = 0;

    const maxY = (1 - xAxis ** 2) ** 0.5;
    let mappedX = clamp(map(xAxis, -1, 1, 0, LIMIT_16_BITS), 0, LIMIT_16_BITS);
    let mappedY = clamp(map(yAxis, -maxY, maxY, 0, LIMIT_15_BITS) * zSign, -LIMIT_15_BITS, LIMIT_15_BITS - 1);
    let mappedAngle = clamp(map(angle, 0, PI, 0, LIMIT_16_BITS), 0, LIMIT_16_BITS);
    if (!isNaN(mappedX))
      assertNumberRange(mappedX, 2, false);
    if (!isNaN(mappedY))
      assertNumberRange(mappedY, 2, true);
    if (!isNaN(mappedAngle))
      assertNumberRange(mappedAngle, 2, false);

    writeu16(buf, offset, mappedX);
    writei16(buf, offset + 2, mappedY);
    writeu16(buf, offset + 4, mappedAngle);
  }

  function validate(value: unknown, [kind]: SerializerSchema): void {
    if (isNumberType(kind)) {
      const size = sizeOfNumberType(kind);
      const isSigned = kind.sub(1, 1) !== "u";
      assertNumberRange(value as number, size, isSigned);
    }
  }

  function writeBits(buf: buffer, offset: number, bitOffset: number, byteCount: number, variable: boolean): void {
    const bitSize = bits.size();
    for (const i of $range(0, byteCount - 1)) {
      let currentByte = 0;
      const remainingBits = bitSize - bitOffset;
      const bitsThisByte = clamp(remainingBits, 0, 7);
      for (const bit of $range(variable ? 1 : 0, bitsThisByte)) {
        currentByte += (bits[bitOffset] ? 1 : 0) << bit;
        bitOffset++;
      }

      if (variable && i !== byteCount - 1)
        currentByte++;

      writeu8(buf, offset, currentByte);
      offset++;
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
    originalValue = value;
    serialize(value, schema);

    if (!containsPacking) {
      const trimmed = createBuffer(offset);
      copy(trimmed, 0, buf, 0, offset);

      return createSerializedData(trimmed, blobs);
    }

    const [minimumBytes, variableBytes, totalBytes] = calculatePackedBytes();
    const trimmed = createBuffer(offset + totalBytes);
    copy(trimmed, totalBytes, buf, 0, offset);

    if (minimumBytes > 0)
      writeBits(trimmed, 0, 0, minimumBytes, false);

    if (variableBytes > 0)
      writeBits(trimmed, minimumBytes, minimumBytes * 8, variableBytes, true);

    return createSerializedData(trimmed, blobs);
  };
}

function createSerializedData(trimmed: buffer, blobs: defined[]): SerializedData {
  return {
    buf: bufferLength(trimmed) === 0 ? undefined : trimmed,
    blobs: blobs.isEmpty() ? undefined : blobs
  };
}
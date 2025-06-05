import { sizeOfNumberType, sign } from "./utility";
import { f24 } from "./utility/f24";
import { f16 } from "./utility/f16";
import { u24 } from "./utility/u24";
import { i24 } from "./utility/i24";
import { AXIS_ALIGNED_ORIENTATIONS, COMMON_UDIM2S, COMMON_VECTORS } from "./constants";
import type { ProcessedInfo } from "./info-processing";
import type { NumberType, Primitive, SerializedData, SerializerSchema } from "./types";

const { ceil, map, pi: PI } = math;
const { create: createVector } = vector;
const {
  create: createBuffer,
  readi8, readi16, readi32, readu8, readu16, readu32, readf32, readf64, readstring
} = buffer;
const { fromAxisAngle } = CFrame;
const { fromRGB } = Color3;

export function getDeserializeFunction<T>(
  { schema, containsPacking, containsUnknownPacking, minimumPackedBits, minimumPackedBytes, sortedEnums }: ProcessedInfo
): (data: SerializedData) => T {
  let bits = table.create<boolean>(ceil(minimumPackedBits / 8) * 8);
  let bitIndex = 0;
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
        return readu8(buf, currentOffset);
      case "u16":
        offset += 2;
        return readu16(buf, currentOffset);
      case "u24":
        offset += 3;
        return u24.read(buf, currentOffset);
      case "u32":
        offset += 4;
        return readu32(buf, currentOffset);
      case "i8":
        offset += 1;
        return readi8(buf, currentOffset);
      case "i16":
        offset += 2;
        return readi16(buf, currentOffset);
      case "i24":
        offset += 3;
        return i24.read(buf, currentOffset);
      case "i32":
        offset += 4;
        return readi32(buf, currentOffset);
      case "f16":
        offset += 2;
        return f16.read(buf, currentOffset);
      case "f24":
        offset += 3;
        return f24.read(buf, currentOffset);
      case "f32":
        offset += 4;
        return readf32(buf, currentOffset);
      case "f64":
        offset += 8;
        return readf64(buf, currentOffset);
      case "bool":
        if (packing)
          return bits[bitIndex++];

        offset += 1;
        return readu8(buf, currentOffset) === 1;
      case "string": {
        const [_, lengthType] = meta;
        const lengthSize = sizeOfNumberType(lengthType);
        const length = deserialize(lengthType) as number;
        offset += length;

        return readstring(buf, currentOffset + lengthSize, length);
      }
      case "enum": {
        const index = readu8(buf, currentOffset);
        offset += 1;

        return sortedEnums[meta[1]!][index];
      }
      case "numbersequence": {
        const keypointCount = readu8(buf, currentOffset);
        const keypoints: NumberSequenceKeypoint[] = [];
        let bytesRead = 1;

        for (const i of $range(1, keypointCount)) {
          const keypointOffset = currentOffset + 1 + 6 * (i - 1);
          const time = readu16(buf, keypointOffset) / 0xFFFF;
          const value = readu16(buf, keypointOffset + 2) / 0xFFFF;
          const envelope = readu16(buf, keypointOffset + 4) / 0xFFFF;

          bytesRead += 6;
          keypoints.push(new NumberSequenceKeypoint(time, value, envelope));
        }

        offset += bytesRead;
        return new NumberSequence(keypoints);
      }
      case "color": {
        const r = readu8(buf, currentOffset) as number;
        const g = readu8(buf, currentOffset + 1) as number;
        const b = readu8(buf, currentOffset + 2) as number;
        offset += 3;

        return fromRGB(r, g, b);
      }
      case "udim": {
        const [_, scaleType, offsetType] = meta;
        const scale = deserialize(scaleType) as number;
        const offset = deserialize(offsetType) as number;
        return new UDim(scale, offset);
      }
      case "udim2": {
        const [_, scaleXType, offsetXType, scaleYType, offsetYType] = meta;
        if (packing) {
          const isOptimized = bits[bitIndex++];
          if (isOptimized) {
            const packed = readu8(buf, currentOffset);
            offset += 1;

            const index = packed & 0x7
            if (index !== 0x7)
              return COMMON_UDIM2S[index];
          }
        }

        const scaleX = deserialize(scaleXType) as number;
        const offsetX = deserialize(offsetXType) as number;
        const scaleY = deserialize(scaleYType) as number;
        const offsetY = deserialize(offsetYType) as number;
        return new UDim2(scaleX, offsetX, scaleY, offsetY);
      }
      case "vector": {
        const [_, xType, yType, zType] = meta;
        if (packing) {
          const isOptimized = bits[bitIndex++];
          if (isOptimized) {
            const packed = readu8(buf, currentOffset);
            offset += 1;

            const index = packed & 0x7F
            if (index !== 0x7F)
              return COMMON_VECTORS[index];
          }
        }

        const x = deserialize(xType) as number;
        const y = deserialize(yType) as number;
        const z = deserialize(zType) as number;
        return createVector(x, y, z);
      }
      case "cframe": {
        const [_, xType, yType, zType] = meta;
        if (packing) {
          const isOptimized = bits[bitIndex++];
          if (isOptimized) {
            const packed = readu8(buf, currentOffset);
            offset += 1;

            const optimizedPosition = packed & 0x60;
            const optimizedRotation = packed & 0x1F;

            let rotation: CFrame;
            if (optimizedRotation !== 0x1F)
              rotation = AXIS_ALIGNED_ORIENTATIONS[optimizedRotation];
            else {
              const mappedX = readu16(buf, currentOffset + 1);
              let mappedY = readi16(buf, currentOffset + 3);
              const mappedAngle = readu16(buf, currentOffset + 5);
              offset += 6;

              const zSign = sign(mappedY);
              mappedY *= zSign;

              const max16Bits = 2 ** 16 - 1;
              const axisX = map(mappedX, 0, max16Bits, -1, 1);
              let derivedMaximumSquared = 1 - axisX ** 2;
              const derivedMaximum = derivedMaximumSquared ** 0.5;
              const axisY = map(mappedY, 0, 2 ** 15 - 1, -derivedMaximum, derivedMaximum);
              derivedMaximumSquared -= axisY ** 2;

              const axisZ = (derivedMaximumSquared ** 0.5) * zSign;
              const axis = createVector(axisX, axisY, axisZ) as unknown as Vector3;
              const angle = map(mappedAngle, 0, max16Bits, 0, PI);

              rotation = fromAxisAngle(axis, angle);
            }

            let position: Vector3;
            if (optimizedPosition === 0x20)
              position = Vector3.zero;
            else if (optimizedPosition === 0x60)
              position = Vector3.one;
            else
              position = deserialize(["vector", xType, yType, zType]) as Vector3;

            return rotation.add(position);
          }
        }

        return deserializeCFrame(xType, yType, zType);
      }
      case "list": {
        const [_, elementMeta, sizeMeta] = meta;
        const size = deserialize(sizeMeta) as number;
        const list: defined[] = [];
        for (const _ of $range(1, size))
          list.push(deserialize(elementMeta)!);

        return list
      }
      case "object": {
        const [_, fields] = meta;
        const obj: Record<string, unknown> = {};
        for (const [name, fieldMeta] of fields)
          obj[name] = deserialize(fieldMeta);

        return obj;
      }
      case "union": {
        const [_, tagName, tagged, byteSize] = meta;

        let tagIndex;
        if (byteSize === 1) {
          offset += 1;
          tagIndex = readu8(buf, currentOffset);
        } else if (byteSize === 2) {
          offset += 2;
          tagIndex = readu16(buf, currentOffset);
        } else
          tagIndex = bits[bitIndex++] ? 0 : 1;

        const [tagValue, tagMetadata] = tagged[tagIndex];
        const object = deserialize(tagMetadata);
        (object as Record<string, unknown>)[tagName] = tagValue;

        return object;
      }
      case "literal": {
        const [_, literals, byteSize] = meta;
        if (byteSize === 1) {
          offset += 1;
          return literals[readu8(buf, currentOffset)];
        } else if (byteSize === 2) {
          offset += 2;
          return literals[readu16(buf, currentOffset)];
        } else if (byteSize === -1)
          return literals[bits[bitIndex++] ? 0 : 1];

        return literals[0];
      }
      case "tuple": {
        const [_, elements, restMetadata, restLengthType] = meta;
        let restLength = 0;
        if (restMetadata !== undefined)
          restLength = deserialize(restLengthType!) as number;

        const tuple = new Array<defined>(elements.size() + restLength);
        for (const element of elements)
          tuple.push(deserialize(element) as defined);

        if (restMetadata !== undefined)
          for (const _ of $range(1, restLength))
            tuple.push(deserialize(restMetadata) as defined);

        return tuple;
      }
      case "set": {
        const [_, elementType, lengthType] = meta;
        const length = deserialize(lengthType) as number;
        const set = new Set<unknown>;

        if (length > 0)
          for (const _ of $range(1, length))
            set.add(deserialize(elementType));

        return set;
      }
      case "map": {
        const [_, keyType, valueType, lengthType] = meta;
        const length = deserialize(lengthType) as number;
        const map = new Map<unknown, unknown>;

        if (length > 0)
          for (const _ of $range(1, length))
            map.set(deserialize(keyType), deserialize(valueType));

        return map;
      }

      case "optional": {
        const [_, valueMeta] = meta;
        const exists = packing
          ? bits[bitIndex++]
          : readu8(buf, offset++) === 1;

        return exists ? deserialize(valueMeta) : undefined;
      }
      case "packed": {
        const [_, innerType] = meta;
        const enclosing = packing;
        packing = true;
        const value = deserialize(innerType);
        packing = enclosing;

        return value;
      }

      case "blob":
        return blobs![blobIndex++];

      default:
        throw `[@rbxts/serio]: Cannot deserialize unknown schema type '${meta[0]}'`;
    }
  }

  function deserializeCFrame(xType: Primitive<NumberType>, yType: Primitive<NumberType>, zType: Primitive<NumberType>): CFrame {
    const currentOffset = offset;
    const mappedX = readu16(buf, currentOffset);
    let mappedY = readi16(buf, currentOffset + 2);
    const mappedAngle = readu16(buf, currentOffset + 4);
    offset += 6;

    const zSign = sign(mappedY);
    mappedY *= zSign;

    const max16Bits = 2 ** 16 - 1;
    const axisX = map(mappedX, 0, max16Bits, -1, 1);
    let derivedMaximumSquared = 1 - axisX ** 2;
    const derivedMaximum = derivedMaximumSquared ** 0.5;
    const axisY = map(mappedY, 0, 2 ** 15 - 1, -derivedMaximum, derivedMaximum);
    derivedMaximumSquared -= axisY ** 2;

    const axisZ = (derivedMaximumSquared ** 0.5) * zSign;
    const axis = createVector(axisX, axisY, axisZ) as unknown as Vector3;
    const angle = map(mappedAngle, 0, max16Bits, 0, PI);
    const axisAngle = fromAxisAngle(axis, angle);
    const position = deserialize(["vector", xType, yType, zType]) as Vector3;

    return axisAngle.add(position);
  }

  function readBits(): void {
    const guaranteedBytes = minimumPackedBytes;

    while (true) {
      const currentByte = readu8(buf, offset);
      const guaranteedByte = offset++ < guaranteedBytes;

      for (const bit of $range(guaranteedByte ? 0 : 1, 7)) {
        const value = (currentByte >>> bit) % 2 === 1;
        bits.push(value);
      }

      // Variable bit indicated the end.
      if (!guaranteedByte && currentByte % 2 === 0)
        break;

      // We only have guaranteed bits and we reached the end.
      if (!containsUnknownPacking && offset === guaranteedBytes)
        break;
    }
  }

  return (data: SerializedData) => {
    ({
      buf = createBuffer(0),
      blobs =[]
    } = data);
    offset = 0;
    blobIndex = 0;
    bitIndex = 0;

    if (containsPacking) {
      bits = [];
      readBits();
    }

    return deserialize(schema) as T;
  };
}
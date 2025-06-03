import { sizeOfIntType, readF16, readF24, sign } from "./utility";
import type { ProcessedInfo } from "./info-processing";
import type { IntType, Primitive, SerializedData, SerializerSchema } from "./types";
import { AXIS_ALIGNED_ORIENTATIONS, COMMON_VECTORS } from "./constants";

const { ceil, map, pi: PI } = math;
const { fromAxisAngle } = CFrame;

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
        if (packing)
          return bits[bitIndex++];

        offset += 1;
        return buffer.readu8(buf, currentOffset) === 1;
      case "string": {
        const [_, lengthType] = meta;
        const lengthSize = sizeOfIntType(lengthType);
        const length = deserialize(lengthType) as number;
        offset += length;

        return buffer.readstring(buf, currentOffset + lengthSize, length);
      }
      case "enum": {
        const index = buffer.readu8(buf, currentOffset);
        offset += 1;

        return sortedEnums[meta[1]!][index];
      }
      case "vector": {
        const [_, xType, yType, zType] = meta;
        if (packing) {
          const isOptimized = bits[bitIndex++];
          if (isOptimized) {
            offset += 1;
            const index = buffer.readu8(buf, currentOffset);
            return COMMON_VECTORS[index];
          }
        }

        const x = deserialize(xType) as number;
        const y = deserialize(yType) as number;
        const z = deserialize(zType) as number;
        return vector.create(x, y, z);
      }
      case "cframe": {
        const [_, xType, yType, zType] = meta;
        if (packing) {
          const isOptimized = bits[bitIndex++];
          if (isOptimized) {
            const packed = buffer.readu8(buf, currentOffset);
            offset += 1;

            const optimizedPosition = packed & 0x60;
            const optimizedRotation = packed & 0x1F;

            let rotation: CFrame;
            if (optimizedRotation !== 0x1F)
              rotation = AXIS_ALIGNED_ORIENTATIONS[optimizedRotation];
            else {
              const mappedX = buffer.readu16(buf, currentOffset + 1);
              let mappedY = buffer.readi16(buf, currentOffset + 3);
              const mappedAngle = buffer.readu16(buf, currentOffset + 5);
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
              const axis = vector.create(axisX, axisY, axisZ) as unknown as Vector3;
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
      case "union": {
        const [_, tagName, tagged, byteSize] = meta;

        let tagIndex;
        if (byteSize === 1) {
          offset += 1;
          tagIndex = buffer.readu8(buf, currentOffset);
        } else if (byteSize === 2) {
          offset += 2;
          tagIndex = buffer.readu16(buf, currentOffset);
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
          return literals[buffer.readu8(buf, currentOffset)];
        } else if (byteSize === 2) {
          offset += 2;
          return literals[buffer.readu16(buf, currentOffset)];
        } else if (byteSize === -1)
          return literals[bits[bitIndex++] ? 0 : 1];

        return literals[0];
      }
      case "tuple": {
        const [_, elements, restMetadata] = meta;
        let restLength = 0;
        if (restMetadata !== undefined) {
          offset += 4;
          restLength = buffer.readu32(buf, currentOffset);
        }

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

      case "optional": {
        const [_, valueMeta] = meta;
        const exists = packing
          ? bits[bitIndex++]
          : buffer.readu8(buf, offset++) === 1;

        return exists ? deserialize(valueMeta) : undefined;
      }
      case "packed": {
        const [_, innerType] = meta;
        const enclosingPacking = packing;
        packing = true;

        const value = deserialize(innerType);
        packing = enclosingPacking;

        return value;
      }

      case "blob":
        return blobs![blobIndex++];
    }
  }

  function deserializeCFrame(xType: Primitive<IntType>, yType: Primitive<IntType>, zType: Primitive<IntType>) {
    const currentOffset = offset;
    const mappedX = buffer.readu16(buf, currentOffset);
    let mappedY = buffer.readi16(buf, currentOffset + 2);
    const mappedAngle = buffer.readu16(buf, currentOffset + 4);
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
    const axis = vector.create(axisX, axisY, axisZ) as unknown as Vector3;
    const angle = map(mappedAngle, 0, max16Bits, 0, PI);
    const axisAngle = fromAxisAngle(axis, angle);

    const x = deserialize(xType) as number;
    const y = deserialize(yType) as number;
    const z = deserialize(zType) as number;
    const position = vector.create(x, y, z) as unknown as Vector3;

    return axisAngle.add(position);
  }

  function readBits(): void {
    const guaranteedBytes = minimumPackedBytes;

    while (true) {
      const currentByte = buffer.readu8(buf, offset);
      const guaranteedByte = offset < guaranteedBytes;

      for (const bit of $range(guaranteedByte ? 0 : 1, 7)) {
        const value = (currentByte >>> bit) % 2 === 1;
        bits.push(value);
      }

      offset += 1;

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
      buf = buffer.create(0),
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
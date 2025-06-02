import type { ProcessedInfo, SerializedData, SerializerSchema } from "./types";
import { getIntTypeSize, readF16, readF24, sign } from "./utility";

const { map, pi: PI } = math;
const { fromAxisAngle } = CFrame;

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
      case "string": {
        const [_, lengthType] = meta;
        const lengthSize = getIntTypeSize(lengthType);
        const length = deserialize(lengthType) as number;
        offset += length;

        return buffer.readstring(buf, currentOffset + lengthSize, length);
      }
      case "vector": {
        const [_, xType, yType, zType] = meta;
        const x = deserialize(xType) as number;
        const y = deserialize(yType) as number;
        const z = deserialize(zType) as number;

        return vector.create(x, y, z);
      }
      case "cframe": {
        const [_, xType, yType, zType] = meta;

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

        return buffer.readu8(buf, currentOffset) === 1
          ? deserialize(valueMeta)
          : undefined;
      }

      case "blob":
        return blobs![blobIndex++];
    }

  }

  return (data: SerializedData) => {
    ({
      buf = buffer.create(0),
      blobs =[]
    } = data);
    offset = 0;
    blobIndex = 0;

    return deserialize(schema) as T;
  };
}
import { Assert, Fact, Theory, InlineData } from "@rbxts/runit";

import { AXIS_ALIGNED_ORIENTATIONS, COMMON_VECTORS } from "./constants";
import { BaseSerializationTest } from "./utility";
import { fuzzyEq } from "../../src/utility";
import type { u8, Vector, Transform, Packed } from "./index";

const angles = CFrame.Angles;
const { rad } = math;
const { len, readu8, readf32 } = buffer;

class Serialization3DTest extends BaseSerializationTest {
  @Fact
  public vector(): void {
    const value = vector.create(1, 2, 3) as unknown as Vector3;
    const { buf } = this.serialize<Vector3>(value);
    Assert.defined(buf);
    Assert.equal(12, len(buf));

    const x = readf32(buf, 0);
    const y = readf32(buf, 4);
    const z = readf32(buf, 8);
    Assert.equal(1, x);
    Assert.equal(2, y);
    Assert.equal(3, z);
  }

  @Fact
  public vectorCustom(): void {
    const value = vector.create(1, 2, 3) as unknown as Vector3;
    const { buf } = this.serialize<Vector<u8>>(value);
    Assert.defined(buf);
    Assert.equal(3, len(buf));

    const x = readu8(buf, 0);
    const y = readu8(buf, 1);
    const z = readu8(buf, 2);
    Assert.equal(1, x);
    Assert.equal(2, y);
    Assert.equal(3, z);
  }

  @Theory
  @InlineData(vector.zero)
  @InlineData(vector.one)
  @InlineData(vector.create(-1, -1, -1))
  @InlineData(vector.create(1, 0, 0))
  @InlineData(vector.create(0, 1, 0))
  @InlineData(vector.create(0, 0, 1))
  @InlineData(vector.create(-1, 0, 0))
  @InlineData(vector.create(0, -1, 0))
  @InlineData(vector.create(0, 0, -1))
  @InlineData(vector.create(1, 1, 0))
  @InlineData(vector.create(1, 0, 1))
  @InlineData(vector.create(0, 1, 1))
  @InlineData(vector.create(-1, -1, 0))
  @InlineData(vector.create(-1, 0, -1))
  @InlineData(vector.create(0, -1, -1))
  @InlineData(vector.create(1, -1, 0))
  @InlineData(vector.create(-1, 1, 0))
  @InlineData(vector.create(0, -1, 1))
  @InlineData(vector.create(0, 1, -1))
  @InlineData(vector.create(-1, 0, 1))
  @InlineData(vector.create(1, 0, -1))
  public packedVectorSpecialCases(vector: vector): void {
    const value = vector as unknown as Vector3;
    const expectedIndex = COMMON_VECTORS.findIndex(v => fuzzyEq(v, value));
    Assert.notEqual(-1, expectedIndex);

    const { buf } = this.serialize<Packed<Vector<u8>>>(value);
    Assert.defined(buf);
    Assert.equal(2, len(buf));

    const optimized = (readu8(buf, 0) & 1) === 1;
    Assert.true(optimized);

    const packed = readu8(buf, 1);
    Assert.equal(expectedIndex, packed);
  }

  @Fact
  public cframe(): void {
    const value = new CFrame(1, 2, 3);
    const { buf } = this.serialize<CFrame>(value);
    Assert.defined(buf);
    Assert.equal(18, len(buf));

    const x = readf32(buf, 6);
    const y = readf32(buf, 10);
    const z = readf32(buf, 14);
    Assert.equal(1, x);
    Assert.equal(2, y);
    Assert.equal(3, z);
  }

  @Fact
  public cframeCustom(): void {
    const value = new CFrame(1, 2, 3);
    const { buf } = this.serialize<Transform<u8>>(value);
    Assert.defined(buf);
    Assert.equal(9, len(buf));

    const x = readu8(buf, 6);
    const y = readu8(buf, 7);
    const z = readu8(buf, 8);
    Assert.equal(1, x);
    Assert.equal(2, y);
    Assert.equal(3, z);
  }

  @Fact
  public packedCFrameBothSpecialCases(): void {
    const value = new CFrame(0, 0, 0).mul(CFrame.Angles(0, 0, 0));
    const { buf } = this.serialize<Packed<Transform<u8>>>(value);
    Assert.defined(buf);
    Assert.equal(2, len(buf));

    const isOptimized = (readu8(buf, 0) & 1) === 1;
    Assert.true(isOptimized);

    const packed = readu8(buf, 1);
    const optimizedPosition = packed & 0x60;
    Assert.equal(0x20, optimizedPosition);

    const optimizedRotation = packed & 0x1F;
    Assert.notEqual(0x1F, optimizedRotation);
    Assert.equal(0, optimizedRotation);
  }

  @Theory
  @InlineData(Vector3.zero, 0x20)
  @InlineData(Vector3.one, 0x60)
  public packedCFramePositionSpecialCases(position: Vector3, bits: number): void {
    const value = new CFrame(position).mul(CFrame.Angles(rad(45), 0, 0));
    const { buf } = this.serialize<Packed<Transform<u8>>>(value);
    Assert.defined(buf);
    Assert.equal(8, len(buf));

    const isOptimized = (readu8(buf, 0) & 1) === 1;
    Assert.true(isOptimized);

    const packed = readu8(buf, 1);
    const optimizedPosition = packed & 0x60;
    Assert.equal(bits, optimizedPosition);

    const optimizedRotation = packed & 0x1F;
    Assert.equal(0x1F, optimizedRotation);
  }

  @Theory
  @InlineData(vector.zero)
  @InlineData(vector.create(0, 180, 0))
  @InlineData(vector.create(0, -180, 0))
  @InlineData(vector.create(90, 0, 0))
  @InlineData(vector.create(-90, -180, 0))
  @InlineData(vector.create(0, 180, 180))
  @InlineData(vector.create(0, 0, 180))
  @InlineData(vector.create(-90, 0, 0))
  @InlineData(vector.create(90, 180, 0))
  @InlineData(vector.create(0, 180, 90))
  @InlineData(vector.create(0, 0, -90))
  @InlineData(vector.create(0, 90, 90))
  @InlineData(vector.create(0, -90, -90))
  @InlineData(vector.create(0, 0, 90))
  @InlineData(vector.create(0, -180, -90))
  @InlineData(vector.create(0, -90, 90))
  @InlineData(vector.create(0, 90, -90))
  @InlineData(vector.create(-90, -90, 0))
  @InlineData(vector.create(90, 90, 0))
  @InlineData(vector.create(0, -90, 0))
  @InlineData(vector.create(0, 90, 0))
  @InlineData(vector.create(90, -90, 0))
  @InlineData(vector.create(-90, 90, 0))
  @InlineData(vector.create(0, 90, 180))
  @InlineData(vector.create(0, -90, -180))
  public packedCFrameRotationSpecialCases({ x, y, z }: vector): void {
    const rotation = angles(rad(x), rad(y), rad(z));
    const expectedIndex = AXIS_ALIGNED_ORIENTATIONS.findIndex(v => v === rotation);
    Assert.notEqual(-1, expectedIndex);

    const value = new CFrame(69, 69, 69).mul(rotation);
    const { buf } = this.serialize<Packed<Transform<u8>>>(value);
    Assert.defined(buf);
    Assert.equal(5, len(buf));

    const isOptimized = (readu8(buf, 0) & 1) === 1;
    Assert.true(isOptimized);

    const packed = readu8(buf, 1);
    const optimizedPosition = packed & 0x60;
    Assert.notEqual(0x20, optimizedPosition);
    Assert.notEqual(0x60, optimizedPosition);

    const optimizedRotation = packed & 0x1F;
    Assert.notEqual(0x1F, optimizedRotation);
    Assert.equal(expectedIndex, optimizedRotation);
  }
}

export = Serialization3DTest;
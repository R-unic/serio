# Serio

Binary (buffer) serialization library for Roblox built on Flamework.

Heavily inspired by @rbxts/flamework-binary-serializer. It generates schemas for ser/des from just a type just like FBS.

> [!CAUTION]
> Depends on `rbxts-transformer-flamework`!

## Getting started

### Schemas

Schemas in Serio are just types. The most basic of schemas is just a singular type, such as `boolean`, `u8`, etc. However schemas can also contain objects, lists, sets, maps, tuples, and several Roblox data types. As an example:

```ts
import type { u8 } from "@rbxts/serio";

interface MySchema {
  readonly epic: boolean;
  readonly foo: u8;
}
```

### Serializers

Only one (global) function is exposed by Serio, `createSerializer()`. It's a macro you will pass your schema into to create a serializer. Serializers have two methods. `serialize()` and `deserialize()`. Serialized data contains a buffer (`buf`), and a list of blobs (`blobs`) (values which can not, or should not, be serialized. e.x. instances)

```ts
import createSerializer from "@rbxts/serio";

const mySerializer = createSerializer<MySchema>();
const data = mySerializer.serialize({ epic: true, foo: 69 });
const result = mySerializer.deserialize(data);
print(data.buf, data.blobs);
print(result.epic, result.foo);
```

## Data Types

Serio can serialize many data types, including numeric types not natively supported by the `buffer` library. Namely

### Safety

Serio automatically asserts that inputs are within the bounds of their respective type. (e.x. `u8` only allows numbers 0 to 255)

### Extended Support

Serio supports data types that are not natively supported by the `buffer` library or Roblox. Currently the only examples of this are `f24`,`f16`, `u24`, and `i24`.

```ts
import type { f16, f24, u24, i24 } from "@rbxts/serio";

interface CoolTypes {
  readonly a: f16;
  readonly b: f24;
  readonly c: u24;
  readonly d: i24;
}
```

### Customization

Serio encourages full customization over the size of serialed values.

```ts
import type { List, String, HashSet, HashMap, Tuple, Vector, ScaleOffset, ScaleOffset2, i8, u8, i16, u16 } from "@rbxts/serio";

interface Example {
  // serialize the length of the array/string/tuple/set/map as a u8, allowing a maximum of 255 elements (which most collections are under anyways)
  list: List<string, u8>;
  string: String<u8>;
  set: HashSet<"a" | "b" | "c", u8>;
  map: HashMap<string, i8, u8>;
  tuple: Tuple<[boolean, u8, string], u8>;

  // serialize X and Z as i16s but Y as a u16, allowing a range of:
  // X: -32,768 - 32,767
  // Y: 0 - 65,535
  // Z: -32,768 - 32,767
  positiveYVector: Vector<i16, u16, i16>;
  velocity: Vector<i8>; // serialize X, Y, and Z as i8s

  // serialize positional X, Y, and Z as i16s
  cframe: Transform<i16>;

  // serialize Scale as an f32, and Offset as a u8
  udim: ScaleOffset<f32, u8>;
  // serialize X.Scale and Y.Scale as f32s, and X.Offset and Y.Offset u8s
  udim2: ScaleOffset2<f32, u8>;
  // serialize X.Scale as an f32, Y.Scale as a u8, X.Offset as a u8, and Y.Offset as an i8
  specificUDim2: ScaleOffset2<f32, u8, u8, i8>;
}

const serializer = createSerializer<Example>();
```

### Packing

Serio can bitpack your data for you using the `Packed<T>` datatype. It bitpacks every type under `T` recursively.

You may know a boolean can be represented by just one bit, but to insert a boolean into a buffer you need to serialize it as an entire byte (8 bits). This is where bitpacking comes in. We can keep track of a list of bits to later combine together into a single byte, rather than one byte for each of your booleans.

This doesn't just affect booleans though, it also affects:

- Optional values
  - Boolean for whether the value exists
- UDim2s
  - Optimization for [UDim2 special cases](https://github.com/R-unic/serio/blob/master/src/constants.ts#L123)
  - Boolean for whether the UDim2 was optimized
- Vector3s
  - Optimization for [vector special cases](https://github.com/R-unic/serio/blob/master/src/constants.ts#L37)
  - Boolean for whether the vector was optimized
- CFrames
  - Optimization for two vector special cases (0,0,0 and 1,1,1) and [axis aligned rotation special cases](https://github.com/R-unic/serio/blob/master/src/constants.ts#L8)
  - Boolean for whether the position was optimized
  - Boolean for whether the rotation was optimized

### Supported Types

- All primitives
- Tuples
- Objects
- Array<T>
- Map<K, V>
- Set<T>
- CFrame
- Vector3
- UDim
- UDim2
- Color3
- ColorSequence
- NumberSequence
- Literal unions
- Enums

## Optimization

CFrames use 6 bytes less than in FBS by default. In FBS CFrames are serialized as six f32s, 24 bytes. The default for Serio is three f32s for position, two u16s for rotation X/Z, and one i16 for rotation Y. And of course you can make this less by not using the default type for position X/Y/Z (`Transform<X, Y, Z>`).

// This does not account for potential floating point drift but this is likely not an issue for axis aligned orientations.

const { rad, log } = math;
const { zero: zeroVector, one: oneVector, create: createVector } = vector;
const { fromScale } = UDim2;
const { Angles: angles } = CFrame;

export const IS_LUNE = _VERSION.sub(1, 4) === "Lune";

export const AXIS_ALIGNED_ORIENTATIONS = [
  zeroVector,
  createVector(0, 180, 0),
  createVector(90, 0, 0),
  createVector(-90, -180, 0),
  createVector(0, 180, 180),
  createVector(0, 0, 180),
  createVector(-90, 0, 0),
  createVector(90, 180, 0),
  createVector(0, 180, 90),
  createVector(0, 0, -90),
  createVector(0, 90, 90),
  createVector(0, -90, -90),
  createVector(0, 0, 90),
  createVector(0, -180, -90),
  createVector(0, -90, 90),
  createVector(0, 90, -90),
  createVector(-90, -90, 0),
  createVector(90, 90, 0),
  createVector(0, -90, 0),
  createVector(0, 90, 0),
  createVector(90, -90, 0),
  createVector(-90, 90, 0),
  createVector(0, 90, 180),
  createVector(0, -90, -180),
].map(({ x, y, z }) => angles(rad(x), rad(y), rad(z)));

const twoSameAxesDir = 0.7071068286895752;
const threeSameAxesDir = 0.5773503184318542;
export const COMMON_VECTORS = [
  // Zero and Unit
  zeroVector,
  oneVector,
  createVector(-1, -1, -1),

  // Axis-aligned directions
  createVector(1, 0, 0),
  createVector(0, 1, 0),
  createVector(0, 0, 1),
  createVector(-1, 0, 0),
  createVector(0, -1, 0),
  createVector(0, 0, -1),

  // Diagonals (2 axes)
  createVector(1, 1, 0),
  createVector(1, 0, 1),
  createVector(0, 1, 1),
  createVector(-1, -1, 0),
  createVector(-1, 0, -1),
  createVector(0, -1, -1),
  createVector(1, -1, 0),
  createVector(-1, 1, 0),
  createVector(0, -1, 1),
  createVector(0, 1, -1),
  createVector(-1, 0, 1),
  createVector(1, 0, -1),

  // Half vectors
  createVector(0.5, 0, 0),
  createVector(0, 0.5, 0),
  createVector(0, 0, 0.5),
  createVector(-0.5, 0, 0),
  createVector(0, -0.5, 0),
  createVector(0, 0, -0.5),
  createVector(0.5, 0.5, 0),
  createVector(0.5, 0, 0.5),
  createVector(0, 0.5, 0.5),
  createVector(-0.5, -0.5, 0),
  createVector(-0.5, 0, -0.5),
  createVector(0, -0.5, -0.5),
  createVector(0.5, 0.5, 0.5),
  createVector(-0.5, -0.5, -0.5),

  // Quarter vectors
  createVector(0.25, 0.25, 0.25),
  createVector(-0.25, 0.25, 0),
  createVector(0.75, 0, 0.25),
  createVector(-0.25, -0.25, 0.25),
  createVector(0.25, -0.25, -0.25),

  // Normalized diagonals (2 axes)
  createVector(twoSameAxesDir, 0, twoSameAxesDir),
  createVector(0, twoSameAxesDir, twoSameAxesDir),
  createVector(twoSameAxesDir, twoSameAxesDir, 0),
  createVector(-twoSameAxesDir, 0, twoSameAxesDir),
  createVector(twoSameAxesDir, 0, -twoSameAxesDir),
  createVector(0, -twoSameAxesDir, twoSameAxesDir),
  createVector(-twoSameAxesDir, -twoSameAxesDir, 0),
  createVector(twoSameAxesDir, -twoSameAxesDir, 0),

  // Normalized diagonals (3 axes)
  createVector(threeSameAxesDir, threeSameAxesDir, threeSameAxesDir),
  createVector(-threeSameAxesDir, threeSameAxesDir, threeSameAxesDir),
  createVector(threeSameAxesDir, -threeSameAxesDir, threeSameAxesDir),
  createVector(threeSameAxesDir, threeSameAxesDir, -threeSameAxesDir),
  createVector(-threeSameAxesDir, -threeSameAxesDir, -threeSameAxesDir),

  // Orthogonal variants
  createVector(1, 2, -2),
  createVector(2, 1, -2),
  createVector(2, -2, 1),

  // Octant diagonals (unit)
  createVector(-1, 1, 1),
  createVector(1, -1, 1),
  createVector(1, 1, -1),
  createVector(-1, -1, 1),
  createVector(1, -1, -1),
  createVector(-1, 1, -1),

  // Out of bounds (huge) vectors
  createVector(0, 1e9, 0),
  createVector(0, 1e8, 0)
] as unknown as Vector3[];

export const COMMON_UDIM2S = [
  fromScale(0, 0),
  fromScale(1, 0),
  fromScale(0, 1),
  fromScale(1, 1),
  fromScale(0.5, 1),
  fromScale(1, 0.5),
  fromScale(0.5, 0.5),
];

export const NaN = 0 / 0;
export const LOG2 = log(2);
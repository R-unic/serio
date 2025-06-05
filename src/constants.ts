// This does not account for potential floating point drift but this is likely not an issue for axis aligned orientations.

const { rad } = math;
const angles = CFrame.Angles;

export const AXIS_ALIGNED_ORIENTATIONS = [
  vector.zero,
  vector.create(0, 180, 0),
  vector.create(90, 0, 0),
  vector.create(-90, -180, 0),
  vector.create(0, 180, 180),
  vector.create(0, 0, 180),
  vector.create(-90, 0, 0),
  vector.create(90, 180, 0),
  vector.create(0, 180, 90),
  vector.create(0, 0, -90),
  vector.create(0, 90, 90),
  vector.create(0, -90, -90),
  vector.create(0, 0, 90),
  vector.create(0, -180, -90),
  vector.create(0, -90, 90),
  vector.create(0, 90, -90),
  vector.create(-90, -90, 0),
  vector.create(90, 90, 0),
  vector.create(0, -90, 0),
  vector.create(0, 90, 0),
  vector.create(90, -90, 0),
  vector.create(-90, 90, 0),
  vector.create(0, 90, 180),
  vector.create(0, -90, -180),
].map(({ x, y, z }) => angles(rad(x), rad(y), rad(z)));

const twoSameAxesDir = 0.7071068286895752;
const threeSameAxesDir = 0.5773503184318542;
export const COMMON_VECTORS = [
  // Zero and Unit
  vector.zero,
  vector.one,
  vector.create(-1, -1, -1),

  // Axis-aligned directions
  vector.create(1, 0, 0),
  vector.create(0, 1, 0),
  vector.create(0, 0, 1),
  vector.create(-1, 0, 0),
  vector.create(0, -1, 0),
  vector.create(0, 0, -1),

  // Diagonals (2 axes)
  vector.create(1, 1, 0),
  vector.create(1, 0, 1),
  vector.create(0, 1, 1),
  vector.create(-1, -1, 0),
  vector.create(-1, 0, -1),
  vector.create(0, -1, -1),
  vector.create(1, -1, 0),
  vector.create(-1, 1, 0),
  vector.create(0, -1, 1),
  vector.create(0, 1, -1),
  vector.create(-1, 0, 1),
  vector.create(1, 0, -1),

  // Half vectors
  vector.create(0.5, 0, 0),
  vector.create(0, 0.5, 0),
  vector.create(0, 0, 0.5),
  vector.create(-0.5, 0, 0),
  vector.create(0, -0.5, 0),
  vector.create(0, 0, -0.5),
  vector.create(0.5, 0.5, 0),
  vector.create(0.5, 0, 0.5),
  vector.create(0, 0.5, 0.5),
  vector.create(-0.5, -0.5, 0),
  vector.create(-0.5, 0, -0.5),
  vector.create(0, -0.5, -0.5),
  vector.create(0.5, 0.5, 0.5),
  vector.create(-0.5, -0.5, -0.5),

  // Quarter vectors
  vector.create(0.25, 0.25, 0.25),
  vector.create(-0.25, 0.25, 0),
  vector.create(0.75, 0, 0.25),
  vector.create(-0.25, -0.25, 0.25),
  vector.create(0.25, -0.25, -0.25),

  // Normalized diagonals (2 axes)
  vector.create(twoSameAxesDir, 0, twoSameAxesDir),
  vector.create(0, twoSameAxesDir, twoSameAxesDir),
  vector.create(twoSameAxesDir, twoSameAxesDir, 0),
  vector.create(-twoSameAxesDir, 0, twoSameAxesDir),
  vector.create(twoSameAxesDir, 0, -twoSameAxesDir),
  vector.create(0, -twoSameAxesDir, twoSameAxesDir),
  vector.create(-twoSameAxesDir, -twoSameAxesDir, 0),
  vector.create(twoSameAxesDir, -twoSameAxesDir, 0),

  // Normalized diagonals (3 axes)
  vector.create(threeSameAxesDir, threeSameAxesDir, threeSameAxesDir),
  vector.create(-threeSameAxesDir, threeSameAxesDir, threeSameAxesDir),
  vector.create(threeSameAxesDir, -threeSameAxesDir, threeSameAxesDir),
  vector.create(threeSameAxesDir, threeSameAxesDir, -threeSameAxesDir),
  vector.create(-threeSameAxesDir, -threeSameAxesDir, -threeSameAxesDir),

  // Orthogonal variants
  vector.create(1, 2, -2),
  vector.create(2, 1, -2),
  vector.create(2, -2, 1),

  // Octant diagonals (unit)
  vector.create(-1, 1, 1),
  vector.create(1, -1, 1),
  vector.create(1, 1, -1),
  vector.create(-1, -1, 1),
  vector.create(1, -1, -1),
  vector.create(-1, 1, -1)
] as unknown as Vector3[];
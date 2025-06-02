// This does not account for potential floating point drift but this is likely not an issue for axis aligned orientations.

const { rad } = math;
const angles = CFrame.Angles;

export const AXIS_ALIGNED_ORIENTATIONS = [
  [0, 0, 0],
  [0, 180, 0],
  [90, 0, 0],
  [-90, -180, 0],
  [0, 180, 180],
  [0, 0, 180],
  [-90, 0, 0],
  [90, 180, 0],
  [0, 180, 90],
  [0, 0, -90],
  [0, 90, 90],
  [0, -90, -90],
  [0, 0, 90],
  [0, -180, -90],
  [0, -90, 90],
  [0, 90, -90],
  [-90, -90, 0],
  [90, 90, 0],
  [0, -90, 0],
  [0, 90, 0],
  [90, -90, 0],
  [-90, 90, 0],
  [0, 90, 180],
  [0, -90, -180],
].map(([x, y, z]) => angles(rad(x), rad(y), rad(z)));
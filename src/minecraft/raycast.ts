import { AIR, type BlockId, isSolid } from './blocks';
import { World, inBounds } from './world';

export interface RayHit {
  /** Block that was hit. */
  x: number;
  y: number;
  z: number;
  /** Adjacent empty cell for placing. */
  px: number;
  py: number;
  pz: number;
  block: BlockId;
  distance: number;
}

/**
 * Amanatides & Woo grid traversal. Returns the first solid (or optional water)
 * block along the ray, or null.
 */
export const raycast = (
  world: World,
  ox: number,
  oy: number,
  oz: number,
  dx: number,
  dy: number,
  dz: number,
  maxDist = 6,
): RayHit | null => {
  let x = Math.floor(ox);
  let y = Math.floor(oy);
  let z = Math.floor(oz);

  const stepX = dx > 0 ? 1 : dx < 0 ? -1 : 0;
  const stepY = dy > 0 ? 1 : dy < 0 ? -1 : 0;
  const stepZ = dz > 0 ? 1 : dz < 0 ? -1 : 0;

  const tDeltaX = stepX === 0 ? Infinity : Math.abs(1 / dx);
  const tDeltaY = stepY === 0 ? Infinity : Math.abs(1 / dy);
  const tDeltaZ = stepZ === 0 ? Infinity : Math.abs(1 / dz);

  let tMaxX =
    stepX === 0
      ? Infinity
      : stepX > 0
        ? (Math.floor(ox) + 1 - ox) * tDeltaX
        : (ox - Math.floor(ox)) * tDeltaX;
  let tMaxY =
    stepY === 0
      ? Infinity
      : stepY > 0
        ? (Math.floor(oy) + 1 - oy) * tDeltaY
        : (oy - Math.floor(oy)) * tDeltaY;
  let tMaxZ =
    stepZ === 0
      ? Infinity
      : stepZ > 0
        ? (Math.floor(oz) + 1 - oz) * tDeltaZ
        : (oz - Math.floor(oz)) * tDeltaZ;

  let dist = 0;
  let prevX = x;
  let prevY = y;
  let prevZ = z;

  for (let i = 0; i < maxDist * 3 + 4; i++) {
    if (inBounds(x, y, z)) {
      const block = world.get(x, y, z);
      if (block !== AIR && isSolid(block)) {
        return {
          x,
          y,
          z,
          px: prevX,
          py: prevY,
          pz: prevZ,
          block,
          distance: dist,
        };
      }
    }

    if (tMaxX < tMaxY) {
      if (tMaxX < tMaxZ) {
        dist = tMaxX;
        if (dist > maxDist) break;
        prevX = x;
        prevY = y;
        prevZ = z;
        x += stepX;
        tMaxX += tDeltaX;
      } else {
        dist = tMaxZ;
        if (dist > maxDist) break;
        prevX = x;
        prevY = y;
        prevZ = z;
        z += stepZ;
        tMaxZ += tDeltaZ;
      }
    } else if (tMaxY < tMaxZ) {
      dist = tMaxY;
      if (dist > maxDist) break;
      prevX = x;
      prevY = y;
      prevZ = z;
      y += stepY;
      tMaxY += tDeltaY;
    } else {
      dist = tMaxZ;
      if (dist > maxDist) break;
      prevX = x;
      prevY = y;
      prevZ = z;
      z += stepZ;
      tMaxZ += tDeltaZ;
    }
  }

  return null;
};

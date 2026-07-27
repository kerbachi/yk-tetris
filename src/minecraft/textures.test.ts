import { describe, expect, it } from 'vitest';
import {
  ATLAS_COLS,
  ATLAS_H,
  ATLAS_ROWS,
  ATLAS_W,
  TILE_SIZE,
  TEX,
  tileUv,
} from './textures';

describe('textures', () => {
  it('atlas math is consistent', () => {
    expect(ATLAS_W).toBe(TILE_SIZE * ATLAS_COLS);
    expect(ATLAS_H).toBe(TILE_SIZE * ATLAS_ROWS);
    expect(ATLAS_COLS * ATLAS_ROWS).toBeGreaterThanOrEqual(TEX.AMETHYST_BLOCK + 1);
  });

  it('tileUv stays inside the atlas with insets', () => {
    const { u0, v0, u1, v1 } = tileUv(TEX.GRASS_TOP);
    expect(u0).toBeGreaterThan(0);
    expect(v0).toBeGreaterThan(0);
    expect(u1).toBeLessThan(1 / ATLAS_COLS);
    expect(v1).toBeLessThan(1 / ATLAS_ROWS);
    expect(u1).toBeGreaterThan(u0);
    expect(v1).toBeGreaterThan(v0);
  });

  it('ore and mineral tiles have UVs inside the atlas', () => {
    for (const tile of [TEX.IRON_ORE, TEX.GOLD_ORE, TEX.DIAMOND_BLOCK, TEX.AMETHYST_BLOCK]) {
      const { u0, v0, u1, v1 } = tileUv(tile);
      expect(u0).toBeGreaterThanOrEqual(0);
      expect(v0).toBeGreaterThanOrEqual(0);
      expect(u1).toBeLessThanOrEqual(1);
      expect(v1).toBeLessThanOrEqual(1);
      expect(u1).toBeGreaterThan(u0);
      expect(v1).toBeGreaterThan(v0);
    }
  });
});

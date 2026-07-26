import { describe, expect, it } from 'vitest';
import { ATLAS_COLS, ATLAS_ROWS, ATLAS_SIZE, TILE_SIZE, TEX, tileUv } from './textures';

describe('textures', () => {
  it('atlas math is consistent', () => {
    expect(ATLAS_SIZE).toBe(TILE_SIZE * ATLAS_COLS);
    expect(ATLAS_COLS * ATLAS_ROWS).toBeGreaterThanOrEqual(12);
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

  it('stone tile UV lands in the first row', () => {
    const { u0, u1 } = tileUv(TEX.STONE);
    expect(u0).toBeGreaterThan(3 / ATLAS_COLS);
    expect(u1).toBeLessThan(1);
  });
});

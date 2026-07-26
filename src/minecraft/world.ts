import {
  AIR,
  BEDROCK,
  DIRT,
  GRASS,
  LEAVES,
  SAND,
  STONE,
  WATER,
  WOOD,
  type BlockId,
  isSolid,
} from './blocks';
import { fbm2, hash2 } from './noise';

export const CHUNK_SIZE = 16;
export const WORLD_CHUNKS_X = 8;
export const WORLD_CHUNKS_Y = 4;
export const WORLD_CHUNKS_Z = 8;

export const WORLD_W = WORLD_CHUNKS_X * CHUNK_SIZE;
export const WORLD_H = WORLD_CHUNKS_Y * CHUNK_SIZE;
export const WORLD_D = WORLD_CHUNKS_Z * CHUNK_SIZE;

export const SEA_LEVEL = 18;

export interface ChunkCoord {
  cx: number;
  cy: number;
  cz: number;
}

export const chunkKey = (cx: number, cy: number, cz: number): string =>
  `${cx},${cy},${cz}`;

export const inBounds = (x: number, y: number, z: number): boolean =>
  x >= 0 && y >= 0 && z >= 0 && x < WORLD_W && y < WORLD_H && z < WORLD_D;

export class World {
  readonly blocks: Uint8Array;
  readonly dirty = new Set<string>();
  readonly seed: number;

  constructor(seed = 42) {
    this.seed = seed;
    this.blocks = new Uint8Array(WORLD_W * WORLD_H * WORLD_D);
    this.generate();
  }

  index(x: number, y: number, z: number): number {
    return y * WORLD_W * WORLD_D + z * WORLD_W + x;
  }

  get(x: number, y: number, z: number): BlockId {
    if (!inBounds(x, y, z)) return AIR;
    return this.blocks[this.index(x, y, z)]!;
  }

  set(x: number, y: number, z: number, id: BlockId): boolean {
    if (!inBounds(x, y, z)) return false;
    const i = this.index(x, y, z);
    if (this.blocks[i] === id) return false;
    this.blocks[i] = id;
    this.markDirtyAt(x, y, z);
    return true;
  }

  markDirtyAt(x: number, y: number, z: number): void {
    const cx = Math.floor(x / CHUNK_SIZE);
    const cy = Math.floor(y / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    this.dirty.add(chunkKey(cx, cy, cz));
    // Neighbor chunks if on a face edge
    const lx = x % CHUNK_SIZE;
    const ly = y % CHUNK_SIZE;
    const lz = z % CHUNK_SIZE;
    if (lx === 0 && cx > 0) this.dirty.add(chunkKey(cx - 1, cy, cz));
    if (lx === CHUNK_SIZE - 1 && cx < WORLD_CHUNKS_X - 1)
      this.dirty.add(chunkKey(cx + 1, cy, cz));
    if (ly === 0 && cy > 0) this.dirty.add(chunkKey(cx, cy - 1, cz));
    if (ly === CHUNK_SIZE - 1 && cy < WORLD_CHUNKS_Y - 1)
      this.dirty.add(chunkKey(cx, cy + 1, cz));
    if (lz === 0 && cz > 0) this.dirty.add(chunkKey(cx, cy, cz - 1));
    if (lz === CHUNK_SIZE - 1 && cz < WORLD_CHUNKS_Z - 1)
      this.dirty.add(chunkKey(cx, cy, cz + 1));
  }

  heightAt(x: number, z: number): number {
    const n = fbm2(x * 0.03, z * 0.03, this.seed, 5, 2.1, 0.5);
    const ridge = fbm2(x * 0.01, z * 0.01, this.seed + 7, 3, 2, 0.55);
    const h = Math.floor(14 + n * 18 + ridge * 10);
    return Math.max(4, Math.min(WORLD_H - 6, h));
  }

  private generate(): void {
    for (let z = 0; z < WORLD_D; z++) {
      for (let x = 0; x < WORLD_W; x++) {
        const h = this.heightAt(x, z);
        const beach = h <= SEA_LEVEL + 1;
        for (let y = 0; y < WORLD_H; y++) {
          let id: BlockId = AIR;
          if (y === 0) id = BEDROCK;
          else if (y > h) {
            if (y <= SEA_LEVEL) id = WATER;
          } else if (y === h) {
            id = beach ? SAND : GRASS;
          } else if (y >= h - 3) {
            id = beach ? SAND : DIRT;
          } else {
            id = STONE;
          }
          this.blocks[this.index(x, y, z)] = id;
        }
      }
    }

    // Trees
    for (let z = 4; z < WORLD_D - 4; z += 3) {
      for (let x = 4; x < WORLD_W - 4; x += 3) {
        const roll = hash2(x, z, this.seed + 99);
        if (roll > 0.08) continue;
        const h = this.heightAt(x, z);
        if (h <= SEA_LEVEL + 1 || h + 6 >= WORLD_H) continue;
        if (this.get(x, h, z) !== GRASS) continue;
        this.placeTree(x, h + 1, z);
      }
    }

    // Mark all chunks dirty for initial mesh
    for (let cz = 0; cz < WORLD_CHUNKS_Z; cz++) {
      for (let cy = 0; cy < WORLD_CHUNKS_Y; cy++) {
        for (let cx = 0; cx < WORLD_CHUNKS_X; cx++) {
          this.dirty.add(chunkKey(cx, cy, cz));
        }
      }
    }
  }

  private placeTree(x: number, y: number, z: number): void {
    const trunk = 4 + Math.floor(hash2(x, z, this.seed + 3) * 3);
    for (let i = 0; i < trunk; i++) {
      if (inBounds(x, y + i, z)) this.blocks[this.index(x, y + i, z)] = WOOD;
    }
    const top = y + trunk;
    for (let dy = -2; dy <= 2; dy++) {
      for (let dz = -2; dz <= 2; dz++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) > 4) continue;
          if (dx === 0 && dz === 0 && dy <= 0) continue;
          const px = x + dx;
          const py = top + dy;
          const pz = z + dz;
          if (!inBounds(px, py, pz)) continue;
          if (this.blocks[this.index(px, py, pz)] === AIR) {
            this.blocks[this.index(px, py, pz)] = LEAVES;
          }
        }
      }
    }
  }

  /** Surface spawn near world center above solid ground. */
  spawnPoint(): { x: number; y: number; z: number } {
    const x = Math.floor(WORLD_W / 2);
    const z = Math.floor(WORLD_D / 2);
    let y = WORLD_H - 1;
    while (y > 0 && !isSolid(this.get(x, y, z))) y--;
    return { x: x + 0.5, y: y + 2.1, z: z + 0.5 };
  }
}

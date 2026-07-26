import { AIR, BLOCKS, WATER, type BlockId } from './blocks';
import {
  CHUNK_SIZE,
  WORLD_CHUNKS_X,
  WORLD_CHUNKS_Y,
  WORLD_CHUNKS_Z,
  World,
  inBounds,
} from './world';

export interface ChunkMeshData {
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
  indices: Uint32Array;
}

const FACES: {
  dir: [number, number, number];
  corners: [number, number, number][];
  shade: number;
  colorIndex: 0 | 1 | 2; // top / side / bottom
}[] = [
  {
    // +Y top
    dir: [0, 1, 0],
    corners: [
      [0, 1, 1],
      [1, 1, 1],
      [1, 1, 0],
      [0, 1, 0],
    ],
    shade: 1,
    colorIndex: 0,
  },
  {
    // -Y bottom
    dir: [0, -1, 0],
    corners: [
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, 1],
      [0, 0, 1],
    ],
    shade: 0.55,
    colorIndex: 2,
  },
  {
    // +X
    dir: [1, 0, 0],
    corners: [
      [1, 0, 1],
      [1, 0, 0],
      [1, 1, 0],
      [1, 1, 1],
    ],
    shade: 0.8,
    colorIndex: 1,
  },
  {
    // -X
    dir: [-1, 0, 0],
    corners: [
      [0, 0, 0],
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
    ],
    shade: 0.8,
    colorIndex: 1,
  },
  {
    // +Z
    dir: [0, 0, 1],
    corners: [
      [0, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 1],
    ],
    shade: 0.7,
    colorIndex: 1,
  },
  {
    // -Z
    dir: [0, 0, -1],
    corners: [
      [1, 0, 0],
      [0, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
    shade: 0.7,
    colorIndex: 1,
  },
];

const isOpaque = (id: BlockId): boolean => id !== AIR && id !== WATER;

export const meshChunk = (world: World, cx: number, cy: number, cz: number): ChunkMeshData => {
  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  let vertex = 0;

  const ox = cx * CHUNK_SIZE;
  const oy = cy * CHUNK_SIZE;
  const oz = cz * CHUNK_SIZE;

  for (let ly = 0; ly < CHUNK_SIZE; ly++) {
    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const x = ox + lx;
        const y = oy + ly;
        const z = oz + lz;
        if (!inBounds(x, y, z)) continue;
        const id = world.get(x, y, z);
        if (!isOpaque(id)) continue;
        const def = BLOCKS[id];
        if (!def) continue;

        for (const face of FACES) {
          const nx = x + face.dir[0];
          const ny = y + face.dir[1];
          const nz = z + face.dir[2];
          const neighbor = world.get(nx, ny, nz);
          if (isOpaque(neighbor)) continue;

          const [cr, cg, cb] = def.colors[face.colorIndex]!;
          const r = cr * face.shade;
          const g = cg * face.shade;
          const b = cb * face.shade;

          for (const [cxo, cyo, czo] of face.corners) {
            positions.push(x + cxo, y + cyo, z + czo);
            normals.push(face.dir[0], face.dir[1], face.dir[2]);
            colors.push(r, g, b);
          }
          indices.push(vertex, vertex + 1, vertex + 2, vertex, vertex + 2, vertex + 3);
          vertex += 4;
        }
      }
    }
  }

  // Water faces (simple translucent-looking solid color, drawn opaque for simplicity)
  for (let ly = 0; ly < CHUNK_SIZE; ly++) {
    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const x = ox + lx;
        const y = oy + ly;
        const z = oz + lz;
        if (world.get(x, y, z) !== WATER) continue;
        const def = BLOCKS[WATER]!;
        for (const face of FACES) {
          const neighbor = world.get(x + face.dir[0], y + face.dir[1], z + face.dir[2]);
          if (neighbor === WATER || isOpaque(neighbor)) continue;
          const [cr, cg, cb] = def.colors[0]!;
          const r = cr * face.shade;
          const g = cg * face.shade;
          const b = cb * face.shade;
          for (const [cxo, cyo, czo] of face.corners) {
            positions.push(x + cxo, y + cyo, z + czo);
            normals.push(face.dir[0], face.dir[1], face.dir[2]);
            colors.push(r, g, b);
          }
          indices.push(vertex, vertex + 1, vertex + 2, vertex, vertex + 2, vertex + 3);
          vertex += 4;
        }
      }
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    colors: new Float32Array(colors),
    indices: new Uint32Array(indices),
  };
};

export const forEachChunk = (
  fn: (cx: number, cy: number, cz: number) => void,
): void => {
  for (let cz = 0; cz < WORLD_CHUNKS_Z; cz++) {
    for (let cy = 0; cy < WORLD_CHUNKS_Y; cy++) {
      for (let cx = 0; cx < WORLD_CHUNKS_X; cx++) {
        fn(cx, cy, cz);
      }
    }
  }
};

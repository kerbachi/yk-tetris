import { AIR, BLOCKS, WATER, type BlockId } from './blocks';
import { tileUv } from './textures';
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
  uvs: Float32Array;
  indices: Uint32Array;
}

const FACES: {
  dir: [number, number, number];
  corners: [number, number, number][];
  /** Local UV for each corner: [u, v] in 0–1 tile space */
  uvs: [number, number][];
  shade: number;
  texIndex: 0 | 1 | 2; // top / side / bottom
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
    uvs: [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ],
    shade: 1,
    texIndex: 0,
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
    uvs: [
      [0, 1],
      [1, 1],
      [1, 0],
      [0, 0],
    ],
    shade: 0.55,
    texIndex: 2,
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
    uvs: [
      [0, 1],
      [1, 1],
      [1, 0],
      [0, 0],
    ],
    shade: 0.85,
    texIndex: 1,
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
    uvs: [
      [0, 1],
      [1, 1],
      [1, 0],
      [0, 0],
    ],
    shade: 0.85,
    texIndex: 1,
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
    uvs: [
      [0, 1],
      [1, 1],
      [1, 0],
      [0, 0],
    ],
    shade: 0.75,
    texIndex: 1,
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
    uvs: [
      [0, 1],
      [1, 1],
      [1, 0],
      [0, 0],
    ],
    shade: 0.75,
    texIndex: 1,
  },
];

const isOpaque = (id: BlockId): boolean => id !== AIR && id !== WATER;

const pushFace = (
  positions: number[],
  normals: number[],
  colors: number[],
  uvs: number[],
  indices: number[],
  vertex: number,
  x: number,
  y: number,
  z: number,
  face: (typeof FACES)[number],
  tile: number,
): number => {
  const { u0, v0, u1, v1 } = tileUv(tile);
  const shade = face.shade;
  for (let i = 0; i < 4; i++) {
    const [cxo, cyo, czo] = face.corners[i]!;
    const [lu, lv] = face.uvs[i]!;
    positions.push(x + cxo, y + cyo, z + czo);
    normals.push(face.dir[0], face.dir[1], face.dir[2]);
    // Vertex color multiplies the texture (face shading)
    colors.push(shade, shade, shade);
    const u = lu === 0 ? u0 : u1;
    const v = lv === 0 ? v0 : v1;
    uvs.push(u, v);
  }
  indices.push(vertex, vertex + 1, vertex + 2, vertex, vertex + 2, vertex + 3);
  return vertex + 4;
};

export const meshChunk = (world: World, cx: number, cy: number, cz: number): ChunkMeshData => {
  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
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
          const neighbor = world.get(x + face.dir[0], y + face.dir[1], z + face.dir[2]);
          if (isOpaque(neighbor)) continue;
          const tile = def.textures[face.texIndex]!;
          vertex = pushFace(
            positions,
            normals,
            colors,
            uvs,
            indices,
            vertex,
            x,
            y,
            z,
            face,
            tile,
          );
        }
      }
    }
  }

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
          vertex = pushFace(
            positions,
            normals,
            colors,
            uvs,
            indices,
            vertex,
            x,
            y,
            z,
            face,
            def.textures[0]!,
          );
        }
      }
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    colors: new Float32Array(colors),
    uvs: new Float32Array(uvs),
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

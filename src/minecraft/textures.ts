/**
 * Procedural Minecraft-like 16×16 block textures packed into one atlas.
 * Original pixel art inspired by classic voxel games — not Mojang assets.
 */

export const TILE_SIZE = 16;
export const ATLAS_COLS = 4;
export const ATLAS_ROWS = 4;
export const ATLAS_SIZE = TILE_SIZE * ATLAS_COLS;

/** Atlas tile indices */
export const TEX = {
  GRASS_TOP: 0,
  GRASS_SIDE: 1,
  DIRT: 2,
  STONE: 3,
  WOOD_TOP: 4,
  WOOD_SIDE: 5,
  LEAVES: 6,
  SAND: 7,
  WATER: 8,
  COBBLE: 9,
  PLANKS: 10,
  BEDROCK: 11,
} as const;

export type TexId = (typeof TEX)[keyof typeof TEX];

type RGBA = [number, number, number, number];

const clamp = (v: number, lo = 0, hi = 255): number =>
  Math.max(lo, Math.min(hi, Math.round(v)));

/** Deterministic hash for pixel noise. */
const nhash = (x: number, y: number, salt = 0): number => {
  let n = (x * 374761393 + y * 668265263 + salt * 1274126177) | 0;
  n = (n ^ (n >> 13)) * 1274126177;
  return ((n ^ (n >> 16)) >>> 0) / 4294967296;
};

const setPx = (
  data: Uint8ClampedArray,
  x: number,
  y: number,
  r: number,
  g: number,
  b: number,
  a = 255,
): void => {
  if (x < 0 || y < 0 || x >= TILE_SIZE || y >= TILE_SIZE) return;
  const i = (y * TILE_SIZE + x) * 4;
  data[i] = clamp(r);
  data[i + 1] = clamp(g);
  data[i + 2] = clamp(b);
  data[i + 3] = clamp(a);
};

const fillNoise = (
  data: Uint8ClampedArray,
  base: RGBA,
  variance: number,
  salt: number,
): void => {
  for (let y = 0; y < TILE_SIZE; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      const n = (nhash(x, y, salt) - 0.5) * 2 * variance;
      setPx(data, x, y, base[0] + n, base[1] + n, base[2] + n, base[3]);
    }
  }
};

const paintDirt = (data: Uint8ClampedArray): void => {
  fillNoise(data, [134, 96, 67, 255], 18, 11);
  for (let y = 0; y < TILE_SIZE; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      if (nhash(x, y, 22) > 0.82) {
        setPx(data, x, y, 98, 70, 48);
      } else if (nhash(x, y, 23) > 0.9) {
        setPx(data, x, y, 160, 120, 85);
      }
    }
  }
};

const paintGrassTop = (data: Uint8ClampedArray): void => {
  fillNoise(data, [92, 158, 58, 255], 22, 31);
  for (let y = 0; y < TILE_SIZE; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      const n = nhash(x, y, 37);
      if (n > 0.78) setPx(data, x, y, 70, 130, 42);
      else if (n < 0.18) setPx(data, x, y, 118, 180, 72);
      // Tiny darker tufts
      if (nhash(x, y, 39) > 0.92) setPx(data, x, y, 55, 105, 35);
    }
  }
};

const paintGrassSide = (data: Uint8ClampedArray): void => {
  paintDirt(data);
  // Grass fringe along the top few rows (classic Minecraft look)
  for (let x = 0; x < TILE_SIZE; x++) {
    const fringe = 3 + Math.floor(nhash(x, 0, 51) * 2);
    for (let y = 0; y < fringe; y++) {
      const green = 85 + nhash(x, y, 52) * 45;
      setPx(data, x, y, 70 + nhash(x, y, 53) * 20, green, 40 + nhash(x, y, 54) * 15);
    }
    // Occasional hanging blade
    if (nhash(x, 0, 55) > 0.65) {
      setPx(data, x, fringe, 75, 140, 48);
    }
  }
};

const paintStone = (data: Uint8ClampedArray): void => {
  fillNoise(data, [125, 125, 125, 255], 14, 61);
  for (let y = 0; y < TILE_SIZE; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      const n = nhash(x, y, 62);
      if (n > 0.88) setPx(data, x, y, 95, 95, 95);
      else if (n < 0.12) setPx(data, x, y, 150, 150, 150);
    }
  }
};

const paintCobble = (data: Uint8ClampedArray): void => {
  fillNoise(data, [112, 112, 112, 255], 10, 71);
  // Irregular stone “chunks”
  const blobs: [number, number, number, number][] = [
    [1, 1, 6, 5],
    [8, 0, 7, 6],
    [0, 7, 7, 8],
    [8, 7, 7, 8],
    [4, 4, 5, 5],
  ];
  for (const [bx, by, bw, bh] of blobs) {
    const shade = 90 + nhash(bx, by, 72) * 50;
    for (let y = by; y < by + bh && y < TILE_SIZE; y++) {
      for (let x = bx; x < bx + bw && x < TILE_SIZE; x++) {
        const edge =
          x === bx || y === by || x === bx + bw - 1 || y === by + bh - 1;
        const v = edge ? shade * 0.7 : shade + nhash(x, y, 73) * 20;
        setPx(data, x, y, v, v, v);
      }
    }
  }
  // Dark mortar cracks
  for (let i = 0; i < TILE_SIZE; i++) {
    setPx(data, i, 6, 70, 70, 70);
    setPx(data, 7, i, 70, 70, 70);
  }
};

const paintWoodTop = (data: Uint8ClampedArray): void => {
  const cx = 7.5;
  const cy = 7.5;
  for (let y = 0; y < TILE_SIZE; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      const d = Math.hypot(x - cx, y - cy);
      const ring = Math.floor(d);
      const base = ring % 2 === 0 ? [170, 135, 80] : [145, 110, 60];
      const n = (nhash(x, y, 81) - 0.5) * 16;
      setPx(data, x, y, base[0]! + n, base[1]! + n, base[2]! + n);
    }
  }
  // Dark bark rim
  for (let y = 0; y < TILE_SIZE; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      if (x === 0 || y === 0 || x === TILE_SIZE - 1 || y === TILE_SIZE - 1) {
        setPx(data, x, y, 78, 58, 32);
      }
    }
  }
};

const paintWoodSide = (data: Uint8ClampedArray): void => {
  for (let y = 0; y < TILE_SIZE; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      const band = Math.floor(x / 3);
      const base = band % 2 === 0 ? [102, 78, 46] : [88, 64, 36];
      const n = (nhash(x, y, 91) - 0.5) * 18;
      setPx(data, x, y, base[0]! + n, base[1]! + n, base[2]! + n);
      // Vertical bark grooves
      if (x % 4 === 0) setPx(data, x, y, 70, 50, 28);
      if (nhash(x, y, 92) > 0.93) setPx(data, x, y, 60, 42, 22);
    }
  }
};

const paintLeaves = (data: Uint8ClampedArray): void => {
  for (let y = 0; y < TILE_SIZE; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      const n = nhash(x, y, 101);
      if (n > 0.72) {
        // Transparent-looking holes (darker so foliage feels airy)
        setPx(data, x, y, 28, 55, 22, 255);
      } else if (n > 0.45) {
        setPx(data, x, y, 48, 120, 38);
      } else {
        setPx(data, x, y, 72, 150, 52);
      }
    }
  }
};

const paintSand = (data: Uint8ClampedArray): void => {
  fillNoise(data, [219, 207, 148, 255], 12, 111);
  for (let y = 0; y < TILE_SIZE; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      if (nhash(x, y, 112) > 0.9) setPx(data, x, y, 195, 180, 120);
      if (nhash(x, y, 113) > 0.94) setPx(data, x, y, 235, 225, 175);
    }
  }
};

const paintWater = (data: Uint8ClampedArray): void => {
  for (let y = 0; y < TILE_SIZE; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      const wave = Math.sin((x + y) * 0.7) * 12;
      const n = nhash(x, y, 121) * 18;
      setPx(data, x, y, 45 + n, 105 + wave + n * 0.5, 190 + wave);
    }
  }
};

const paintPlanks = (data: Uint8ClampedArray): void => {
  for (let y = 0; y < TILE_SIZE; y++) {
    const board = Math.floor(y / 4);
    const base =
      board % 2 === 0 ? [188, 152, 98] : [172, 136, 84];
    for (let x = 0; x < TILE_SIZE; x++) {
      const n = (nhash(x, y, 131) - 0.5) * 14;
      setPx(data, x, y, base[0]! + n, base[1]! + n, base[2]! + n);
      // Grain
      if (nhash(x, y, 132) > 0.88) {
        setPx(data, x, y, base[0]! - 25, base[1]! - 25, base[2]! - 20);
      }
    }
    // Board seams
    if (y % 4 === 0) {
      for (let x = 0; x < TILE_SIZE; x++) setPx(data, x, y, 120, 90, 55);
    }
  }
  // Vertical nail-ish marks
  for (const nx of [3, 11]) {
    for (const ny of [2, 6, 10, 14]) {
      setPx(data, nx, ny, 100, 80, 50);
    }
  }
};

const paintBedrock = (data: Uint8ClampedArray): void => {
  fillNoise(data, [45, 45, 45, 255], 20, 141);
  for (let y = 0; y < TILE_SIZE; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      const n = nhash(x, y, 142);
      if (n > 0.85) setPx(data, x, y, 20, 20, 20);
      else if (n < 0.15) setPx(data, x, y, 80, 80, 80);
    }
  }
};

const PAINTERS: Record<number, (data: Uint8ClampedArray) => void> = {
  [TEX.GRASS_TOP]: paintGrassTop,
  [TEX.GRASS_SIDE]: paintGrassSide,
  [TEX.DIRT]: paintDirt,
  [TEX.STONE]: paintStone,
  [TEX.WOOD_TOP]: paintWoodTop,
  [TEX.WOOD_SIDE]: paintWoodSide,
  [TEX.LEAVES]: paintLeaves,
  [TEX.SAND]: paintSand,
  [TEX.WATER]: paintWater,
  [TEX.COBBLE]: paintCobble,
  [TEX.PLANKS]: paintPlanks,
  [TEX.BEDROCK]: paintBedrock,
};

const blitTile = (
  atlas: ImageData,
  tile: number,
  tileData: Uint8ClampedArray,
): void => {
  const col = tile % ATLAS_COLS;
  const row = Math.floor(tile / ATLAS_COLS);
  const ox = col * TILE_SIZE;
  const oy = row * TILE_SIZE;
  for (let y = 0; y < TILE_SIZE; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      const si = (y * TILE_SIZE + x) * 4;
      const di = ((oy + y) * ATLAS_SIZE + (ox + x)) * 4;
      atlas.data[di] = tileData[si]!;
      atlas.data[di + 1] = tileData[si + 1]!;
      atlas.data[di + 2] = tileData[si + 2]!;
      atlas.data[di + 3] = tileData[si + 3]!;
    }
  }
};

let atlasCanvas: HTMLCanvasElement | null = null;

/** Build (and cache) the atlas canvas. */
export const createAtlasCanvas = (): HTMLCanvasElement => {
  if (atlasCanvas) return atlasCanvas;
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_SIZE;
  canvas.height = ATLAS_SIZE;
  const ctx = canvas.getContext('2d')!;
  const atlas = ctx.createImageData(ATLAS_SIZE, ATLAS_SIZE);

  for (const [key, painter] of Object.entries(PAINTERS)) {
    const tile = Number(key);
    const tileData = new Uint8ClampedArray(TILE_SIZE * TILE_SIZE * 4);
    painter(tileData);
    blitTile(atlas, tile, tileData);
  }

  // Fill unused atlas slots so a bad UV never samples transparent black.
  for (let tile = 12; tile < ATLAS_COLS * ATLAS_ROWS; tile++) {
    const tileData = new Uint8ClampedArray(TILE_SIZE * TILE_SIZE * 4);
    paintDirt(tileData);
    blitTile(atlas, tile, tileData);
  }

  ctx.putImageData(atlas, 0, 0);
  ctx.imageSmoothingEnabled = false;
  atlasCanvas = canvas;
  return canvas;
};

/** UV rect for a tile, with half-texel inset to reduce atlas bleeding. */
export const tileUv = (
  tile: number,
): { u0: number; v0: number; u1: number; v1: number } => {
  const col = tile % ATLAS_COLS;
  const row = Math.floor(tile / ATLAS_COLS);
  const inset = 0.5 / ATLAS_SIZE;
  const u0 = col / ATLAS_COLS + inset;
  const v0 = row / ATLAS_ROWS + inset;
  const u1 = (col + 1) / ATLAS_COLS - inset;
  const v1 = (row + 1) / ATLAS_ROWS - inset;
  return { u0, v0, u1, v1 };
};

/** Draw a single tile into a small canvas for HUD icons. */
export const tileIconDataUrl = (
  atlas: HTMLCanvasElement,
  tile: number,
  size = 32,
): string => {
  const col = tile % ATLAS_COLS;
  const row = Math.floor(tile / ATLAS_COLS);
  const out = document.createElement('canvas');
  out.width = size;
  out.height = size;
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    atlas,
    col * TILE_SIZE,
    row * TILE_SIZE,
    TILE_SIZE,
    TILE_SIZE,
    0,
    0,
    size,
    size,
  );
  return out.toDataURL('image/png');
};

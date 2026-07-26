/**
 * Procedural 16×16 Minecraft-like tool icons with outlines & shading.
 * Original pixel art inspired by classic voxel games — not Mojang assets.
 */

import type { ToolDef, ToolKind, ToolTier } from './tools';

const SIZE = 16;

type RGB = [number, number, number];

interface TierPalette {
  mid: RGB;
  hi: RGB;
  lo: RGB;
  outline: RGB;
}

const tierPalettes: Record<ToolTier, TierPalette> = {
  wood: {
    mid: [145, 105, 55],
    hi: [175, 135, 80],
    lo: [100, 70, 35],
    outline: [60, 40, 20],
  },
  stone: {
    mid: [145, 145, 145],
    hi: [185, 185, 185],
    lo: [105, 105, 105],
    outline: [55, 55, 55],
  },
  iron: {
    mid: [210, 210, 215],
    hi: [245, 245, 250],
    lo: [155, 155, 165],
    outline: [70, 70, 80],
  },
  gold: {
    mid: [250, 215, 50],
    hi: [255, 245, 140],
    lo: [195, 150, 25],
    outline: [110, 80, 10],
  },
  diamond: {
    mid: [55, 225, 215],
    hi: [170, 255, 250],
    lo: [25, 155, 160],
    outline: [15, 80, 90],
  },
};

const HANDLE: TierPalette = {
  mid: [120, 80, 40],
  hi: [155, 110, 60],
  lo: [85, 55, 25],
  outline: [50, 30, 12],
};

const setPx = (
  data: Uint8ClampedArray,
  x: number,
  y: number,
  c: RGB,
  a = 255,
): void => {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
  const i = (y * SIZE + x) * 4;
  data[i] = c[0];
  data[i + 1] = c[1];
  data[i + 2] = c[2];
  data[i + 3] = a;
};

/** Draw a thick shaded diagonal stick (handle). */
const paintHandle = (data: Uint8ClampedArray, x0: number, y0: number, x1: number, y1: number): void => {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = Math.round(x0 + (x1 - x0) * t);
    const y = Math.round(y0 + (y1 - y0) * t);
    setPx(data, x, y, HANDLE.mid);
    setPx(data, x + 1, y, HANDLE.hi);
    setPx(data, x, y + 1, HANDLE.lo);
    setPx(data, x - 1, y, HANDLE.outline);
    setPx(data, x, y - 1, HANDLE.outline);
  }
};

const paintPixels = (
  data: Uint8ClampedArray,
  pixels: [number, number, 'm' | 'h' | 'l' | 'o'][],
  pal: TierPalette,
): void => {
  for (const [x, y, k] of pixels) {
    const c = k === 'h' ? pal.hi : k === 'l' ? pal.lo : k === 'o' ? pal.outline : pal.mid;
    setPx(data, x, y, c);
  }
};

const paintPickaxe = (data: Uint8ClampedArray, pal: TierPalette): void => {
  paintHandle(data, 2, 13, 7, 8);
  paintPixels(
    data,
    [
      // Head outline (U shape)
      [5, 5, 'o'],
      [6, 4, 'o'],
      [7, 3, 'o'],
      [8, 2, 'o'],
      [9, 2, 'o'],
      [10, 2, 'o'],
      [11, 3, 'o'],
      [12, 4, 'o'],
      [13, 5, 'o'],
      // Head fill
      [6, 5, 'l'],
      [7, 4, 'm'],
      [8, 3, 'h'],
      [9, 3, 'h'],
      [10, 3, 'm'],
      [11, 4, 'm'],
      [12, 5, 'l'],
      [7, 5, 'm'],
      [8, 4, 'h'],
      [9, 4, 'h'],
      [10, 4, 'm'],
      [11, 5, 'l'],
      [8, 5, 'm'],
      [9, 5, 'm'],
      [10, 5, 'l'],
    ],
    pal,
  );
};

const paintAxe = (data: Uint8ClampedArray, pal: TierPalette): void => {
  paintHandle(data, 2, 13, 7, 8);
  paintPixels(
    data,
    [
      [6, 3, 'o'],
      [7, 2, 'o'],
      [8, 2, 'o'],
      [9, 2, 'o'],
      [10, 2, 'o'],
      [11, 2, 'o'],
      [12, 3, 'o'],
      [12, 4, 'o'],
      [11, 5, 'o'],
      [10, 6, 'o'],
      [9, 6, 'o'],
      [6, 4, 'l'],
      [7, 3, 'm'],
      [8, 3, 'h'],
      [9, 3, 'h'],
      [10, 3, 'm'],
      [11, 3, 'm'],
      [7, 4, 'm'],
      [8, 4, 'h'],
      [9, 4, 'h'],
      [10, 4, 'm'],
      [11, 4, 'l'],
      [8, 5, 'm'],
      [9, 5, 'm'],
      [10, 5, 'l'],
      [9, 6, 'l'],
    ],
    pal,
  );
};

const paintShovel = (data: Uint8ClampedArray, pal: TierPalette): void => {
  paintHandle(data, 3, 14, 8, 8);
  paintPixels(
    data,
    [
      [7, 2, 'o'],
      [8, 2, 'o'],
      [9, 2, 'o'],
      [6, 3, 'o'],
      [10, 3, 'o'],
      [6, 4, 'o'],
      [10, 4, 'o'],
      [7, 5, 'o'],
      [9, 5, 'o'],
      [8, 6, 'o'],
      [7, 3, 'h'],
      [8, 3, 'h'],
      [9, 3, 'm'],
      [7, 4, 'm'],
      [8, 4, 'h'],
      [9, 4, 'm'],
      [8, 5, 'l'],
    ],
    pal,
  );
};

const paintSword = (data: Uint8ClampedArray, pal: TierPalette): void => {
  // Blade
  paintPixels(
    data,
    [
      [13, 1, 'o'],
      [12, 1, 'h'],
      [13, 2, 'h'],
      [11, 2, 'h'],
      [12, 2, 'h'],
      [13, 3, 'm'],
      [10, 3, 'h'],
      [11, 3, 'h'],
      [12, 3, 'm'],
      [9, 4, 'h'],
      [10, 4, 'm'],
      [11, 4, 'm'],
      [8, 5, 'm'],
      [9, 5, 'm'],
      [10, 5, 'l'],
      [7, 6, 'm'],
      [8, 6, 'm'],
      [9, 6, 'l'],
      [6, 7, 'm'],
      [7, 7, 'l'],
      [8, 7, 'l'],
      [5, 8, 'l'],
      [6, 8, 'l'],
      [12, 0, 'o'],
      [14, 1, 'o'],
      [14, 2, 'o'],
      [11, 1, 'o'],
      [10, 2, 'o'],
      [9, 3, 'o'],
      [8, 4, 'o'],
      [7, 5, 'o'],
      [6, 6, 'o'],
      [5, 7, 'o'],
      [4, 8, 'o'],
    ],
    pal,
  );
  // Guard
  paintPixels(
    data,
    [
      [3, 8, 'o'],
      [4, 9, 'o'],
      [5, 9, 'o'],
      [6, 9, 'o'],
      [7, 9, 'o'],
      [8, 9, 'o'],
      [4, 8, 'm'],
      [5, 8, 'h'],
      [6, 8, 'h'],
      [7, 8, 'm'],
    ],
    pal,
  );
  // Handle + pommel
  paintHandle(data, 4, 10, 2, 13);
  setPx(data, 1, 14, pal.mid);
  setPx(data, 2, 14, pal.hi);
  setPx(data, 1, 13, pal.outline);
  setPx(data, 0, 14, pal.outline);
};

const paintHoe = (data: Uint8ClampedArray, pal: TierPalette): void => {
  paintHandle(data, 2, 13, 7, 8);
  paintPixels(
    data,
    [
      [6, 3, 'o'],
      [7, 2, 'o'],
      [8, 2, 'o'],
      [9, 2, 'o'],
      [10, 2, 'o'],
      [11, 2, 'o'],
      [12, 2, 'o'],
      [13, 3, 'o'],
      [6, 4, 'o'],
      [7, 3, 'm'],
      [8, 3, 'h'],
      [9, 3, 'h'],
      [10, 3, 'm'],
      [11, 3, 'm'],
      [12, 3, 'l'],
      [7, 4, 'l'],
      [8, 4, 'm'],
    ],
    pal,
  );
};

const painters: Record<ToolKind, (data: Uint8ClampedArray, pal: TierPalette) => void> = {
  pickaxe: paintPickaxe,
  axe: paintAxe,
  shovel: paintShovel,
  sword: paintSword,
  hoe: paintHoe,
};

const iconCache = new Map<string, string>();

export const toolIconDataUrl = (tool: ToolDef, size = 32): string => {
  const key = `v2:${tool.id}:${size}`;
  const cached = iconCache.get(key);
  if (cached) return cached;

  const data = new Uint8ClampedArray(SIZE * SIZE * 4);
  painters[tool.kind](data, tierPalettes[tool.tier]);

  const src = document.createElement('canvas');
  src.width = SIZE;
  src.height = SIZE;
  const sctx = src.getContext('2d')!;
  sctx.putImageData(new ImageData(data, SIZE, SIZE), 0, 0);

  const out = document.createElement('canvas');
  out.width = size;
  out.height = size;
  const octx = out.getContext('2d')!;
  octx.imageSmoothingEnabled = false;
  octx.drawImage(src, 0, 0, size, size);
  const url = out.toDataURL('image/png');
  iconCache.set(key, url);
  return url;
};

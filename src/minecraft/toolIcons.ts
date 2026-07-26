/**
 * Procedural 16×16 Minecraft-like tool icons (original pixel art).
 */

import type { ToolDef, ToolKind, ToolTier } from './tools';

const SIZE = 16;

const tierColors: Record<ToolTier, [number, number, number]> = {
  wood: [130, 95, 50],
  stone: [130, 130, 130],
  iron: [200, 200, 205],
  gold: [250, 215, 50],
  diamond: [80, 230, 230],
};

const handleColor: [number, number, number] = [110, 75, 40];

const setPx = (
  data: Uint8ClampedArray,
  x: number,
  y: number,
  r: number,
  g: number,
  b: number,
  a = 255,
): void => {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
  const i = (y * SIZE + x) * 4;
  data[i] = r;
  data[i + 1] = g;
  data[i + 2] = b;
  data[i + 3] = a;
};

const line = (
  data: Uint8ClampedArray,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: [number, number, number],
): void => {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x = x0;
  let y = y0;
  for (;;) {
    setPx(data, x, y, color[0], color[1], color[2]);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
};

const paintHandle = (data: Uint8ClampedArray): void => {
  // Diagonal stick from bottom-left toward center
  line(data, 2, 13, 8, 7, handleColor);
  line(data, 3, 13, 8, 8, handleColor);
};

const paintPickaxe = (data: Uint8ClampedArray, head: [number, number, number]): void => {
  paintHandle(data);
  // Curved head
  for (const [x, y] of [
    [6, 5],
    [7, 4],
    [8, 3],
    [9, 3],
    [10, 3],
    [11, 4],
    [12, 5],
    [7, 5],
    [8, 4],
    [9, 4],
    [10, 4],
    [11, 5],
  ] as [number, number][]) {
    setPx(data, x, y, head[0], head[1], head[2]);
  }
};

const paintAxe = (data: Uint8ClampedArray, head: [number, number, number]): void => {
  paintHandle(data);
  for (const [x, y] of [
    [7, 3],
    [8, 3],
    [9, 3],
    [10, 3],
    [11, 3],
    [7, 4],
    [8, 4],
    [9, 4],
    [10, 4],
    [11, 4],
    [8, 5],
    [9, 5],
    [10, 5],
    [9, 6],
  ] as [number, number][]) {
    setPx(data, x, y, head[0], head[1], head[2]);
  }
};

const paintShovel = (data: Uint8ClampedArray, head: [number, number, number]): void => {
  paintHandle(data);
  for (const [x, y] of [
    [8, 2],
    [9, 2],
    [7, 3],
    [8, 3],
    [9, 3],
    [10, 3],
    [7, 4],
    [8, 4],
    [9, 4],
    [10, 4],
    [8, 5],
    [9, 5],
  ] as [number, number][]) {
    setPx(data, x, y, head[0], head[1], head[2]);
  }
};

const paintSword = (data: Uint8ClampedArray, head: [number, number, number]): void => {
  // Blade
  line(data, 12, 1, 5, 8, head);
  line(data, 13, 1, 6, 8, head);
  line(data, 12, 2, 5, 9, head);
  // Guard
  setPx(data, 4, 9, head[0], head[1], head[2]);
  setPx(data, 5, 9, head[0], head[1], head[2]);
  setPx(data, 6, 9, head[0], head[1], head[2]);
  setPx(data, 7, 9, head[0], head[1], head[2]);
  // Handle
  line(data, 4, 10, 2, 13, handleColor);
  line(data, 5, 10, 3, 13, handleColor);
  // Pommel
  setPx(data, 1, 14, head[0], head[1], head[2]);
  setPx(data, 2, 14, head[0], head[1], head[2]);
};

const paintHoe = (data: Uint8ClampedArray, head: [number, number, number]): void => {
  paintHandle(data);
  for (const [x, y] of [
    [7, 3],
    [8, 3],
    [9, 3],
    [10, 3],
    [11, 3],
    [12, 3],
    [7, 4],
    [8, 4],
  ] as [number, number][]) {
    setPx(data, x, y, head[0], head[1], head[2]);
  }
};

const painters: Record<ToolKind, (data: Uint8ClampedArray, head: [number, number, number]) => void> =
  {
    pickaxe: paintPickaxe,
    axe: paintAxe,
    shovel: paintShovel,
    sword: paintSword,
    hoe: paintHoe,
  };

const iconCache = new Map<string, string>();

export const toolIconDataUrl = (tool: ToolDef, size = 32): string => {
  const key = `${tool.id}:${size}`;
  const cached = iconCache.get(key);
  if (cached) return cached;

  const data = new Uint8ClampedArray(SIZE * SIZE * 4);
  painters[tool.kind](data, tierColors[tool.tier]);

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

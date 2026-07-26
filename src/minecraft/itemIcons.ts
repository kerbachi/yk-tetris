/**
 * Inventory / hotbar item icons — isometric cubes for blocks (Minecraft-style).
 */

import { BLOCKS } from './blocks';
import type { HotbarItem } from './items';
import { lootIconDataUrl } from './loot';
import { ATLAS_COLS, TILE_SIZE } from './textures';
import { TOOLS } from './tools';
import { toolIconDataUrl } from './toolIcons';

const iconCache = new Map<string, string>();
const tileCache = new WeakMap<HTMLCanvasElement, Map<number, ImageData>>();

const getTile = (atlas: HTMLCanvasElement, tile: number): ImageData => {
  let map = tileCache.get(atlas);
  if (!map) {
    map = new Map();
    tileCache.set(atlas, map);
  }
  let img = map.get(tile);
  if (!img) {
    const col = tile % ATLAS_COLS;
    const row = Math.floor(tile / ATLAS_COLS);
    img = atlas.getContext('2d')!.getImageData(
      col * TILE_SIZE,
      row * TILE_SIZE,
      TILE_SIZE,
      TILE_SIZE,
    );
    map.set(tile, img);
  }
  return img;
};

const sampleTile = (tileImg: ImageData, u: number, v: number): [number, number, number] => {
  const x = Math.min(TILE_SIZE - 1, Math.max(0, Math.floor(u * (TILE_SIZE - 0.001))));
  const y = Math.min(TILE_SIZE - 1, Math.max(0, Math.floor(v * (TILE_SIZE - 0.001))));
  const i = (y * TILE_SIZE + x) * 4;
  return [tileImg.data[i]!, tileImg.data[i + 1]!, tileImg.data[i + 2]!];
};

const shade = (c: [number, number, number], mul: number): [number, number, number] => [
  Math.min(255, Math.round(c[0] * mul)),
  Math.min(255, Math.round(c[1] * mul)),
  Math.min(255, Math.round(c[2] * mul)),
];

/**
 * Draw a Minecraft-like isometric block icon.
 */
export const isometricBlockIcon = (
  atlas: HTMLCanvasElement,
  topTile: number,
  sideTile: number,
  size = 32,
): string => {
  const key = `iso:v3:${topTile}:${sideTile}:${size}`;
  const cached = iconCache.get(key);
  if (cached) return cached;

  const logical = 16;
  const topImg = getTile(atlas, topTile);
  const sideImg = getTile(atlas, sideTile);

  const out = document.createElement('canvas');
  out.width = size;
  out.height = size;
  const ctx = out.getContext('2d')!;
  const img = ctx.createImageData(logical, logical);
  const data = img.data;

  const put = (x: number, y: number, r: number, g: number, b: number): void => {
    if (x < 0 || y < 0 || x >= logical || y >= logical) return;
    const i = (y * logical + x) * 4;
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = 255;
  };

  const topY = 2;
  const midY = 8;
  const botY = 14;
  const cx = 7.5;

  // Top face
  for (let y = topY; y <= midY; y++) {
    const t = (y - topY) / (midY - topY);
    const half = t <= 0.5 ? t * 2 * 6.2 : (1 - t) * 2 * 6.2;
    for (let dx = -half; dx <= half; dx++) {
      const x = Math.round(cx + dx);
      const u = (dx + 6.2) / 12.4;
      const [r, g, b] = sampleTile(topImg, u, t);
      put(x, y, r, g, b);
    }
  }

  // Left side (shadowed)
  for (let y = midY; y <= botY; y++) {
    const t = (y - midY) / (botY - midY);
    const x0 = Math.round(cx - 6.2);
    const x1 = Math.round(cx);
    for (let x = x0; x <= x1; x++) {
      const u = (x - x0) / Math.max(1, x1 - x0);
      const [r, g, b] = shade(sampleTile(sideImg, u, t), 0.7);
      put(x, y, r, g, b);
    }
  }

  // Right side
  for (let y = midY; y <= botY; y++) {
    const t = (y - midY) / (botY - midY);
    const x0 = Math.round(cx);
    const x1 = Math.round(cx + 6.2);
    for (let x = x0; x <= x1; x++) {
      const u = (x - x0) / Math.max(1, x1 - x0);
      const [r, g, b] = shade(sampleTile(sideImg, u, t), 0.9);
      put(x, y, r, g, b);
    }
  }

  // Edge darkening where adjacent to empty pixels
  for (let y = 0; y < logical; y++) {
    for (let x = 0; x < logical; x++) {
      const i = (y * logical + x) * 4;
      if (data[i + 3] === 0) continue;
      let edge = false;
      for (const [ox, oy] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ] as [number, number][]) {
        const nx = x + ox;
        const ny = y + oy;
        if (nx < 0 || ny < 0 || nx >= logical || ny >= logical) {
          edge = true;
          break;
        }
        if (data[(ny * logical + nx) * 4 + 3]! === 0) {
          edge = true;
          break;
        }
      }
      if (edge) {
        data[i] = Math.max(0, data[i]! - 40);
        data[i + 1] = Math.max(0, data[i + 1]! - 40);
        data[i + 2] = Math.max(0, data[i + 2]! - 40);
      }
    }
  }

  const tmp = document.createElement('canvas');
  tmp.width = logical;
  tmp.height = logical;
  tmp.getContext('2d')!.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(tmp, 0, 0, size, size);

  const url = out.toDataURL('image/png');
  iconCache.set(key, url);
  return url;
};

/** Unified icon for hotbar / inventory / held item. */
export const itemIconDataUrl = (
  atlas: HTMLCanvasElement,
  item: HotbarItem,
  size = 32,
): string => {
  if (item.kind === 'tool') return toolIconDataUrl(TOOLS[item.id]!, size);
  if (item.kind === 'loot') return lootIconDataUrl(item.id, size);
  const def = BLOCKS[item.id]!;
  return isometricBlockIcon(atlas, def.textures[0]!, def.textures[1]!, size);
};

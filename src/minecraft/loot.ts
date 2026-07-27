/** Non-block inventory loot (food, drops from mobs). */

export type LootId =
  | 'porkchop'
  | 'beef'
  | 'chicken'
  | 'mutton'
  | 'leather'
  | 'feather'
  | 'wool';

export interface LootDef {
  id: LootId;
  name: string;
  /** Base RGB for procedural icon */
  color: [number, number, number];
}

export const LOOT: Record<LootId, LootDef> = {
  porkchop: { id: 'porkchop', name: 'Raw Porkchop', color: [220, 140, 140] },
  beef: { id: 'beef', name: 'Raw Beef', color: [170, 55, 45] },
  chicken: { id: 'chicken', name: 'Raw Chicken', color: [230, 200, 180] },
  mutton: { id: 'mutton', name: 'Raw Mutton', color: [180, 90, 90] },
  leather: { id: 'leather', name: 'Leather', color: [150, 90, 50] },
  feather: { id: 'feather', name: 'Feather', color: [240, 240, 245] },
  wool: { id: 'wool', name: 'White Wool', color: [235, 235, 235] },
};

export const ALL_LOOT: LootDef[] = Object.values(LOOT);

export const lootName = (id: LootId): string => LOOT[id]?.name ?? 'Item';

const SIZE = 16;
const iconCache = new Map<string, string>();

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

const paintMeat = (data: Uint8ClampedArray, c: [number, number, number]): void => {
  // Irregular steak / chop silhouette
  for (let y = 3; y < 13; y++) {
    for (let x = 3; x < 13; x++) {
      const dx = (x - 7.5) / 5;
      const dy = (y - 7.5) / 4.5;
      if (dx * dx + dy * dy > 1) continue;
      const n = ((x * 13 + y * 7) % 5) - 2;
      setPx(data, x, y, c[0] + n * 8, c[1] + n * 4, c[2] + n * 4);
    }
  }
  // Fat edge
  for (let x = 4; x < 12; x++) setPx(data, x, 4, 235, 220, 200);
  // Outline
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = (y * SIZE + x) * 4;
      if (data[i + 3] === 0) continue;
      for (const [ox, oy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as [number, number][]) {
        const nx = x + ox;
        const ny = y + oy;
        if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE || data[(ny * SIZE + nx) * 4 + 3]! === 0) {
          setPx(data, x, y, c[0] * 0.55, c[1] * 0.55, c[2] * 0.55);
          break;
        }
      }
    }
  }
};

const paintLeather = (data: Uint8ClampedArray): void => {
  for (let y = 2; y < 14; y++) {
    for (let x = 2; x < 14; x++) {
      const n = ((x + y) % 3) * 10;
      setPx(data, x, y, 150 + n, 95 + n * 0.5, 55);
    }
  }
};

const paintFeather = (data: Uint8ClampedArray): void => {
  for (let i = 0; i < 11; i++) {
    setPx(data, 8, 2 + i, 245, 245, 250);
    setPx(data, 7, 3 + i, 230, 230, 240);
    if (i > 2 && i < 9) {
      setPx(data, 6, 2 + i, 250, 250, 255);
      setPx(data, 9, 3 + i, 220, 220, 230);
    }
  }
  setPx(data, 8, 13, 200, 180, 100);
};

const paintWool = (data: Uint8ClampedArray): void => {
  for (let y = 1; y < 15; y++) {
    for (let x = 1; x < 15; x++) {
      const n = ((x * 3 + y * 5) % 4) * 6;
      setPx(data, x, y, 235 - n, 235 - n, 240 - n);
    }
  }
};

export const lootIconDataUrl = (id: LootId, size = 32): string => {
  const key = `${id}:${size}`;
  const cached = iconCache.get(key);
  if (cached) return cached;

  const def = LOOT[id]!;
  const data = new Uint8ClampedArray(SIZE * SIZE * 4);
  if (id === 'leather') paintLeather(data);
  else if (id === 'feather') paintFeather(data);
  else if (id === 'wool') paintWool(data);
  else paintMeat(data, def.color);

  const src = document.createElement('canvas');
  src.width = SIZE;
  src.height = SIZE;
  src.getContext('2d')!.putImageData(new ImageData(data, SIZE, SIZE), 0, 0);
  const out = document.createElement('canvas');
  out.width = size;
  out.height = size;
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0, size, size);
  const url = out.toDataURL('image/png');
  iconCache.set(key, url);
  return url;
};

import { TEX, type TexId } from './textures';

export const AIR = 0;
export const GRASS = 1;
export const DIRT = 2;
export const STONE = 3;
export const WOOD = 4;
export const LEAVES = 5;
export const SAND = 6;
export const WATER = 7;
export const COBBLE = 8;
export const PLANKS = 9;
export const BEDROCK = 10;

export type BlockId = number;

export interface BlockDef {
  id: BlockId;
  name: string;
  /** Fallback RGB 0–1 for tests / non-DOM: top, side, bottom */
  colors: [number, number, number][];
  /** Atlas tile ids: top, side, bottom */
  textures: [TexId, TexId, TexId];
  solid: boolean;
  breakable: boolean;
  placeable: boolean;
}

const rgb = (r: number, g: number, b: number): [number, number, number] => [
  r / 255,
  g / 255,
  b / 255,
];

const solid = (
  id: BlockId,
  name: string,
  top: [number, number, number],
  side: [number, number, number],
  bottom: [number, number, number],
  textures: [TexId, TexId, TexId],
  opts: Partial<Pick<BlockDef, 'breakable' | 'placeable'>> = {},
): BlockDef => ({
  id,
  name,
  colors: [top, side, bottom],
  textures,
  solid: true,
  breakable: opts.breakable ?? true,
  placeable: opts.placeable ?? true,
});

export const BLOCKS: Record<number, BlockDef> = {
  [AIR]: {
    id: AIR,
    name: 'Air',
    colors: [rgb(0, 0, 0), rgb(0, 0, 0), rgb(0, 0, 0)],
    textures: [TEX.DIRT, TEX.DIRT, TEX.DIRT],
    solid: false,
    breakable: false,
    placeable: false,
  },
  [GRASS]: solid(
    GRASS,
    'Grass',
    rgb(92, 158, 58),
    rgb(121, 85, 58),
    rgb(134, 96, 67),
    [TEX.GRASS_TOP, TEX.GRASS_SIDE, TEX.DIRT],
  ),
  [DIRT]: solid(
    DIRT,
    'Dirt',
    rgb(134, 96, 67),
    rgb(134, 96, 67),
    rgb(134, 96, 67),
    [TEX.DIRT, TEX.DIRT, TEX.DIRT],
  ),
  [STONE]: solid(
    STONE,
    'Stone',
    rgb(125, 125, 125),
    rgb(125, 125, 125),
    rgb(125, 125, 125),
    [TEX.STONE, TEX.STONE, TEX.STONE],
  ),
  [WOOD]: solid(
    WOOD,
    'Wood',
    rgb(170, 135, 80),
    rgb(102, 78, 46),
    rgb(170, 135, 80),
    [TEX.WOOD_TOP, TEX.WOOD_SIDE, TEX.WOOD_TOP],
  ),
  [LEAVES]: solid(
    LEAVES,
    'Leaves',
    rgb(60, 128, 48),
    rgb(50, 110, 40),
    rgb(50, 110, 40),
    [TEX.LEAVES, TEX.LEAVES, TEX.LEAVES],
  ),
  [SAND]: solid(
    SAND,
    'Sand',
    rgb(219, 207, 148),
    rgb(219, 207, 148),
    rgb(219, 207, 148),
    [TEX.SAND, TEX.SAND, TEX.SAND],
  ),
  [WATER]: {
    id: WATER,
    name: 'Water',
    colors: [rgb(45, 105, 190), rgb(45, 105, 190), rgb(45, 105, 190)],
    textures: [TEX.WATER, TEX.WATER, TEX.WATER],
    solid: false,
    breakable: false,
    placeable: false,
  },
  [COBBLE]: solid(
    COBBLE,
    'Cobble',
    rgb(112, 112, 112),
    rgb(112, 112, 112),
    rgb(112, 112, 112),
    [TEX.COBBLE, TEX.COBBLE, TEX.COBBLE],
  ),
  [PLANKS]: solid(
    PLANKS,
    'Planks',
    rgb(188, 152, 98),
    rgb(188, 152, 98),
    rgb(188, 152, 98),
    [TEX.PLANKS, TEX.PLANKS, TEX.PLANKS],
  ),
  [BEDROCK]: solid(
    BEDROCK,
    'Bedrock',
    rgb(45, 45, 45),
    rgb(45, 45, 45),
    rgb(45, 45, 45),
    [TEX.BEDROCK, TEX.BEDROCK, TEX.BEDROCK],
    { breakable: false, placeable: false },
  ),
};

/** Hotbar slots the player can select (1–8). */
export const HOTBAR: BlockId[] = [
  GRASS,
  DIRT,
  STONE,
  COBBLE,
  WOOD,
  PLANKS,
  SAND,
  LEAVES,
];

export const isSolid = (id: BlockId): boolean => BLOCKS[id]?.solid ?? false;
export const isBreakable = (id: BlockId): boolean => BLOCKS[id]?.breakable ?? false;
export const blockName = (id: BlockId): string => BLOCKS[id]?.name ?? 'Unknown';

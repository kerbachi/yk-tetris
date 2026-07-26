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
// Ores
export const COAL_ORE = 11;
export const IRON_ORE = 12;
export const COPPER_ORE = 13;
export const GOLD_ORE = 14;
export const REDSTONE_ORE = 15;
export const LAPIS_ORE = 16;
export const DIAMOND_ORE = 17;
export const EMERALD_ORE = 18;
// Mineral / storage blocks
export const COAL_BLOCK = 19;
export const IRON_BLOCK = 20;
export const COPPER_BLOCK = 21;
export const GOLD_BLOCK = 22;
export const REDSTONE_BLOCK = 23;
export const LAPIS_BLOCK = 24;
export const DIAMOND_BLOCK = 25;
export const EMERALD_BLOCK = 26;
export const QUARTZ_BLOCK = 27;
export const AMETHYST_BLOCK = 28;

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
  color: [number, number, number],
  tex: TexId,
  opts: Partial<Pick<BlockDef, 'breakable' | 'placeable'>> = {},
): BlockDef => ({
  id,
  name,
  colors: [color, color, color],
  textures: [tex, tex, tex],
  solid: true,
  breakable: opts.breakable ?? true,
  placeable: opts.placeable ?? true,
});

const solidFaces = (
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
  [GRASS]: solidFaces(
    GRASS,
    'Grass',
    rgb(92, 158, 58),
    rgb(121, 85, 58),
    rgb(134, 96, 67),
    [TEX.GRASS_TOP, TEX.GRASS_SIDE, TEX.DIRT],
  ),
  [DIRT]: solid(DIRT, 'Dirt', rgb(134, 96, 67), TEX.DIRT),
  [STONE]: solid(STONE, 'Stone', rgb(125, 125, 125), TEX.STONE),
  [WOOD]: solidFaces(
    WOOD,
    'Wood',
    rgb(170, 135, 80),
    rgb(102, 78, 46),
    rgb(170, 135, 80),
    [TEX.WOOD_TOP, TEX.WOOD_SIDE, TEX.WOOD_TOP],
  ),
  [LEAVES]: solid(LEAVES, 'Leaves', rgb(60, 128, 48), TEX.LEAVES),
  [SAND]: solid(SAND, 'Sand', rgb(219, 207, 148), TEX.SAND),
  [WATER]: {
    id: WATER,
    name: 'Water',
    colors: [rgb(45, 105, 190), rgb(45, 105, 190), rgb(45, 105, 190)],
    textures: [TEX.WATER, TEX.WATER, TEX.WATER],
    solid: false,
    breakable: false,
    placeable: false,
  },
  [COBBLE]: solid(COBBLE, 'Cobble', rgb(112, 112, 112), TEX.COBBLE),
  [PLANKS]: solid(PLANKS, 'Planks', rgb(188, 152, 98), TEX.PLANKS),
  [BEDROCK]: solid(BEDROCK, 'Bedrock', rgb(45, 45, 45), TEX.BEDROCK, {
    breakable: false,
    placeable: false,
  }),
  [COAL_ORE]: solid(COAL_ORE, 'Coal Ore', rgb(80, 80, 80), TEX.COAL_ORE),
  [IRON_ORE]: solid(IRON_ORE, 'Iron Ore', rgb(180, 155, 130), TEX.IRON_ORE),
  [COPPER_ORE]: solid(COPPER_ORE, 'Copper Ore', rgb(170, 110, 85), TEX.COPPER_ORE),
  [GOLD_ORE]: solid(GOLD_ORE, 'Gold Ore', rgb(210, 180, 70), TEX.GOLD_ORE),
  [REDSTONE_ORE]: solid(REDSTONE_ORE, 'Redstone Ore', rgb(160, 60, 60), TEX.REDSTONE_ORE),
  [LAPIS_ORE]: solid(LAPIS_ORE, 'Lapis Ore', rgb(70, 90, 170), TEX.LAPIS_ORE),
  [DIAMOND_ORE]: solid(DIAMOND_ORE, 'Diamond Ore', rgb(100, 190, 190), TEX.DIAMOND_ORE),
  [EMERALD_ORE]: solid(EMERALD_ORE, 'Emerald Ore', rgb(70, 170, 100), TEX.EMERALD_ORE),
  [COAL_BLOCK]: solid(COAL_BLOCK, 'Coal Block', rgb(30, 30, 30), TEX.COAL_BLOCK),
  [IRON_BLOCK]: solid(IRON_BLOCK, 'Iron Block', rgb(210, 210, 210), TEX.IRON_BLOCK),
  [COPPER_BLOCK]: solid(COPPER_BLOCK, 'Copper Block', rgb(190, 110, 80), TEX.COPPER_BLOCK),
  [GOLD_BLOCK]: solid(GOLD_BLOCK, 'Gold Block', rgb(250, 210, 50), TEX.GOLD_BLOCK),
  [REDSTONE_BLOCK]: solid(
    REDSTONE_BLOCK,
    'Redstone Block',
    rgb(170, 25, 25),
    TEX.REDSTONE_BLOCK,
  ),
  [LAPIS_BLOCK]: solid(LAPIS_BLOCK, 'Lapis Block', rgb(35, 65, 190), TEX.LAPIS_BLOCK),
  [DIAMOND_BLOCK]: solid(
    DIAMOND_BLOCK,
    'Diamond Block',
    rgb(80, 220, 220),
    TEX.DIAMOND_BLOCK,
  ),
  [EMERALD_BLOCK]: solid(
    EMERALD_BLOCK,
    'Emerald Block',
    rgb(40, 200, 90),
    TEX.EMERALD_BLOCK,
  ),
  [QUARTZ_BLOCK]: solid(QUARTZ_BLOCK, 'Quartz Block', rgb(230, 225, 215), TEX.QUARTZ_BLOCK),
  [AMETHYST_BLOCK]: solid(
    AMETHYST_BLOCK,
    'Amethyst Block',
    rgb(140, 90, 200),
    TEX.AMETHYST_BLOCK,
  ),
};

/** Creative hotbar — scroll with the mouse wheel; keys 1–9 pick the first nine. */
export const HOTBAR: BlockId[] = [
  GRASS,
  DIRT,
  STONE,
  COBBLE,
  WOOD,
  PLANKS,
  SAND,
  LEAVES,
  COAL_ORE,
  IRON_ORE,
  COPPER_ORE,
  GOLD_ORE,
  REDSTONE_ORE,
  LAPIS_ORE,
  DIAMOND_ORE,
  EMERALD_ORE,
  COAL_BLOCK,
  IRON_BLOCK,
  COPPER_BLOCK,
  GOLD_BLOCK,
  REDSTONE_BLOCK,
  LAPIS_BLOCK,
  DIAMOND_BLOCK,
  EMERALD_BLOCK,
  QUARTZ_BLOCK,
  AMETHYST_BLOCK,
];

export const HOTBAR_VISIBLE = 9;

export const isSolid = (id: BlockId): boolean => BLOCKS[id]?.solid ?? false;
export const isBreakable = (id: BlockId): boolean => BLOCKS[id]?.breakable ?? false;
export const blockName = (id: BlockId): string => BLOCKS[id]?.name ?? 'Unknown';

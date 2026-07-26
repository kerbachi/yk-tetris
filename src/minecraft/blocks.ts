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
  /** RGB 0–1 face colors: top, side, bottom */
  colors: [number, number, number][];
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
  opts: Partial<Pick<BlockDef, 'breakable' | 'placeable'>> = {},
): BlockDef => ({
  id,
  name,
  colors: [top, side, bottom],
  solid: true,
  breakable: opts.breakable ?? true,
  placeable: opts.placeable ?? true,
});

export const BLOCKS: Record<number, BlockDef> = {
  [AIR]: {
    id: AIR,
    name: 'Air',
    colors: [rgb(0, 0, 0), rgb(0, 0, 0), rgb(0, 0, 0)],
    solid: false,
    breakable: false,
    placeable: false,
  },
  [GRASS]: solid(GRASS, 'Grass', rgb(106, 170, 58), rgb(121, 85, 58), rgb(121, 85, 58)),
  [DIRT]: solid(DIRT, 'Dirt', rgb(121, 85, 58), rgb(121, 85, 58), rgb(121, 85, 58)),
  [STONE]: solid(STONE, 'Stone', rgb(125, 125, 125), rgb(125, 125, 125), rgb(125, 125, 125)),
  [WOOD]: solid(WOOD, 'Wood', rgb(109, 86, 51), rgb(91, 70, 42), rgb(109, 86, 51)),
  [LEAVES]: solid(LEAVES, 'Leaves', rgb(60, 128, 48), rgb(50, 110, 40), rgb(50, 110, 40)),
  [SAND]: solid(SAND, 'Sand', rgb(219, 207, 143), rgb(219, 207, 143), rgb(219, 207, 143)),
  [WATER]: {
    id: WATER,
    name: 'Water',
    colors: [rgb(64, 120, 200), rgb(64, 120, 200), rgb(64, 120, 200)],
    solid: false,
    breakable: false,
    placeable: false,
  },
  [COBBLE]: solid(COBBLE, 'Cobble', rgb(110, 110, 110), rgb(110, 110, 110), rgb(110, 110, 110)),
  [PLANKS]: solid(PLANKS, 'Planks', rgb(178, 142, 86), rgb(178, 142, 86), rgb(178, 142, 86)),
  [BEDROCK]: solid(
    BEDROCK,
    'Bedrock',
    rgb(40, 40, 40),
    rgb(40, 40, 40),
    rgb(40, 40, 40),
    { breakable: false, placeable: false },
  ),
};

/** Hotbar slots the player can select (1–9). */
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

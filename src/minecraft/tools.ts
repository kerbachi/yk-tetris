import {
  AMETHYST_BLOCK,
  COAL_BLOCK,
  COAL_ORE,
  COBBLE,
  COPPER_BLOCK,
  COPPER_ORE,
  DIAMOND_BLOCK,
  DIAMOND_ORE,
  DIRT,
  EMERALD_BLOCK,
  EMERALD_ORE,
  GOLD_BLOCK,
  GOLD_ORE,
  GRASS,
  IRON_BLOCK,
  IRON_ORE,
  LAPIS_BLOCK,
  LAPIS_ORE,
  LEAVES,
  PLANKS,
  QUARTZ_BLOCK,
  REDSTONE_BLOCK,
  REDSTONE_ORE,
  SAND,
  STONE,
  WOOD,
  type BlockId,
} from './blocks';

export type ToolKind = 'pickaxe' | 'axe' | 'shovel' | 'sword' | 'hoe';
export type ToolTier = 'wood' | 'stone' | 'iron' | 'gold' | 'diamond';

export type ToolId =
  | 'wood_pickaxe'
  | 'stone_pickaxe'
  | 'iron_pickaxe'
  | 'gold_pickaxe'
  | 'diamond_pickaxe'
  | 'wood_axe'
  | 'stone_axe'
  | 'iron_axe'
  | 'gold_axe'
  | 'diamond_axe'
  | 'wood_shovel'
  | 'stone_shovel'
  | 'iron_shovel'
  | 'gold_shovel'
  | 'diamond_shovel'
  | 'wood_sword'
  | 'stone_sword'
  | 'iron_sword'
  | 'gold_sword'
  | 'diamond_sword'
  | 'wood_hoe'
  | 'stone_hoe'
  | 'iron_hoe'
  | 'gold_hoe'
  | 'diamond_hoe';

export type BlockMaterial = 'none' | 'wood' | 'dirt' | 'stone' | 'plant';

export interface ToolDef {
  id: ToolId;
  name: string;
  kind: ToolKind;
  tier: ToolTier;
  /** Mining multiplier when the tool matches the block material. */
  speed: number;
  /** 0 wood/gold, 1 stone, 2 iron, 3 diamond — gates harder ores. */
  harvestLevel: number;
}

const tierStats: Record<ToolTier, { speed: number; harvestLevel: number; label: string }> = {
  wood: { speed: 2, harvestLevel: 0, label: 'Wooden' },
  stone: { speed: 4, harvestLevel: 1, label: 'Stone' },
  iron: { speed: 6, harvestLevel: 2, label: 'Iron' },
  gold: { speed: 12, harvestLevel: 0, label: 'Golden' },
  diamond: { speed: 8, harvestLevel: 3, label: 'Diamond' },
};

const kindLabel: Record<ToolKind, string> = {
  pickaxe: 'Pickaxe',
  axe: 'Axe',
  shovel: 'Shovel',
  sword: 'Sword',
  hoe: 'Hoe',
};

const makeTool = (tier: ToolTier, kind: ToolKind): ToolDef => {
  const stats = tierStats[tier];
  const id = `${tier}_${kind}` as ToolId;
  return {
    id,
    name: `${stats.label} ${kindLabel[kind]}`,
    kind,
    tier,
    speed: kind === 'sword' ? stats.speed * 0.7 : stats.speed,
    harvestLevel: stats.harvestLevel,
  };
};

const TIERS: ToolTier[] = ['wood', 'stone', 'iron', 'gold', 'diamond'];
const KINDS: ToolKind[] = ['pickaxe', 'axe', 'shovel', 'sword', 'hoe'];

export const TOOLS: Record<ToolId, ToolDef> = {} as Record<ToolId, ToolDef>;
export const ALL_TOOLS: ToolDef[] = [];

for (const tier of TIERS) {
  for (const kind of KINDS) {
    const tool = makeTool(tier, kind);
    TOOLS[tool.id] = tool;
    ALL_TOOLS.push(tool);
  }
}

/** Preferred tool kind + hardness + required harvest level for each block. */
const BLOCK_MINING: Partial<
  Record<BlockId, { material: BlockMaterial; hardness: number; level: number }>
> = {
  [GRASS]: { material: 'dirt', hardness: 0.6, level: 0 },
  [DIRT]: { material: 'dirt', hardness: 0.5, level: 0 },
  [SAND]: { material: 'dirt', hardness: 0.5, level: 0 },
  [WOOD]: { material: 'wood', hardness: 2, level: 0 },
  [PLANKS]: { material: 'wood', hardness: 2, level: 0 },
  [LEAVES]: { material: 'plant', hardness: 0.2, level: 0 },
  [STONE]: { material: 'stone', hardness: 1.5, level: 0 },
  [COBBLE]: { material: 'stone', hardness: 2, level: 0 },
  [COAL_ORE]: { material: 'stone', hardness: 3, level: 0 },
  [COPPER_ORE]: { material: 'stone', hardness: 3, level: 1 },
  [IRON_ORE]: { material: 'stone', hardness: 3, level: 1 },
  [GOLD_ORE]: { material: 'stone', hardness: 3, level: 2 },
  [REDSTONE_ORE]: { material: 'stone', hardness: 3, level: 2 },
  [LAPIS_ORE]: { material: 'stone', hardness: 3, level: 1 },
  [DIAMOND_ORE]: { material: 'stone', hardness: 3, level: 2 },
  [EMERALD_ORE]: { material: 'stone', hardness: 3, level: 2 },
  [COAL_BLOCK]: { material: 'stone', hardness: 5, level: 0 },
  [IRON_BLOCK]: { material: 'stone', hardness: 5, level: 1 },
  [COPPER_BLOCK]: { material: 'stone', hardness: 3, level: 1 },
  [GOLD_BLOCK]: { material: 'stone', hardness: 3, level: 2 },
  [REDSTONE_BLOCK]: { material: 'stone', hardness: 5, level: 0 },
  [LAPIS_BLOCK]: { material: 'stone', hardness: 3, level: 1 },
  [DIAMOND_BLOCK]: { material: 'stone', hardness: 5, level: 2 },
  [EMERALD_BLOCK]: { material: 'stone', hardness: 5, level: 2 },
  [QUARTZ_BLOCK]: { material: 'stone', hardness: 0.8, level: 0 },
  [AMETHYST_BLOCK]: { material: 'stone', hardness: 1.5, level: 0 },
};

const toolMaterial: Record<ToolKind, BlockMaterial | 'any'> = {
  pickaxe: 'stone',
  axe: 'wood',
  shovel: 'dirt',
  sword: 'plant',
  hoe: 'dirt',
};

export const miningInfo = (
  block: BlockId,
): { material: BlockMaterial; hardness: number; level: number } =>
  BLOCK_MINING[block] ?? { material: 'none', hardness: 1, level: 0 };

/** Seconds to break a block with the given tool (or bare hand). */
export const mineDuration = (block: BlockId, tool: ToolDef | null): number => {
  const info = miningInfo(block);
  let speed = 1;
  if (tool) {
    const match =
      toolMaterial[tool.kind] === info.material ||
      (tool.kind === 'sword' && info.material === 'plant');
    if (match) speed = tool.speed;
    else speed = 1.2; // slight bump vs bare hand when holding any tool
  }

  // Soft-gate hard ores: wrong harvest level mines much slower
  if (info.material === 'stone' && info.level > 0) {
    const level = tool?.kind === 'pickaxe' ? tool.harvestLevel : -1;
    if (level < info.level) speed *= 0.15;
  }

  const seconds = info.hardness * 1.5 / speed;
  return Math.max(0.05, seconds);
};

export const isCorrectTool = (block: BlockId, tool: ToolDef | null): boolean => {
  if (!tool) return false;
  const info = miningInfo(block);
  return toolMaterial[tool.kind] === info.material;
};

export const toolName = (id: ToolId): string => TOOLS[id]?.name ?? 'Tool';

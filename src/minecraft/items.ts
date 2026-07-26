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
  blockName,
  type BlockId,
} from './blocks';
import { ALL_TOOLS, TOOLS, toolName, type ToolId } from './tools';

export type HotbarItem =
  | { kind: 'block'; id: BlockId }
  | { kind: 'tool'; id: ToolId };

const blockItem = (id: BlockId): HotbarItem => ({ kind: 'block', id });
const toolItem = (id: ToolId): HotbarItem => ({ kind: 'tool', id });

/** Creative hotbar — tools first, then building blocks / ores. */
export const HOTBAR: HotbarItem[] = [
  // Diamond set up front for convenience
  toolItem('diamond_pickaxe'),
  toolItem('diamond_axe'),
  toolItem('diamond_shovel'),
  toolItem('diamond_sword'),
  toolItem('iron_pickaxe'),
  toolItem('iron_axe'),
  toolItem('iron_shovel'),
  toolItem('iron_sword'),
  toolItem('stone_pickaxe'),
  toolItem('stone_axe'),
  toolItem('stone_shovel'),
  toolItem('wood_pickaxe'),
  toolItem('wood_axe'),
  toolItem('wood_shovel'),
  toolItem('wood_sword'),
  toolItem('gold_pickaxe'),
  toolItem('gold_axe'),
  toolItem('diamond_hoe'),
  toolItem('iron_hoe'),
  // Rest of the tool sets
  ...ALL_TOOLS.filter(
    (t) =>
      ![
        'diamond_pickaxe',
        'diamond_axe',
        'diamond_shovel',
        'diamond_sword',
        'diamond_hoe',
        'iron_pickaxe',
        'iron_axe',
        'iron_shovel',
        'iron_sword',
        'iron_hoe',
        'stone_pickaxe',
        'stone_axe',
        'stone_shovel',
        'wood_pickaxe',
        'wood_axe',
        'wood_shovel',
        'wood_sword',
        'gold_pickaxe',
        'gold_axe',
      ].includes(t.id),
  ).map((t) => toolItem(t.id)),
  // Blocks
  blockItem(GRASS),
  blockItem(DIRT),
  blockItem(STONE),
  blockItem(COBBLE),
  blockItem(WOOD),
  blockItem(PLANKS),
  blockItem(SAND),
  blockItem(LEAVES),
  blockItem(COAL_ORE),
  blockItem(IRON_ORE),
  blockItem(COPPER_ORE),
  blockItem(GOLD_ORE),
  blockItem(REDSTONE_ORE),
  blockItem(LAPIS_ORE),
  blockItem(DIAMOND_ORE),
  blockItem(EMERALD_ORE),
  blockItem(COAL_BLOCK),
  blockItem(IRON_BLOCK),
  blockItem(COPPER_BLOCK),
  blockItem(GOLD_BLOCK),
  blockItem(REDSTONE_BLOCK),
  blockItem(LAPIS_BLOCK),
  blockItem(DIAMOND_BLOCK),
  blockItem(EMERALD_BLOCK),
  blockItem(QUARTZ_BLOCK),
  blockItem(AMETHYST_BLOCK),
];

export const HOTBAR_VISIBLE = 9;

export const itemName = (item: HotbarItem): string => {
  if (item.kind === 'tool') return toolName(item.id);
  return blockName(item.id);
};

export const getTool = (item: HotbarItem | undefined) => {
  if (!item || item.kind !== 'tool') return null;
  return TOOLS[item.id] ?? null;
};

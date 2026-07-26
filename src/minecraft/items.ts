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
import { ALL_LOOT, lootName, type LootId } from './loot';
import { ALL_TOOLS, TOOLS, toolName, type ToolId } from './tools';

export type HotbarItem =
  | { kind: 'block'; id: BlockId }
  | { kind: 'tool'; id: ToolId }
  | { kind: 'loot'; id: LootId };

export type HotbarSlot = HotbarItem | null;

const blockItem = (id: BlockId): HotbarItem => ({ kind: 'block', id });
const toolItem = (id: ToolId): HotbarItem => ({ kind: 'tool', id });
const lootItem = (id: LootId): HotbarItem => ({ kind: 'loot', id });

/** Every placeable / usable item in creative inventory. */
export const ALL_ITEMS: HotbarItem[] = [
  ...ALL_TOOLS.map((t) => toolItem(t.id)),
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
  ...ALL_LOOT.map((l) => lootItem(l.id)),
];

export const HOTBAR_SIZE = 9;

/** Starting hotbar loadout (Minecraft creative-style defaults). */
export const createDefaultHotbar = (): HotbarSlot[] => [
  toolItem('diamond_pickaxe'),
  toolItem('diamond_axe'),
  toolItem('diamond_shovel'),
  toolItem('diamond_sword'),
  blockItem(GRASS),
  blockItem(DIRT),
  blockItem(STONE),
  // Keep empty slots so mob drops (meat, wool, …) can be picked up.
  null,
  null,
];

export type InventoryTab = 'all' | 'tools' | 'blocks' | 'ores' | 'food';

export const inventoryItemsForTab = (tab: InventoryTab): HotbarItem[] => {
  if (tab === 'all') return ALL_ITEMS;
  if (tab === 'tools') return ALL_ITEMS.filter((i) => i.kind === 'tool');
  if (tab === 'food') return ALL_ITEMS.filter((i) => i.kind === 'loot');
  if (tab === 'ores') {
    return ALL_ITEMS.filter(
      (i) =>
        i.kind === 'block' &&
        [
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
        ].includes(i.id),
    );
  }
  return ALL_ITEMS.filter(
    (i) =>
      i.kind === 'block' &&
      [GRASS, DIRT, STONE, COBBLE, WOOD, PLANKS, SAND, LEAVES].includes(i.id),
  );
};

export const itemName = (item: HotbarItem): string => {
  if (item.kind === 'tool') return toolName(item.id);
  if (item.kind === 'loot') return lootName(item.id);
  return blockName(item.id);
};

export const getTool = (item: HotbarItem | null | undefined) => {
  if (!item || item.kind !== 'tool') return null;
  return TOOLS[item.id] ?? null;
};

export const itemsEqual = (a: HotbarItem | null, b: HotbarItem | null): boolean => {
  if (!a || !b) return a === b;
  if (a.kind !== b.kind) return false;
  return a.id === b.id;
};

export const itemKey = (item: HotbarItem): string => `${item.kind}:${item.id}`;

/** Put an item into the first empty hotbar slot. Returns false if full. */
export const giveItem = (hotbar: HotbarSlot[], item: HotbarItem): boolean => {
  for (let i = 0; i < hotbar.length; i++) {
    if (hotbar[i] == null) {
      hotbar[i] = item;
      return true;
    }
  }
  return false;
};

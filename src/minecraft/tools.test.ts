import { describe, expect, it } from 'vitest';
import { DIAMOND_ORE, DIRT, LEAVES, STONE, WOOD } from './blocks';
import { HOTBAR } from './items';
import { TOOLS, isCorrectTool, mineDuration } from './tools';

describe('tools', () => {
  it('registers a full tool set', () => {
    expect(TOOLS.diamond_pickaxe.name).toBe('Diamond Pickaxe');
    expect(TOOLS.wood_axe.kind).toBe('axe');
    expect(TOOLS.iron_shovel.tier).toBe('iron');
    expect(Object.keys(TOOLS).length).toBe(25);
  });

  it('pickaxes mine stone faster than bare hands', () => {
    const hand = mineDuration(STONE, null);
    const wood = mineDuration(STONE, TOOLS.wood_pickaxe);
    const diamond = mineDuration(STONE, TOOLS.diamond_pickaxe);
    expect(wood).toBeLessThan(hand);
    expect(diamond).toBeLessThan(wood);
  });

  it('axes prefer wood and shovels prefer dirt', () => {
    expect(isCorrectTool(WOOD, TOOLS.iron_axe)).toBe(true);
    expect(isCorrectTool(DIRT, TOOLS.iron_shovel)).toBe(true);
    expect(isCorrectTool(STONE, TOOLS.iron_axe)).toBe(false);
    expect(mineDuration(WOOD, TOOLS.iron_axe)).toBeLessThan(mineDuration(WOOD, TOOLS.iron_pickaxe));
  });

  it('hard ores are slow without a strong enough pickaxe', () => {
    const withWood = mineDuration(DIAMOND_ORE, TOOLS.wood_pickaxe);
    const withIron = mineDuration(DIAMOND_ORE, TOOLS.iron_pickaxe);
    expect(withIron).toBeLessThan(withWood);
  });

  it('swords are good on leaves', () => {
    expect(isCorrectTool(LEAVES, TOOLS.diamond_sword)).toBe(true);
    expect(mineDuration(LEAVES, TOOLS.diamond_sword)).toBeLessThan(
      mineDuration(LEAVES, TOOLS.diamond_pickaxe),
    );
  });

  it('hotbar starts with tools then blocks', () => {
    expect(HOTBAR[0]).toEqual({ kind: 'tool', id: 'diamond_pickaxe' });
    expect(HOTBAR.some((i) => i.kind === 'block')).toBe(true);
    expect(HOTBAR.filter((i) => i.kind === 'tool').length).toBe(25);
  });
});

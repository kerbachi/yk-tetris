import { describe, expect, it } from 'vitest';
import {
  MOB_DEFS,
  createMob,
  damageMob,
  rayHitMob,
  rollDrops,
  spawnMobs,
} from './mobs';
import { World } from './world';

describe('mobs', () => {
  it('defines farm animals with meat drops', () => {
    expect(MOB_DEFS.pig.drops.some((d) => d.loot === 'porkchop')).toBe(true);
    expect(MOB_DEFS.cow.drops.some((d) => d.loot === 'beef')).toBe(true);
    expect(MOB_DEFS.chicken.drops.some((d) => d.loot === 'chicken')).toBe(true);
    expect(MOB_DEFS.sheep.drops.some((d) => d.loot === 'mutton')).toBe(true);
  });

  it('spawns mobs on the grass surface', () => {
    const world = new World(42);
    const mobs = spawnMobs(world, 42);
    expect(mobs.length).toBeGreaterThan(10);
    expect(mobs.some((m) => m.kind === 'pig')).toBe(true);
    expect(mobs.some((m) => m.kind === 'cow')).toBe(true);
  });

  it('killing a pig drops porkchops', () => {
    const pig = createMob('pig', 10, 20, 10);
    const drops = damageMob(pig, 999, 0);
    expect(pig.dead).toBe(true);
    expect(drops).not.toBeNull();
    expect(drops!.every((d) => d.kind === 'loot' && d.id === 'porkchop')).toBe(true);
    expect(drops!.length).toBeGreaterThanOrEqual(1);
  });

  it('rayHitMob detects a mob in front of the camera', () => {
    const mob = createMob('cow', 5, 10, 5);
    const hit = rayHitMob(5, 10.6, 2, 0, 0, 1, mob, 8);
    expect(hit).not.toBeNull();
    expect(hit!).toBeGreaterThan(0);
  });

  it('rollDrops only returns loot items', () => {
    const drops = rollDrops('cow');
    for (const d of drops) {
      expect(d.kind).toBe('loot');
    }
  });
});

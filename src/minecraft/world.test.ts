import { describe, expect, it } from 'vitest';
import { AIR, BEDROCK, GRASS, isSolid } from './blocks';
import { WORLD_H, WORLD_W, World, inBounds } from './world';
import { raycast } from './raycast';

describe('world', () => {
  it('generates bedrock floor and solid surface near center', () => {
    const world = new World(42);
    expect(world.get(10, 0, 10)).toBe(BEDROCK);

    const spawn = world.spawnPoint();
    expect(spawn.x).toBeGreaterThan(0);
    expect(spawn.y).toBeGreaterThan(1);
    expect(spawn.z).toBeGreaterThan(0);

    // spawn.y is surfaceSolidY + 2.1 — the solid block is two cells below feet.
    const surface = Math.floor(spawn.y) - 2;
    expect(isSolid(world.get(Math.floor(spawn.x), surface, Math.floor(spawn.z)))).toBe(true);
  });

  it('set/get and dirty tracking work', () => {
    const world = new World(1);
    world.dirty.clear();
    const ok = world.set(20, 30, 20, GRASS);
    expect(ok).toBe(true);
    expect(world.get(20, 30, 20)).toBe(GRASS);
    expect(world.dirty.size).toBeGreaterThan(0);
  });

  it('inBounds rejects out-of-range coords', () => {
    expect(inBounds(0, 0, 0)).toBe(true);
    expect(inBounds(-1, 0, 0)).toBe(false);
    expect(inBounds(WORLD_W, 0, 0)).toBe(false);
    expect(inBounds(0, WORLD_H, 0)).toBe(false);
  });
});

describe('raycast', () => {
  it('hits a solid block in front of the camera', () => {
    const world = new World(7);
    // Clear a tunnel along +Z so terrain does not occlude the target.
    for (let z = 36; z <= 40; z++) {
      for (let y = 19; y <= 21; y++) world.set(40, y, z, AIR);
    }
    world.set(40, 20, 40, GRASS);

    const hit = raycast(world, 40.5, 20.5, 36.5, 0, 0, 1, 8);
    expect(hit).not.toBeNull();
    expect(hit!.x).toBe(40);
    expect(hit!.y).toBe(20);
    expect(hit!.z).toBe(40);
    expect(hit!.pz).toBe(39);
  });
});

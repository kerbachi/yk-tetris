import { DIRT, GRASS, LEAVES, SAND, WOOD, isSolid } from './blocks';
import type { HotbarItem } from './items';
import { hash2 } from './noise';
import { World, WORLD_D, WORLD_H, WORLD_W, SEA_LEVEL } from './world';
import type { LootId } from './loot';

export type MobKind = 'pig' | 'cow' | 'chicken' | 'sheep';

export interface MobDef {
  kind: MobKind;
  name: string;
  health: number;
  width: number;
  height: number;
  speed: number;
  /** Body color RGB 0–1 */
  color: [number, number, number];
  accent: [number, number, number];
  drops: { loot: LootId; min: number; max: number }[];
}

export const MOB_DEFS: Record<MobKind, MobDef> = {
  pig: {
    kind: 'pig',
    name: 'Pig',
    health: 10,
    width: 0.9,
    height: 0.9,
    speed: 1.6,
    color: [0.92, 0.55, 0.55],
    accent: [0.85, 0.4, 0.4],
    drops: [{ loot: 'porkchop', min: 1, max: 3 }],
  },
  cow: {
    kind: 'cow',
    name: 'Cow',
    health: 10,
    width: 0.95,
    height: 1.3,
    speed: 1.4,
    color: [0.45, 0.3, 0.18],
    accent: [0.92, 0.92, 0.9],
    drops: [
      { loot: 'beef', min: 1, max: 3 },
      { loot: 'leather', min: 0, max: 2 },
    ],
  },
  chicken: {
    kind: 'chicken',
    name: 'Chicken',
    health: 4,
    width: 0.45,
    height: 0.7,
    speed: 2.0,
    color: [0.95, 0.95, 0.95],
    accent: [0.95, 0.75, 0.2],
    drops: [
      { loot: 'chicken', min: 1, max: 1 },
      { loot: 'feather', min: 0, max: 2 },
    ],
  },
  sheep: {
    kind: 'sheep',
    name: 'Sheep',
    health: 8,
    width: 0.9,
    height: 1.15,
    speed: 1.5,
    color: [0.93, 0.93, 0.95],
    accent: [0.25, 0.22, 0.2],
    drops: [
      { loot: 'mutton', min: 1, max: 2 },
      { loot: 'wool', min: 1, max: 1 },
    ],
  },
};

export interface Mob {
  id: number;
  kind: MobKind;
  x: number;
  y: number;
  z: number;
  yaw: number;
  vx: number;
  vy: number;
  vz: number;
  hp: number;
  age: number;
  walkTimer: number;
  hurtTimer: number;
  dead: boolean;
}

export interface DropEntity {
  id: number;
  item: HotbarItem;
  x: number;
  y: number;
  z: number;
  vy: number;
  age: number;
}

const GRAVITY = 22;
let nextId = 1;

export const createMob = (kind: MobKind, x: number, y: number, z: number): Mob => {
  const def = MOB_DEFS[kind];
  return {
    id: nextId++,
    kind,
    x,
    y,
    z,
    yaw: Math.random() * Math.PI * 2,
    vx: 0,
    vy: 0,
    vz: 0,
    hp: def.health,
    age: 0,
    walkTimer: 1 + Math.random() * 3,
    hurtTimer: 0,
    dead: false,
  };
};

const collidesMob = (
  world: World,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
): boolean => {
  const minX = Math.floor(x - w / 2);
  const maxX = Math.floor(x + w / 2);
  const minY = Math.floor(y);
  const maxY = Math.floor(y + h - 0.01);
  const minZ = Math.floor(z - w / 2);
  const maxZ = Math.floor(z + w / 2);
  for (let by = minY; by <= maxY; by++) {
    for (let bz = minZ; bz <= maxZ; bz++) {
      for (let bx = minX; bx <= maxX; bx++) {
        if (isSolid(world.get(bx, by, bz))) return true;
      }
    }
  }
  return false;
};

/** Walkable ground under a column, skipping leaves/wood (trees). */
const surfaceSpawn = (
  world: World,
  x: number,
  z: number,
): { x: number; y: number; z: number } | null => {
  const ix = Math.min(WORLD_W - 2, Math.max(1, Math.floor(x)));
  const iz = Math.min(WORLD_D - 2, Math.max(1, Math.floor(z)));
  let y = WORLD_H - 1;
  while (y > 0) {
    const id = world.get(ix, y, iz);
    if (!isSolid(id) || id === LEAVES || id === WOOD) {
      y--;
      continue;
    }
    break;
  }
  if (y <= 0 || y <= SEA_LEVEL) return null;
  // Prefer grass but allow dirt/sand so nearby packs always appear
  const ground = world.get(ix, y, iz);
  if (ground !== GRASS && ground !== DIRT && ground !== SAND) return null;
  // Need headroom so mobs aren't stuck inside a trunk
  if (isSolid(world.get(ix, y + 1, iz)) || isSolid(world.get(ix, y + 2, iz))) return null;
  return { x: ix + 0.5, y: y + 1.01, z: iz + 0.5 };
};

export const spawnMobs = (world: World, seed: number): Mob[] => {
  const mobs: Mob[] = [];
  const kinds: MobKind[] = ['pig', 'cow', 'chicken', 'sheep'];

  // Guaranteed pack near world-center spawn so players always see animals.
  const spawn = world.spawnPoint();
  const near: { kind: MobKind; dx: number; dz: number }[] = [
    { kind: 'pig', dx: 3, dz: 2 },
    { kind: 'pig', dx: 4, dz: -1 },
    { kind: 'cow', dx: -3, dz: 3 },
    { kind: 'cow', dx: -4, dz: 1 },
    { kind: 'sheep', dx: 2, dz: 5 },
    { kind: 'sheep', dx: -2, dz: 4 },
    { kind: 'chicken', dx: 5, dz: 3 },
    { kind: 'chicken', dx: 6, dz: 0 },
    { kind: 'pig', dx: -5, dz: -2 },
    { kind: 'cow', dx: 1, dz: -4 },
  ];
  for (const n of near) {
    const pos = surfaceSpawn(world, spawn.x + n.dx, spawn.z + n.dz);
    if (pos) mobs.push(createMob(n.kind, pos.x, pos.y, pos.z));
  }

  let attempts = 0;
  let placed = 0;
  while (placed < 24 && attempts < 500) {
    attempts++;
    const x = 4 + Math.floor(hash2(attempts, seed, 701) * (WORLD_W - 8));
    const z = 4 + Math.floor(hash2(attempts, seed, 702) * (WORLD_D - 8));
    const pos = surfaceSpawn(world, x, z);
    if (!pos) continue;
    // Keep random spawns on grass for a natural look
    if (world.get(Math.floor(pos.x), Math.floor(pos.y) - 1, Math.floor(pos.z)) !== GRASS) {
      continue;
    }
    const kind = kinds[Math.floor(hash2(attempts, seed, 703) * kinds.length)]!;
    mobs.push(createMob(kind, pos.x, pos.y, pos.z));
    placed++;
  }
  return mobs;
};

export const updateMob = (world: World, mob: Mob, dt: number): void => {
  if (mob.dead) return;
  const def = MOB_DEFS[mob.kind];
  mob.age += dt;
  if (mob.hurtTimer > 0) mob.hurtTimer = Math.max(0, mob.hurtTimer - dt);

  mob.walkTimer -= dt;
  if (mob.walkTimer <= 0) {
    if (Math.random() < 0.55) {
      mob.yaw = Math.random() * Math.PI * 2;
      const sp = def.speed * (0.6 + Math.random() * 0.5);
      mob.vx = Math.sin(mob.yaw) * sp;
      mob.vz = -Math.cos(mob.yaw) * sp;
      mob.walkTimer = 1.2 + Math.random() * 2.5;
    } else {
      mob.vx = 0;
      mob.vz = 0;
      mob.walkTimer = 0.8 + Math.random() * 2;
    }
  }

  // Flee briefly when hurt
  if (mob.hurtTimer > 0.15) {
    const sp = def.speed * 1.8;
    mob.vx = Math.sin(mob.yaw) * sp;
    mob.vz = -Math.cos(mob.yaw) * sp;
  }

  mob.vy -= GRAVITY * dt;

  mob.x += mob.vx * dt;
  if (collidesMob(world, mob.x, mob.y, mob.z, def.width, def.height)) {
    mob.x -= mob.vx * dt;
    mob.vx = 0;
    mob.yaw += Math.PI * (0.4 + Math.random() * 0.4);
  }
  mob.z += mob.vz * dt;
  if (collidesMob(world, mob.x, mob.y, mob.z, def.width, def.height)) {
    mob.z -= mob.vz * dt;
    mob.vz = 0;
    mob.yaw += Math.PI * (0.4 + Math.random() * 0.4);
  }
  mob.y += mob.vy * dt;
  if (collidesMob(world, mob.x, mob.y, mob.z, def.width, def.height)) {
    if (mob.vy < 0) {
      // snap onto ground
      mob.y = Math.floor(mob.y) + 0.001;
      while (collidesMob(world, mob.x, mob.y, mob.z, def.width, def.height) && mob.y < WORLD_H) {
        mob.y += 0.05;
      }
    } else {
      mob.y -= mob.vy * dt;
    }
    mob.vy = 0;
  }

  mob.x = Math.min(WORLD_W - 0.5, Math.max(0.5, mob.x));
  mob.z = Math.min(WORLD_D - 0.5, Math.max(0.5, mob.z));
  if (mob.y < -5) {
    mob.dead = true;
    mob.hp = 0;
  }
};

export const mobAabb = (
  mob: Mob,
): { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number } => {
  const def = MOB_DEFS[mob.kind];
  const hw = def.width / 2;
  return {
    minX: mob.x - hw,
    maxX: mob.x + hw,
    minY: mob.y,
    maxY: mob.y + def.height,
    minZ: mob.z - hw,
    maxZ: mob.z + hw,
  };
};

/** Ray vs AABB. Returns distance or null. */
export const rayHitMob = (
  ox: number,
  oy: number,
  oz: number,
  dx: number,
  dy: number,
  dz: number,
  mob: Mob,
  maxDist: number,
): number | null => {
  const b = mobAabb(mob);
  let tmin = 0;
  let tmax = maxDist;
  for (const [o, d, min, max] of [
    [ox, dx, b.minX, b.maxX],
    [oy, dy, b.minY, b.maxY],
    [oz, dz, b.minZ, b.maxZ],
  ] as [number, number, number, number][]) {
    if (Math.abs(d) < 1e-8) {
      if (o < min || o > max) return null;
      continue;
    }
    let t1 = (min - o) / d;
    let t2 = (max - o) / d;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }
  return tmin >= 0 ? tmin : null;
};

export const damageMob = (
  mob: Mob,
  amount: number,
  knockYaw: number,
): HotbarItem[] | null => {
  if (mob.dead) return null;
  mob.hp -= amount;
  mob.hurtTimer = 0.45;
  mob.yaw = knockYaw + Math.PI;
  mob.vx = Math.sin(knockYaw) * 4;
  mob.vz = -Math.cos(knockYaw) * 4;
  mob.vy = 3.5;
  if (mob.hp > 0) return null;
  mob.dead = true;
  return rollDrops(mob.kind);
};

export const rollDrops = (kind: MobKind): HotbarItem[] => {
  const def = MOB_DEFS[kind];
  const out: HotbarItem[] = [];
  for (const d of def.drops) {
    const n = d.min + Math.floor(Math.random() * (d.max - d.min + 1));
    for (let i = 0; i < n; i++) out.push({ kind: 'loot', id: d.loot });
  }
  return out;
};

export const createDrop = (item: HotbarItem, x: number, y: number, z: number): DropEntity => ({
  id: nextId++,
  item,
  x: x + (Math.random() - 0.5) * 0.4,
  y: y + 0.3,
  z: z + (Math.random() - 0.5) * 0.4,
  vy: 2 + Math.random(),
  age: 0,
});

export const updateDrop = (world: World, drop: DropEntity, dt: number): void => {
  drop.age += dt;
  drop.vy -= GRAVITY * dt;
  drop.y += drop.vy * dt;
  const gy = Math.floor(drop.y);
  if (isSolid(world.get(Math.floor(drop.x), gy, Math.floor(drop.z))) && drop.vy <= 0) {
    drop.y = gy + 1.05;
    drop.vy = 0;
  }
};

import * as THREE from 'three';
import { MOB_DEFS, type Mob, type MobKind } from './mobs';

const WHITE: [number, number, number] = [0.95, 0.95, 0.97];
const BLACK: [number, number, number] = [0.08, 0.08, 0.1];
const PINK: [number, number, number] = [0.95, 0.55, 0.6];
const DARK: [number, number, number] = [0.18, 0.14, 0.12];
const COMB: [number, number, number] = [0.9, 0.15, 0.12];

/** Fresh material per box so hurt-flash emissive doesn't affect other parts. */
const mat = (r: number, g: number, b: number): THREE.MeshLambertMaterial =>
  new THREE.MeshLambertMaterial({ color: new THREE.Color(r, g, b) });

const box = (
  parent: THREE.Group,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  color: [number, number, number],
): THREE.Mesh => {
  // Unique geometry per box so scaled bounds / culling stay correct.
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color[0], color[1], color[2]));
  mesh.position.set(x, y, z);
  mesh.frustumCulled = false;
  parent.add(mesh);
  return mesh;
};

/** Pair of eyes on the front (+X) of a head, with white + pupil. */
const eyes = (
  parent: THREE.Group,
  frontX: number,
  eyeY: number,
  spreadZ: number,
  size = 0.08,
): void => {
  const pupil = size * 0.45;
  for (const side of [-1, 1]) {
    const z = side * spreadZ;
    box(parent, size * 0.35, size, size, frontX, eyeY, z, WHITE);
    box(parent, size * 0.2, pupil, pupil, frontX + size * 0.12, eyeY, z, BLACK);
  }
};

const buildPig = (g: THREE.Group, color: [number, number, number], accent: [number, number, number]): void => {
  box(g, 0.9, 0.58, 0.58, 0, 0.48, 0, color); // body
  box(g, 0.42, 0.38, 0.38, 0.48, 0.52, 0, color); // head
  box(g, 0.14, 0.12, 0.2, 0.72, 0.46, 0, accent); // snout
  box(g, 0.02, 0.04, 0.04, 0.8, 0.48, 0.05, PINK); // nostril
  box(g, 0.02, 0.04, 0.04, 0.8, 0.48, -0.05, PINK);
  eyes(g, 0.7, 0.58, 0.12, 0.09);
  // Ears
  box(g, 0.06, 0.12, 0.1, 0.42, 0.74, 0.14, accent);
  box(g, 0.06, 0.12, 0.1, 0.42, 0.74, -0.14, accent);
  // Tail curl
  box(g, 0.08, 0.08, 0.08, -0.48, 0.55, 0, PINK);
  // Legs
  box(g, 0.14, 0.3, 0.14, 0.28, 0.15, 0.18, accent);
  box(g, 0.14, 0.3, 0.14, 0.28, 0.15, -0.18, accent);
  box(g, 0.14, 0.3, 0.14, -0.28, 0.15, 0.18, accent);
  box(g, 0.14, 0.3, 0.14, -0.28, 0.15, -0.18, accent);
};

const buildCow = (g: THREE.Group, color: [number, number, number], accent: [number, number, number]): void => {
  box(g, 0.95, 0.72, 0.58, 0, 0.72, 0, color); // body
  box(g, 0.22, 0.38, 0.22, 0.18, 0.88, 0.18, accent); // spots
  box(g, 0.18, 0.28, 0.18, -0.2, 0.78, -0.2, accent);
  box(g, 0.48, 0.42, 0.42, 0.55, 0.88, 0, color); // head
  box(g, 0.16, 0.14, 0.28, 0.82, 0.78, 0, accent); // muzzle
  box(g, 0.04, 0.05, 0.05, 0.91, 0.82, 0.07, DARK); // nostril
  box(g, 0.04, 0.05, 0.05, 0.91, 0.82, -0.07, DARK);
  eyes(g, 0.8, 0.98, 0.13, 0.1);
  // Horns
  box(g, 0.08, 0.2, 0.08, 0.58, 1.18, 0.16, accent);
  box(g, 0.08, 0.2, 0.08, 0.58, 1.18, -0.16, accent);
  // Ears
  box(g, 0.08, 0.1, 0.14, 0.5, 1.02, 0.28, color);
  box(g, 0.08, 0.1, 0.14, 0.5, 1.02, -0.28, color);
  // Udder hint
  box(g, 0.22, 0.14, 0.18, -0.15, 0.38, 0, PINK);
  // Legs
  box(g, 0.16, 0.48, 0.16, 0.3, 0.24, 0.18, accent);
  box(g, 0.16, 0.48, 0.16, 0.3, 0.24, -0.18, accent);
  box(g, 0.16, 0.48, 0.16, -0.3, 0.24, 0.18, accent);
  box(g, 0.16, 0.48, 0.16, -0.3, 0.24, -0.18, accent);
};

const buildChicken = (
  g: THREE.Group,
  color: [number, number, number],
  accent: [number, number, number],
): void => {
  box(g, 0.36, 0.36, 0.36, 0, 0.42, 0, color); // body
  box(g, 0.3, 0.3, 0.3, 0.24, 0.58, 0, color); // head
  box(g, 0.12, 0.08, 0.12, 0.42, 0.54, 0, accent); // beak
  box(g, 0.06, 0.1, 0.06, 0.38, 0.46, 0, COMB); // wattle
  box(g, 0.06, 0.12, 0.04, 0.22, 0.76, 0, COMB); // comb
  eyes(g, 0.4, 0.64, 0.1, 0.08);
  // Wings
  box(g, 0.22, 0.08, 0.32, -0.02, 0.46, 0.2, [0.88, 0.88, 0.92]);
  box(g, 0.22, 0.08, 0.32, -0.02, 0.46, -0.2, [0.88, 0.88, 0.92]);
  // Tail feathers
  box(g, 0.08, 0.18, 0.2, -0.22, 0.55, 0, [0.9, 0.9, 0.94]);
  // Legs + feet
  box(g, 0.06, 0.24, 0.06, 0.06, 0.14, 0.08, [0.95, 0.55, 0.15]);
  box(g, 0.06, 0.24, 0.06, 0.06, 0.14, -0.08, [0.95, 0.55, 0.15]);
  box(g, 0.14, 0.04, 0.08, 0.12, 0.04, 0.08, [0.95, 0.55, 0.15]);
  box(g, 0.14, 0.04, 0.08, 0.12, 0.04, -0.08, [0.95, 0.55, 0.15]);
};

const buildSheep = (
  g: THREE.Group,
  color: [number, number, number],
  accent: [number, number, number],
): void => {
  box(g, 1.0, 0.8, 0.75, 0, 0.72, 0, color); // fluffy wool body
  box(g, 0.42, 0.38, 0.38, 0.55, 0.78, 0, accent); // face
  box(g, 0.1, 0.08, 0.16, 0.78, 0.7, 0, [0.35, 0.28, 0.26]); // nose
  eyes(g, 0.77, 0.88, 0.11, 0.09);
  // Floppy ears
  box(g, 0.08, 0.12, 0.16, 0.52, 0.88, 0.26, accent);
  box(g, 0.08, 0.12, 0.16, 0.52, 0.88, -0.26, accent);
  // Wool puff on head
  box(g, 0.28, 0.18, 0.32, 0.42, 1.0, 0, color);
  // Legs
  box(g, 0.14, 0.38, 0.14, 0.28, 0.19, 0.22, accent);
  box(g, 0.14, 0.38, 0.14, 0.28, 0.19, -0.22, accent);
  box(g, 0.14, 0.38, 0.14, -0.28, 0.19, 0.22, accent);
  box(g, 0.14, 0.38, 0.14, -0.28, 0.19, -0.22, accent);
};

export const createMobMesh = (kind: MobKind): THREE.Group => {
  const def = MOB_DEFS[kind];
  const g = new THREE.Group();
  g.userData.kind = kind;
  g.frustumCulled = false;

  if (kind === 'pig') buildPig(g, def.color, def.accent);
  else if (kind === 'cow') buildCow(g, def.color, def.accent);
  else if (kind === 'chicken') buildChicken(g, def.color, def.accent);
  else buildSheep(g, def.color, def.accent);

  return g;
};

export const syncMobMesh = (mesh: THREE.Group, mob: Mob): void => {
  mesh.position.set(mob.x, mob.y, mob.z);
  mesh.rotation.y = mob.yaw;
  // Mild walk bob when moving
  const moving = Math.hypot(mob.vx, mob.vz) > 0.15;
  const bob = moving ? Math.sin(mob.age * 10) * 0.03 : 0;
  mesh.position.y = mob.y + bob;

  const flash = mob.hurtTimer > 0;
  mesh.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshLambertMaterial) {
      obj.material.emissive = flash
        ? new THREE.Color(0.55, 0.1, 0.1)
        : new THREE.Color(0, 0, 0);
    }
  });
};

import * as THREE from 'three';
import { MOB_DEFS, type Mob, type MobKind } from './mobs';

const geomCache = {
  box: new THREE.BoxGeometry(1, 1, 1),
};

const matCache = new Map<string, THREE.MeshLambertMaterial>();

const mat = (r: number, g: number, b: number): THREE.MeshLambertMaterial => {
  const key = `${r},${g},${b}`;
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color: new THREE.Color(r, g, b) });
    matCache.set(key, m);
  }
  return m;
};

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
  const mesh = new THREE.Mesh(geomCache.box, mat(color[0], color[1], color[2]));
  mesh.scale.set(w, h, d);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
};

export const createMobMesh = (kind: MobKind): THREE.Group => {
  const def = MOB_DEFS[kind];
  const g = new THREE.Group();
  g.userData.kind = kind;

  if (kind === 'pig') {
    box(g, 0.85, 0.55, 0.55, 0, 0.45, 0, def.color); // body
    box(g, 0.4, 0.35, 0.35, 0.45, 0.5, 0, def.color); // head
    box(g, 0.12, 0.1, 0.18, 0.68, 0.45, 0, def.accent); // snout
    box(g, 0.14, 0.28, 0.14, 0.25, 0.14, 0.18, def.accent);
    box(g, 0.14, 0.28, 0.14, 0.25, 0.14, -0.18, def.accent);
    box(g, 0.14, 0.28, 0.14, -0.25, 0.14, 0.18, def.accent);
    box(g, 0.14, 0.28, 0.14, -0.25, 0.14, -0.18, def.accent);
  } else if (kind === 'cow') {
    box(g, 0.9, 0.7, 0.55, 0, 0.7, 0, def.color);
    box(g, 0.2, 0.35, 0.2, 0.2, 0.85, 0.2, def.accent); // spots
    box(g, 0.45, 0.4, 0.4, 0.5, 0.85, 0, def.color); // head
    box(g, 0.08, 0.18, 0.08, 0.55, 1.15, 0.15, def.accent); // horn
    box(g, 0.08, 0.18, 0.08, 0.55, 1.15, -0.15, def.accent);
    box(g, 0.16, 0.45, 0.16, 0.28, 0.22, 0.18, def.accent);
    box(g, 0.16, 0.45, 0.16, 0.28, 0.22, -0.18, def.accent);
    box(g, 0.16, 0.45, 0.16, -0.28, 0.22, 0.18, def.accent);
    box(g, 0.16, 0.45, 0.16, -0.28, 0.22, -0.18, def.accent);
  } else if (kind === 'chicken') {
    box(g, 0.35, 0.35, 0.35, 0, 0.4, 0, def.color);
    box(g, 0.28, 0.28, 0.28, 0.22, 0.55, 0, def.color);
    box(g, 0.1, 0.08, 0.12, 0.4, 0.52, 0, def.accent); // beak
    box(g, 0.06, 0.22, 0.06, 0.05, 0.12, 0.08, [0.95, 0.55, 0.15]);
    box(g, 0.06, 0.22, 0.06, 0.05, 0.12, -0.08, [0.95, 0.55, 0.15]);
    box(g, 0.25, 0.08, 0.35, -0.05, 0.45, 0, [0.85, 0.85, 0.9]); // wing
  } else {
    // sheep
    box(g, 0.95, 0.75, 0.7, 0, 0.7, 0, def.color); // wool body
    box(g, 0.4, 0.35, 0.35, 0.5, 0.75, 0, def.accent); // face
    box(g, 0.14, 0.35, 0.14, 0.25, 0.18, 0.2, def.accent);
    box(g, 0.14, 0.35, 0.14, 0.25, 0.18, -0.2, def.accent);
    box(g, 0.14, 0.35, 0.14, -0.25, 0.18, 0.2, def.accent);
    box(g, 0.14, 0.35, 0.14, -0.25, 0.18, -0.2, def.accent);
  }

  return g;
};

export const syncMobMesh = (mesh: THREE.Group, mob: Mob): void => {
  mesh.position.set(mob.x, mob.y, mob.z);
  mesh.rotation.y = mob.yaw;
  // Hurt flash
  const flash = mob.hurtTimer > 0;
  mesh.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshLambertMaterial) {
      obj.material.emissive = flash
        ? new THREE.Color(0.55, 0.1, 0.1)
        : new THREE.Color(0, 0, 0);
    }
  });
};

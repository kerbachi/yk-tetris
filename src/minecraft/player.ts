import { isSolid } from './blocks';
import { World, WORLD_H, WORLD_W, WORLD_D } from './world';

export interface PlayerState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  yaw: number;
  pitch: number;
  onGround: boolean;
}

const WIDTH = 0.6;
const HEIGHT = 1.7;
const EYE = 1.55;
const SPEED = 5.2;
const SPRINT = 7.8;
const JUMP = 8.2;
const GRAVITY = 24;

export const createPlayer = (x: number, y: number, z: number): PlayerState => ({
  x,
  y,
  z,
  vx: 0,
  vy: 0,
  vz: 0,
  yaw: 0,
  pitch: 0,
  onGround: false,
});

export const eyePosition = (p: PlayerState): { x: number; y: number; z: number } => ({
  x: p.x,
  y: p.y + EYE,
  z: p.z,
});

export const lookDirection = (
  p: PlayerState,
): { x: number; y: number; z: number } => {
  const cosP = Math.cos(p.pitch);
  return {
    x: Math.sin(p.yaw) * cosP,
    y: Math.sin(p.pitch),
    z: -Math.cos(p.yaw) * cosP,
  };
};

const collides = (world: World, x: number, y: number, z: number): boolean => {
  const minX = Math.floor(x - WIDTH / 2);
  const maxX = Math.floor(x + WIDTH / 2);
  const minY = Math.floor(y);
  const maxY = Math.floor(y + HEIGHT - 0.01);
  const minZ = Math.floor(z - WIDTH / 2);
  const maxZ = Math.floor(z + WIDTH / 2);

  for (let by = minY; by <= maxY; by++) {
    for (let bz = minZ; bz <= maxZ; bz++) {
      for (let bx = minX; bx <= maxX; bx++) {
        if (isSolid(world.get(bx, by, bz))) return true;
      }
    }
  }
  return false;
};

export interface InputState {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  sprint: boolean;
}

export const updatePlayer = (
  world: World,
  p: PlayerState,
  input: InputState,
  dt: number,
): void => {
  const sin = Math.sin(p.yaw);
  const cos = Math.cos(p.yaw);
  let wishX = 0;
  let wishZ = 0;
  if (input.forward) {
    wishX += sin;
    wishZ -= cos;
  }
  if (input.back) {
    wishX -= sin;
    wishZ += cos;
  }
  if (input.left) {
    wishX -= cos;
    wishZ -= sin;
  }
  if (input.right) {
    wishX += cos;
    wishZ += sin;
  }
  const len = Math.hypot(wishX, wishZ);
  if (len > 0) {
    wishX /= len;
    wishZ /= len;
  }
  const speed = input.sprint ? SPRINT : SPEED;
  p.vx = wishX * speed;
  p.vz = wishZ * speed;

  if (input.jump && p.onGround) {
    p.vy = JUMP;
    p.onGround = false;
  }

  p.vy -= GRAVITY * dt;

  // Axis-separated collision
  p.x += p.vx * dt;
  if (collides(world, p.x, p.y, p.z)) {
    p.x -= p.vx * dt;
    p.vx = 0;
  }

  p.z += p.vz * dt;
  if (collides(world, p.x, p.y, p.z)) {
    p.z -= p.vz * dt;
    p.vz = 0;
  }

  p.y += p.vy * dt;
  p.onGround = false;
  if (collides(world, p.x, p.y, p.z)) {
    if (p.vy < 0) p.onGround = true;
    p.y -= p.vy * dt;
    p.vy = 0;
  }

  // Soft world bounds
  p.x = Math.min(WORLD_W - 0.3, Math.max(0.3, p.x));
  p.z = Math.min(WORLD_D - 0.3, Math.max(0.3, p.z));
  if (p.y < -10) {
    const spawn = world.spawnPoint();
    p.x = spawn.x;
    p.y = spawn.y;
    p.z = spawn.z;
    p.vy = 0;
  }
  if (p.y > WORLD_H + 20) {
    p.y = WORLD_H + 20;
    p.vy = 0;
  }

  p.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, p.pitch));
};

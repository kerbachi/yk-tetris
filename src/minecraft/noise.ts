/** Deterministic 2D value noise helpers for terrain generation. */

const fade = (t: number): number => t * t * t * (t * (t * 6 - 15) + 10);

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Integer hash → [0, 1). */
export const hash2 = (x: number, z: number, seed: number): number => {
  let n = (x * 374761393 + z * 668265263 + seed * 1274126177) | 0;
  n = (n ^ (n >> 13)) * 1274126177;
  n = n ^ (n >> 16);
  return (n >>> 0) / 4294967296;
};

export const valueNoise2 = (x: number, z: number, seed: number): number => {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const xf = fade(x - x0);
  const zf = fade(z - z0);
  const v00 = hash2(x0, z0, seed);
  const v10 = hash2(x0 + 1, z0, seed);
  const v01 = hash2(x0, z0 + 1, seed);
  const v11 = hash2(x0 + 1, z0 + 1, seed);
  return lerp(lerp(v00, v10, xf), lerp(v01, v11, xf), zf);
};

/** Fractal Brownian motion in [0, 1]. */
export const fbm2 = (
  x: number,
  z: number,
  seed: number,
  octaves = 4,
  lacunarity = 2,
  gain = 0.5,
): number => {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise2(x * freq, z * freq, seed + i * 1013) * amp;
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / norm;
};

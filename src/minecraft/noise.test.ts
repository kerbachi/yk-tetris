import { describe, expect, it } from 'vitest';
import { fbm2, hash2, valueNoise2 } from './noise';

describe('noise', () => {
  it('hash2 is deterministic and in [0, 1)', () => {
    const a = hash2(3, 7, 42);
    const b = hash2(3, 7, 42);
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(1);
  });

  it('valueNoise2 stays in [0, 1]', () => {
    for (let i = 0; i < 20; i++) {
      const v = valueNoise2(i * 0.37, i * 0.19, 11);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('fbm2 stays in [0, 1]', () => {
    const v = fbm2(12.5, -3.25, 99, 4);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

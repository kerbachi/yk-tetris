import { describe, expect, it } from 'vitest';
import { bounce } from './background';

describe('bounce', () => {
  const max = 1000;
  const radius = 40;

  it('leaves in-bounds values and velocity unchanged', () => {
    expect(bounce(500, 2, max, radius)).toEqual({ value: 500, velocity: 2 });
    expect(bounce(500, -2, max, radius)).toEqual({ value: 500, velocity: -2 });
  });

  it('reflects off the low edge (velocity becomes positive)', () => {
    expect(bounce(radius - 5, -3, max, radius)).toEqual({
      value: radius,
      velocity: 3,
    });
  });

  it('reflects off the high edge (velocity becomes negative)', () => {
    expect(bounce(max - radius + 5, 3, max, radius)).toEqual({
      value: max - radius,
      velocity: -3,
    });
  });

  it('keeps the block off the edge by its radius', () => {
    const low = bounce(-100, -1, max, radius);
    expect(low.value).toBe(radius);
    expect(low.velocity).toBeGreaterThan(0);
    const high = bounce(max + 100, 1, max, radius);
    expect(high.value).toBe(max - radius);
    expect(high.velocity).toBeLessThan(0);
  });

  it('centers a block larger than the viewport dimension', () => {
    expect(bounce(10, 1, 50, 40)).toEqual({ value: 25, velocity: 1 });
  });
});

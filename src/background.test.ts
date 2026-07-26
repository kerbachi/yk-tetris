import { describe, expect, it } from 'vitest';
import { wrap } from './background';

describe('wrap', () => {
  const max = 1000;
  const margin = 40;

  it('leaves in-bounds values unchanged', () => {
    expect(wrap(0, max, margin)).toBe(0);
    expect(wrap(500, max, margin)).toBe(500);
    expect(wrap(max, max, margin)).toBe(max);
  });

  it('wraps values past the left/top edge to the far side', () => {
    expect(wrap(-margin - 1, max, margin)).toBe(max + margin);
  });

  it('wraps values past the right/bottom edge back to the start', () => {
    expect(wrap(max + margin + 1, max, margin)).toBe(-margin);
  });

  it('keeps values within the margin band', () => {
    expect(wrap(-margin, max, margin)).toBe(-margin);
    expect(wrap(max + margin, max, margin)).toBe(max + margin);
  });
});

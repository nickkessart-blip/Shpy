import { describe, expect, it } from 'vitest';
import { CASINO_ROULETTE_PARALLAX, CASINO_ROULETTE_TARGET, getCasinoRouletteTargetScreenRect, isCasinoRouletteTargetAtScreenPoint } from './casinoRouletteTarget';

describe('Casino roulette shot target', () => {
  it('centres the target over the authored wheel with no camera movement', () => {
    expect(getCasinoRouletteTargetScreenRect(0, 0)).toEqual({ x: 592, y: 473, width: 96, height: 64 });
    expect(isCasinoRouletteTargetAtScreenPoint({ x: 640, y: 505 }, 0, 0)).toBe(true);
  });
  it('tracks the 0.42 parallax offset under camera movement', () => {
    const scroll = { x: 500, y: 100 };
    const rect = getCasinoRouletteTargetScreenRect(scroll.x, scroll.y);
    expect(rect.x).toBeCloseTo(592 - 500 * CASINO_ROULETTE_PARALLAX);
    expect(rect.y).toBeCloseTo(473 - 100 * CASINO_ROULETTE_PARALLAX);
    expect(isCasinoRouletteTargetAtScreenPoint({ x: rect.x + 48, y: rect.y + 32 }, scroll.x, scroll.y)).toBe(true);
  });
  it('accepts target edges and rejects points outside the wheel', () => {
    expect(isCasinoRouletteTargetAtScreenPoint({ x: 592, y: 473 }, 0, 0)).toBe(true);
    expect(isCasinoRouletteTargetAtScreenPoint({ x: 688, y: 537 }, 0, 0)).toBe(true);
    expect(isCasinoRouletteTargetAtScreenPoint({ x: 689, y: 505 }, 0, 0)).toBe(false);
    expect(isCasinoRouletteTargetAtScreenPoint({ x: 640, y: 538 }, 0, 0)).toBe(false);
  });
  it('rejects non-finite aim and camera values', () => {
    expect(() => getCasinoRouletteTargetScreenRect(Number.NaN, 0)).toThrow(RangeError);
    expect(() => isCasinoRouletteTargetAtScreenPoint({ x: 0, y: Number.NaN }, 0, 0)).toThrow(RangeError);
    expect(CASINO_ROULETTE_TARGET.width).toBe(96);
  });
});
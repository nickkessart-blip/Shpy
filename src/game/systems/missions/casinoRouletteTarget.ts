import type { Point } from '../combat/combatMath';

export interface CasinoRouletteTargetScreenRect { x: number; y: number; width: number; height: number; }
export const CASINO_ROULETTE_PARALLAX = 0.42;
export const CASINO_ROULETTE_TARGET = { centerX: 640, centerY: 505, width: 96, height: 64 } as const;

function validateCamera(scrollX: number, scrollY: number): void {
  if (![scrollX, scrollY].every(Number.isFinite)) throw new RangeError('roulette camera scroll must be finite');
}

/** Screen-space target rectangle aligned to the authored Casino mid-layer parallax. */
export function getCasinoRouletteTargetScreenRect(scrollX: number, scrollY: number): CasinoRouletteTargetScreenRect {
  validateCamera(scrollX, scrollY);
  return {
    x: CASINO_ROULETTE_TARGET.centerX - CASINO_ROULETTE_TARGET.width / 2 - scrollX * CASINO_ROULETTE_PARALLAX,
    y: CASINO_ROULETTE_TARGET.centerY - CASINO_ROULETTE_TARGET.height / 2 - scrollY * CASINO_ROULETTE_PARALLAX,
    width: CASINO_ROULETTE_TARGET.width, height: CASINO_ROULETTE_TARGET.height,
  };
}

/** True when the screen-space reticle is inside the visible wheel target. */
export function isCasinoRouletteTargetAtScreenPoint(aimScreen: Point, scrollX: number, scrollY: number): boolean {
  if (![aimScreen.x, aimScreen.y].every(Number.isFinite)) throw new RangeError('roulette aim point must be finite');
  const rect = getCasinoRouletteTargetScreenRect(scrollX, scrollY);
  return aimScreen.x >= rect.x && aimScreen.x <= rect.x + rect.width
    && aimScreen.y >= rect.y && aimScreen.y <= rect.y + rect.height;
}
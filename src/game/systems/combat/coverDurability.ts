export type CoverStage = 'intact' | 'damaged' | 'destroyed';

export interface CoverDurabilityState { hp: number; maxHp: number; stage: CoverStage; }

const COVER_MAX_HP: Record<string, number> = {
  'table-left': 260,
  'table-right': 240,
  'bar-counter': 360,
  'seat-left': 190,
  'seat-right': 190,
};

export function getCoverMaxHp(coverId: string): number { return COVER_MAX_HP[coverId] ?? 220; }

export function createCoverDurability(coverId: string): CoverDurabilityState {
  const maxHp = getCoverMaxHp(coverId);
  return { hp: maxHp, maxHp, stage: 'intact' };
}

/** Apply a weapon hit and derive the visible structural stage from remaining durability. */
export function applyCoverDamage(state: CoverDurabilityState, damage: number): CoverDurabilityState {
  if (![state.hp, state.maxHp, damage].every(Number.isFinite)
    || state.maxHp <= 0 || state.hp < 0 || state.hp > state.maxHp || damage < 0) {
    throw new RangeError('cover durability and incoming damage must be finite and within bounds');
  }
  const hp = Math.max(0, state.hp - damage);
  const stage: CoverStage = hp <= 0 ? 'destroyed' : hp / state.maxHp <= 0.55 ? 'damaged' : 'intact';
  return { hp, maxHp: state.maxHp, stage };
}
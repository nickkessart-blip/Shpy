import { describe, expect, it } from 'vitest';
import {
  ACCOUNT_LEVELS, ACCOUNT_UNLOCKS, getAccountLevel, getAccountProgress, getAccountRank, getNextAccountRank,
} from './progression';

describe('account progression', () => {
  it('keeps legacy reputation milestones mapped to account ranks', () => {
    expect([0, 350, 700, 850, 1200, 1400, 1800].map(getAccountLevel)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('assigns account rank titles and the next rank threshold', () => {
    expect(getAccountRank(900).title).toBe('ОПЕРАТИВНИК');
    expect(getNextAccountRank(900)).toMatchObject({ level: 5, xp: 1200 });
  });

  it('reports progress inside the current account level', () => {
    expect(getAccountProgress(600)).toEqual({ current: 250, next: 350, progress: 250 / 350 });
  });

  it('unlocks new arsenal and perk branches gradually', () => {
    expect(ACCOUNT_UNLOCKS['weapon-slot-2']).toBe(2);
    expect(ACCOUNT_UNLOCKS.grenade).toBe(3);
    expect(ACCOUNT_UNLOCKS.shotgun).toBe(4);
    expect(ACCOUNT_UNLOCKS['weapon-slot-3']).toBe(5);
    expect(ACCOUNT_UNLOCKS['precision-perks']).toBe(5);
    expect(ACCOUNT_UNLOCKS.rifle).toBe(6);
    expect(ACCOUNT_UNLOCKS.medkit).toBe(7);
  });

  it('has a finite starter rank ladder with increasing XP requirements', () => {
    expect(ACCOUNT_LEVELS).toHaveLength(15);
    expect(ACCOUNT_LEVELS.every((rank, index) => index === 0 || rank.xp > ACCOUNT_LEVELS[index - 1]!.xp)).toBe(true);
    expect(getAccountLevel(999999)).toBe(15);
  });
});

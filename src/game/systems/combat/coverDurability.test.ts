import { describe, expect, it } from 'vitest';
import { applyCoverDamage, createCoverDurability, getCoverMaxHp } from './coverDurability';

describe('destructible cover durability', () => {
  it('assigns different strength to table, bar and seat cover', () => {
    expect(getCoverMaxHp('table-left')).toBe(260);
    expect(getCoverMaxHp('bar-counter')).toBe(360);
    expect(getCoverMaxHp('seat-left')).toBe(190);
    expect(getCoverMaxHp('unknown-cover')).toBe(220);
  });
  it('starts intact and changes to damaged only after the threshold', () => {
    const initial = createCoverDurability('table-left');
    expect(initial).toEqual({ hp: 260, maxHp: 260, stage: 'intact' });
    expect(applyCoverDamage(initial, 120)).toEqual({ hp: 140, maxHp: 260, stage: 'damaged' });
  });
  it('keeps a strong cover intact while damage remains above 55 percent', () => {
    expect(applyCoverDamage(createCoverDurability('bar-counter'), 150))
      .toEqual({ hp: 210, maxHp: 360, stage: 'intact' });
  });
  it('clamps lethal damage at zero and permanently marks the cover destroyed', () => {
    const result = applyCoverDamage(createCoverDurability('seat-left'), 9999);
    expect(result).toEqual({ hp: 0, maxHp: 190, stage: 'destroyed' });
    expect(applyCoverDamage(result, 10)).toEqual(result);
  });
  it('rejects invalid durability and negative damage', () => {
    expect(() => applyCoverDamage({ hp: Number.NaN, maxHp: 100, stage: 'intact' }, 5)).toThrow(RangeError);
    expect(() => applyCoverDamage({ hp: 100, maxHp: 100, stage: 'intact' }, -1)).toThrow(RangeError);
    expect(() => applyCoverDamage({ hp: 120, maxHp: 100, stage: 'intact' }, 5)).toThrow(RangeError);
  });
});
import { describe, expect, it } from 'vitest';
import { getFirstPersonWeaponMuzzlePoint, getFirstPersonWeaponRotationOffset } from './weaponViewmodel';

describe('first-person weapon viewmodel geometry', () => {
  it('keeps muzzle transforms tied to each actual weapon frame', () => {
    expect(getFirstPersonWeaponMuzzlePoint('pistol', { x: 640, y: 770 }, 0)).toEqual({ x: 638, y: 590 });
    expect(getFirstPersonWeaponMuzzlePoint('smg', { x: 640, y: 770 }, 0)).toEqual({ x: 588, y: 589 });
    expect(getFirstPersonWeaponMuzzlePoint('shotgun', { x: 640, y: 770 }, 0)).toEqual({ x: 599, y: 590 });
    expect(getFirstPersonWeaponMuzzlePoint('rifle', { x: 640, y: 770 }, 0)).toEqual({ x: 600, y: 592 });
  });
  it('rotates the muzzle point with the same rigid transform as the visible sprite', () => {
    const muzzle = getFirstPersonWeaponMuzzlePoint('pistol', { x: 640, y: 770 }, Math.PI / 2);
    expect(muzzle.x).toBeCloseTo(820);
    expect(muzzle.y).toBeCloseTo(768);
  });
  it('uses per-weapon alignment corrections for diagonal weapon poses', () => {
    expect(getFirstPersonWeaponRotationOffset('pistol')).toBe(0);
    expect(getFirstPersonWeaponRotationOffset('smg')).toBe(0.31);
    expect(getFirstPersonWeaponRotationOffset('shotgun')).toBe(0.20);
    expect(getFirstPersonWeaponRotationOffset('rifle')).toBe(0.30);
  });
  it('rejects non-finite rig transforms', () => {
    expect(() => getFirstPersonWeaponMuzzlePoint('pistol', { x: Number.NaN, y: 0 }, 0)).toThrow(RangeError);
    expect(() => getFirstPersonWeaponMuzzlePoint('rifle', { x: 0, y: 0 }, Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});
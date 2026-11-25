import type { WeaponId } from '../../data/arsenal';
import type { Point } from './combatMath';

interface ViewmodelMuzzleLayout { point: Point; rotationOffset: number; }

// Local display-space barrel-tip coordinates relative to the rig origin.
const VIEWMODEL_LAYOUT: Record<WeaponId, ViewmodelMuzzleLayout> = {
  pistol: { point: { x: -2, y: -180 }, rotationOffset: 0 },
  smg: { point: { x: -52, y: -181 }, rotationOffset: 0.31 },
  shotgun: { point: { x: -41, y: -180 }, rotationOffset: 0.20 },
  rifle: { point: { x: -40, y: -178 }, rotationOffset: 0.30 },
};

export function getFirstPersonWeaponRotationOffset(weaponId: WeaponId): number {
  return VIEWMODEL_LAYOUT[weaponId].rotationOffset;
}

/** Transform the visible barrel tip with the same position and rotation as the drawn sprite. */
export function getFirstPersonWeaponMuzzlePoint(weaponId: WeaponId, rigOrigin: Point, rotation: number): Point {
  if (![rigOrigin.x, rigOrigin.y, rotation].every(Number.isFinite)) {
    throw new RangeError('viewmodel rig transform must be finite');
  }
  const { point } = VIEWMODEL_LAYOUT[weaponId];
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return {
    x: rigOrigin.x + point.x * cos - point.y * sin,
    y: rigOrigin.y + point.x * sin + point.y * cos,
  };
}
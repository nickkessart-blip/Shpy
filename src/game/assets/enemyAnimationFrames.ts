export const ENEMY_ANIMATION_TYPES = ['guard', 'armored', 'assault', 'boss'] as const;
export const ENEMY_ANIMATION_POSES = ['idle', 'aim', 'fire', 'hit'] as const;

export type EnemyAnimationType = (typeof ENEMY_ANIMATION_TYPES)[number];
export type EnemyAnimationPose = (typeof ENEMY_ANIMATION_POSES)[number];

/** Stable row-major frame mapping for the 4×4 enemy state atlas. */
export function enemyAnimationFrame(type: EnemyAnimationType, pose: EnemyAnimationPose): number {
  const row = ENEMY_ANIMATION_TYPES.indexOf(type);
  const column = ENEMY_ANIMATION_POSES.indexOf(pose);
  if (row < 0 || column < 0) {
    throw new RangeError(`Unknown enemy animation frame: ${type}/${pose}`);
  }
  return row * ENEMY_ANIMATION_POSES.length + column;
}

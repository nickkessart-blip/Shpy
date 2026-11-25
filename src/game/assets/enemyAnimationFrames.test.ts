import { describe, expect, it } from 'vitest';
import {
  ENEMY_ANIMATION_POSES,
  ENEMY_ANIMATION_TYPES,
  enemyAnimationFrame,
} from './enemyAnimationFrames';

describe('enemy animation atlas frame map', () => {
  it('maps the four enemy rows and four authored poses to all 16 row-major frames', () => {
    const frames = ENEMY_ANIMATION_TYPES.flatMap((type) =>
      ENEMY_ANIMATION_POSES.map((pose) => enemyAnimationFrame(type, pose)),
    );
    expect(frames).toEqual(Array.from({ length: 16 }, (_value, index) => index));
    expect(new Set(frames).size).toBe(16);
  });

  it('keeps each row contiguous in idle, aim, fire, hit order', () => {
    ENEMY_ANIMATION_TYPES.forEach((type, row) => {
      ENEMY_ANIMATION_POSES.forEach((_pose, column) => {
        expect(enemyAnimationFrame(type, ENEMY_ANIMATION_POSES[column]))
          .toBe(row * 4 + column);
      });
    });
  });
});

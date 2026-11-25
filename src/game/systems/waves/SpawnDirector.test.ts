import { describe, expect, it } from 'vitest';
import type { CoverDefinition, SpawnPoint } from '../../data/missions';
import type { EnemyType } from '../../data/enemies';
import { planEnemyWave } from './SpawnDirector';

const anchors: SpawnPoint[] = [
  { x: 365, y: 350, coverId: 'left' },
  { x: 900, y: 345, coverId: 'right' },
];
const covers: CoverDefinition[] = [
  { id: 'left', x: 250, y: 420, width: 260, height: 94 },
  { id: 'right', x: 850, y: 420, width: 185, height: 94 },
];

describe('SpawnDirector', () => {
  it('produces the same spawn plan for the same seed', () => {
    const enemies: EnemyType[] = ['guard', 'assault', 'armored'];
    expect(planEnemyWave(enemies, anchors, covers, 12345))
      .toEqual(planEnemyWave(enemies, anchors, covers, 12345));
  });

  it('changes lane assignment and entrance order when the seed changes', () => {
    const enemies: EnemyType[] = ['guard', 'assault', 'armored'];
    const first = planEnemyWave(enemies, anchors, covers, 12345);
    const second = planEnemyWave(enemies, anchors, covers, 98765);
    expect(second).not.toEqual(first);
  });

  it('keeps every spawn inside the playable lane bounds', () => {
    const plan = planEnemyWave(['guard', 'guard', 'assault'], anchors, covers, 7);
    for (const entry of plan) {
      expect(entry.spawn.x).toBeGreaterThanOrEqual(120);
      expect(entry.spawn.x).toBeLessThanOrEqual(1160);
      expect(entry.spawn.y).toBeGreaterThanOrEqual(285);
      expect(entry.spawn.y).toBeLessThanOrEqual(390);
    }
  });

  it('keeps enemies separated and avoids cover collision volumes', () => {
    const plan = planEnemyWave(['guard', 'assault', 'armored'], anchors, covers, 42);
    for (let i = 0; i < plan.length; i += 1) {
      for (let j = i + 1; j < plan.length; j += 1) {
        expect(Math.hypot(plan[i].spawn.x - plan[j].spawn.x, plan[i].spawn.y - plan[j].spawn.y))
          .toBeGreaterThanOrEqual(135);
      }
      for (const cover of covers) {
        const expanded = { x: cover.x - 64, y: cover.y - 64, width: cover.width + 128, height: cover.height + 128 };
        const point = plan[i].spawn;
        const inside = point.x >= expanded.x && point.x <= expanded.x + expanded.width
          && point.y >= expanded.y && point.y <= expanded.y + expanded.height;
        expect(inside).toBe(false);
      }
    }
  });

  it('staggers entrance cues without changing the authored enemy composition', () => {
    const enemies: EnemyType[] = ['guard', 'guard', 'boss'];
    const plan = planEnemyWave(enemies, anchors, covers, 99);
    expect(plan.map((entry) => entry.type).sort()).toEqual([...enemies].sort());
    expect(plan.map((entry) => entry.entryDelayMs)).toEqual(
      [...plan.map((entry) => entry.entryDelayMs)].sort((a, b) => a - b),
    );
    expect(plan[0].entryDelayMs).toBe(0);
    expect(plan[plan.length - 1].entryDelayMs).toBeGreaterThan(0);
  });

  it('handles a single boss spawn without requiring cover', () => {
    const plan = planEnemyWave(['boss'], [{ x: 640, y: 315 }], [], 5);
    expect(plan).toHaveLength(1);
    expect(plan[0].type).toBe('boss');
    expect(plan[0].spawn).toEqual({ x: 640, y: 315 });
  });
});

import type { Point, Rect } from './combatMath';

export interface EnemyProjectileCoverImpact {
  point: Point;
  progress: number;
  coverIndex: number;
}

/** Finds the first point where a launched enemy round intersects any solid cover rectangle. */
export function findEnemyProjectileCoverImpact(
  start: Point,
  target: Point,
  covers: readonly Rect[],
): EnemyProjectileCoverImpact | null {
  if (![start.x, start.y, target.x, target.y].every(Number.isFinite)) {
    throw new RangeError('enemy projectile cover segment must use finite coordinates');
  }
  const dx = target.x - start.x;
  const dy = target.y - start.y;
  let earliest: EnemyProjectileCoverImpact | null = null;

  for (let coverIndex = 0; coverIndex < covers.length; coverIndex += 1) {
    const cover = covers[coverIndex];
    if (!cover) continue;
    if (![cover.x, cover.y, cover.width, cover.height].every(Number.isFinite)
      || cover.width < 0 || cover.height < 0) {
      throw new RangeError('cover rectangle must have finite coordinates and non-negative dimensions');
    }
    let enter = 0;
    let exit = 1;
    const edges: Array<[number, number]> = [
      [-dx, start.x - cover.x],
      [dx, cover.x + cover.width - start.x],
      [-dy, start.y - cover.y],
      [dy, cover.y + cover.height - start.y],
    ];
    let intersects = true;
    for (const [p, q] of edges) {
      if (Math.abs(p) < 1e-9) {
        if (q < 0) { intersects = false; break; }
        continue;
      }
      const boundary = q / p;
      if (p < 0) enter = Math.max(enter, boundary);
      else exit = Math.min(exit, boundary);
      if (enter > exit) { intersects = false; break; }
    }
    if (!intersects || exit < 0 || enter > 1) continue;
    const progress = Math.max(0, Math.min(1, enter));
    if (earliest && progress >= earliest.progress) continue;
    earliest = {
      point: { x: start.x + dx * progress, y: start.y + dy * progress },
      progress,
      coverIndex,
    };
  }

  return earliest;
}
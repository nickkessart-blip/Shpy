export interface Point { x: number; y: number }
export interface Rect { x: number; y: number; width: number; height: number }

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function pointInRect(point: Point, rect: Rect): boolean {
  return point.x >= rect.x && point.x <= rect.x + rect.width
    && point.y >= rect.y && point.y <= rect.y + rect.height;
}

export function segmentIntersectsRect(start: Point, end: Point, rect: Rect): boolean {
  let tMin = 0;
  let tMax = 1;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const edges = [
    [-dx, start.x - rect.x],
    [dx, rect.x + rect.width - start.x],
    [-dy, start.y - rect.y],
    [dy, rect.y + rect.height - start.y],
  ];

  for (const [p, q] of edges) {
    if (Math.abs(p) < 1e-9) {
      if (q < 0) return false;
      continue;
    }
    const t = q / p;
    if (p < 0) tMin = Math.max(tMin, t);
    else tMax = Math.min(tMax, t);
    if (tMin > tMax) return false;
  }
  return true;
}

export function isShotBlocked(muzzle: Point, target: Point, covers: Rect[]): boolean {
  return covers.some((cover) => segmentIntersectsRect(muzzle, target, cover));
}

export function resolveHit(
  aim: Point,
  head: Point,
  body: Point,
  headRadius: number,
  bodyRadius: number,
): 'head' | 'body' | null {
  if (distance(aim, head) <= headRadius) return 'head';
  if (distance(aim, body) <= bodyRadius) return 'body';
  return null;
}

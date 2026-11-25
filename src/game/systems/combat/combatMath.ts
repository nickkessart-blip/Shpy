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

export function findVisiblePeekX(muzzle: Point, cover: Rect, padding = 70): number {
  return muzzle.x < cover.x ? cover.x - padding : cover.x + cover.width + padding;
}

export function isShotBlocked(muzzle: Point, target: Point, covers: readonly Rect[]): boolean {
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


export type AimFeedbackState = 'none' | 'clear' | 'blocked';
export interface AimFeedbackTarget {
  head: Point;
  body: Point;
  headRadius: number;
  bodyRadius: number;
}

/** Reports whether the current reticle is over a target and whether cover blocks the shot. */
export function getAimFeedbackState(aim: Point, muzzle: Point,
  targets: readonly AimFeedbackTarget[], covers: readonly Rect[]): AimFeedbackState {
  let clearTarget = false;
  let blockedTarget = false;
  for (const target of targets) {
    const part = resolveHit(aim, target.head, target.body, target.headRadius, target.bodyRadius);
    if (!part) continue;
    const point = part === 'head' ? target.head : target.body;
    if (isShotBlocked(muzzle, point, covers)) blockedTarget = true;
    else clearTarget = true;
  }
  return clearTarget ? 'clear' : blockedTarget ? 'blocked' : 'none';
}

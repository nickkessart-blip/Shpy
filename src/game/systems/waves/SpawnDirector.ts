import type { EnemyType } from '../../data/enemies';
import type { CoverDefinition, SpawnPoint } from '../../data/missions';

export interface PlannedEnemySpawn {
  type: EnemyType;
  spawn: SpawnPoint;
  entryDelayMs: number;
}

export interface SpawnDirectorOptions {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minSeparation: number;
  relaxedSeparation: number;
  coverPadding: number;
  entranceStaggerMs: number;
}

const DEFAULT_OPTIONS: SpawnDirectorOptions = {
  minX: 120,
  maxX: 1160,
  minY: 285,
  maxY: 390,
  minSeparation: 135,
  relaxedSeparation: 105,
  coverPadding: 64,
  entranceStaggerMs: 220,
};


function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(values: T[], random: () => number): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

function insideExpandedCover(
  point: SpawnPoint,
  covers: CoverDefinition[],
  padding: number,
): boolean {
  return covers.some((cover) => point.x >= cover.x - padding
    && point.x <= cover.x + cover.width + padding
    && point.y >= cover.y - padding
    && point.y <= cover.y + cover.height + padding);
}

function attachNearestCover(point: SpawnPoint, covers: CoverDefinition[]): SpawnPoint {
  if (point.coverId) {
    return covers.some((cover) => cover.id === point.coverId)
      ? point : { x: point.x, y: point.y };
  }
  const nearest = covers
    .filter((cover) => point.y < cover.y && point.x >= cover.x - 150
      && point.x <= cover.x + cover.width + 150)
    .map((cover) => ({
      id: cover.id,
      distance: Math.abs(point.x - (cover.x + cover.width / 2)),
    }))
    .sort((a, b) => a.distance - b.distance)[0];
  return nearest ? { ...point, coverId: nearest.id } : point;
}

function buildCandidates(
  authored: SpawnPoint[],
  covers: CoverDefinition[],
  options: SpawnDirectorOptions,
  random: () => number,
): SpawnPoint[] {
  const points: SpawnPoint[] = [...authored];
  const laneXs = [150, 300, 450, 640, 830, 980, 1130];
  const laneYs = [315, 350, 385];

  for (const x of laneXs) {
    for (const y of laneYs) points.push({ x, y });
  }

  // Small variations around authored lanes prevent identical wave silhouettes.
  for (const point of authored) {
    for (const offsetX of [-78, -39, 39, 78]) {
      for (const offsetY of [-12, 12]) {
        points.push({ x: point.x + offsetX, y: point.y + offsetY, coverId: point.coverId });
      }
    }
  }

  const unique = new Map<string, SpawnPoint>();
  for (const raw of points) {
    if (!Number.isFinite(raw.x) || !Number.isFinite(raw.y)) continue;
    if (raw.x < options.minX || raw.x > options.maxX || raw.y < options.minY || raw.y > options.maxY) continue;
    const point = attachNearestCover(raw, covers);
    if (insideExpandedCover(point, covers, options.coverPadding)) continue;
    const key = Math.round(point.x) + ':' + Math.round(point.y);
    if (!unique.has(key)) unique.set(key, point);
  }

  return shuffle([...unique.values()], random);
}

function distance(a: SpawnPoint, b: SpawnPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Creates a reproducible, spaced spawn plan. The authored enemy roster is
 * preserved; only entrance order, lane assignment and timing vary per run.
 */
export function planEnemyWave(
  enemies: EnemyType[],
  authoredSpawns: SpawnPoint[],
  covers: CoverDefinition[],
  seed: number,
  overrides: Partial<SpawnDirectorOptions> = {},
): PlannedEnemySpawn[] {
  if (!Number.isFinite(seed)) throw new RangeError('seed must be finite');
  if (enemies.length === 0) return [];

  const options = { ...DEFAULT_OPTIONS, ...overrides };
  if (options.minSeparation <= 0 || options.relaxedSeparation <= 0
    || options.relaxedSeparation > options.minSeparation
    || options.entranceStaggerMs < 0) {
    throw new RangeError('invalid SpawnDirector options');
  }

  const random = seededRandom(seed);
  if (enemies.length === 1) {
    const preferred = authoredSpawns.find((point) => (
      point.x >= options.minX && point.x <= options.maxX
      && point.y >= options.minY && point.y <= options.maxY
      && !insideExpandedCover(point, covers, options.coverPadding)
    ));
    if (preferred) {
      return [{ type: enemies[0], spawn: attachNearestCover(preferred, covers), entryDelayMs: 0 }];
    }
  }
  const order = shuffle(enemies, random);
  const candidates = buildCandidates(authoredSpawns, covers, options, random);
  const selected: SpawnPoint[] = [];
  const plan: PlannedEnemySpawn[] = [];

  for (const type of order) {
    const remaining = candidates.filter((candidate) => !selected.some((point) => (
      point.x === candidate.x && point.y === candidate.y
    )));
    if (remaining.length === 0) throw new RangeError('not enough valid spawn lanes for this wave');

    const spaced = remaining.filter((candidate) => selected.every((point) => (
      distance(candidate, point) >= options.minSeparation
    )));
    const relaxed = spaced.length > 0 ? spaced : remaining.filter((candidate) => selected.every((point) => (
      distance(candidate, point) >= options.relaxedSeparation
    )));
    const pool = relaxed.length > 0 ? relaxed : remaining;
    const ranked = pool.map((candidate) => ({
      candidate,
      spacing: selected.length === 0 ? Number.POSITIVE_INFINITY
        : Math.min(...selected.map((point) => distance(candidate, point))),
    }));
    const bestSpacing = Math.max(...ranked.map((item) => item.spacing));
    const best = ranked.filter((item) => item.spacing === bestSpacing);
    const chosen = best[Math.floor(random() * best.length)].candidate;
    selected.push(chosen);
    plan.push({
      type,
      spawn: { x: chosen.x, y: chosen.y, ...(chosen.coverId ? { coverId: chosen.coverId } : {}) },
      entryDelayMs: plan.length === 0 ? 0
        : plan.length * options.entranceStaggerMs + Math.floor(random() * 90),
    });
  }

  return plan;
}

/** Smooth, deterministic horizontal entrance from a route edge into a lane. */
export function sampleSpawnEntryX(startX: number, targetX: number, elapsedMs: number, durationMs: number): number {
  if (![startX, targetX, elapsedMs, durationMs].every(Number.isFinite) || durationMs < 0) {
    throw new RangeError('spawn entry values must be finite and duration non-negative');
  }
  if (durationMs === 0) return targetX;
  const progress = Math.max(0, Math.min(1, elapsedMs / durationMs));
  const eased = 1 - Math.pow(1 - progress, 3);
  return startX + (targetX - startX) * eased;
}

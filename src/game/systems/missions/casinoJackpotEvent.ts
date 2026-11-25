import type { EnemyType } from '../../data/enemies';

export type CasinoJackpotPhase = 'idle' | 'warning' | 'flash' | 'recovery';
export type CasinoJackpotRoomId = 'casino-main' | 'casino-bar';

export interface CasinoJackpotEventState {
  phase: CasinoJackpotPhase;
  cycleIndex: number;
  laneIndex: 0 | 1 | 2;
  centerX: number;
  sweepOffset: number;
  phaseProgress: number;
  intensity: number;
}

export const CASINO_JACKPOT_CYCLE_MS = 15_000;
export const CASINO_JACKPOT_WARNING_START_MS = 2_300;
export const CASINO_JACKPOT_WARNING_MS = 900;
export const CASINO_JACKPOT_FLASH_MS = 420;
export const CASINO_JACKPOT_RECOVERY_MS = 900;

const LANE_CENTRES = [300, 640, 980] as const;
export type CasinoJackpotEnemyState = 'Entering' | 'Exposed' | 'Aiming' | 'Attacking' | 'SeekingCover' | 'Hidden' | 'Peeking' | 'Repositioning' | 'Defeated';

const DISTRACTION_MS: Record<EnemyType, number> = {
  guard: 1350,
  assault: 900,
  armored: 420,
  boss: 0,
};

export function getCasinoJackpotDistractionMs(type: EnemyType): number {
  return DISTRACTION_MS[type];
}

/** Only stationary combat states can be interrupted; active movement tweens are never frozen mid-path. */
export function canCasinoJackpotDistract(type: EnemyType, state: CasinoJackpotEnemyState): boolean {
  return DISTRACTION_MS[type] > 0
    && (state === 'Exposed' || state === 'Aiming' || state === 'Attacking' || state === 'Peeking');
}

/** Deterministic slot-jackpot cue; its flash is a temporary distraction, not damage. */
export function sampleCasinoJackpotEvent(elapsedMs: number, roomId: CasinoJackpotRoomId): CasinoJackpotEventState {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
    throw new RangeError('Casino jackpot elapsed time must be finite and non-negative');
  }
  if (roomId !== 'casino-main' && roomId !== 'casino-bar') {
    throw new RangeError('unknown Casino room');
  }
  const cycleIndex = Math.floor(elapsedMs / CASINO_JACKPOT_CYCLE_MS);
  const cycleTime = elapsedMs % CASINO_JACKPOT_CYCLE_MS;
  const roomOffset = roomId === 'casino-bar' ? 2 : 0;
  const laneIndex = ((cycleIndex + roomOffset) % 3) as 0 | 1 | 2;
  const centerX = LANE_CENTRES[laneIndex];
  const warningEnd = CASINO_JACKPOT_WARNING_START_MS + CASINO_JACKPOT_WARNING_MS;
  const flashEnd = warningEnd + CASINO_JACKPOT_FLASH_MS;
  const recoveryEnd = flashEnd + CASINO_JACKPOT_RECOVERY_MS;

  if (cycleTime < CASINO_JACKPOT_WARNING_START_MS || cycleTime >= recoveryEnd) {
    return { phase: 'idle', cycleIndex, laneIndex, centerX, sweepOffset: 0, phaseProgress: 0, intensity: 0 };
  }
  if (cycleTime < warningEnd) {
    const phaseProgress = (cycleTime - CASINO_JACKPOT_WARNING_START_MS) / CASINO_JACKPOT_WARNING_MS;
    return {
      phase: 'warning', cycleIndex, laneIndex, centerX,
      sweepOffset: -32 + phaseProgress * 64, phaseProgress,
      intensity: 0.7 + Math.sin(phaseProgress * Math.PI * 4) * 0.16,
    };
  }
  if (cycleTime < flashEnd) {
    const phaseProgress = (cycleTime - warningEnd) / CASINO_JACKPOT_FLASH_MS;
    return {
      phase: 'flash', cycleIndex, laneIndex, centerX,
      sweepOffset: 32 - phaseProgress * 18, phaseProgress,
      intensity: 1 - phaseProgress * 0.16,
    };
  }
  const phaseProgress = (cycleTime - flashEnd) / CASINO_JACKPOT_RECOVERY_MS;
  return {
    phase: 'recovery', cycleIndex, laneIndex, centerX,
    sweepOffset: 14 * (1 - phaseProgress), phaseProgress,
    intensity: 1 - phaseProgress,
  };
}
export type CasinoLightPhase = 'idle' | 'warning' | 'flash' | 'recovery';
export type CasinoRoomId = 'casino-main' | 'casino-bar';

export interface CasinoLightEventState {
  phase: CasinoLightPhase;
  cycleIndex: number;
  laneIndex: 0 | 1 | 2;
  centerX: number;
  sweepOffset: number;
  phaseProgress: number;
  intensity: number;
}

export const CASINO_LIGHT_CYCLE_MS = 10_000;
export const CASINO_LIGHT_WARNING_START_MS = 4_800;
export const CASINO_LIGHT_WARNING_MS = 1_100;
export const CASINO_LIGHT_FLASH_MS = 620;
export const CASINO_LIGHT_RECOVERY_MS = 780;

const LANE_CENTRES = [300, 640, 980] as const;

/** Deterministic room light cue: warns, sweeps a lane, flashes locally, then recovers. */
export function sampleCasinoLightEvent(elapsedMs: number, roomId: CasinoRoomId): CasinoLightEventState {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
    throw new RangeError('casino light elapsed time must be finite and non-negative');
  }
  if (roomId !== 'casino-main' && roomId !== 'casino-bar') {
    throw new RangeError('unknown Casino room');
  }
  const cycleIndex = Math.floor(elapsedMs / CASINO_LIGHT_CYCLE_MS);
  const cycleTime = elapsedMs % CASINO_LIGHT_CYCLE_MS;
  const roomOffset = roomId === 'casino-bar' ? 1 : 0;
  const laneIndex = ((cycleIndex + roomOffset) % 3) as 0 | 1 | 2;
  const centerX = LANE_CENTRES[laneIndex];
  const warningEnd = CASINO_LIGHT_WARNING_START_MS + CASINO_LIGHT_WARNING_MS;
  const flashEnd = warningEnd + CASINO_LIGHT_FLASH_MS;
  const recoveryEnd = flashEnd + CASINO_LIGHT_RECOVERY_MS;

  if (cycleTime < CASINO_LIGHT_WARNING_START_MS || cycleTime >= recoveryEnd) {
    return { phase: 'idle', cycleIndex, laneIndex, centerX, sweepOffset: 0, phaseProgress: 0, intensity: 0 };
  }
  if (cycleTime < warningEnd) {
    const phaseProgress = (cycleTime - CASINO_LIGHT_WARNING_START_MS) / CASINO_LIGHT_WARNING_MS;
    return {
      phase: 'warning', cycleIndex, laneIndex, centerX,
      sweepOffset: -54 + phaseProgress * 108, phaseProgress,
      intensity: 0.62 + Math.sin(phaseProgress * Math.PI * 4) * 0.18,
    };
  }
  if (cycleTime < flashEnd) {
    const phaseProgress = (cycleTime - warningEnd) / CASINO_LIGHT_FLASH_MS;
    return {
      phase: 'flash', cycleIndex, laneIndex, centerX,
      sweepOffset: 54 - phaseProgress * 28, phaseProgress,
      intensity: 1 - phaseProgress * 0.18,
    };
  }
  const phaseProgress = (cycleTime - flashEnd) / CASINO_LIGHT_RECOVERY_MS;
  return {
    phase: 'recovery', cycleIndex, laneIndex, centerX,
    sweepOffset: 26 * (1 - phaseProgress), phaseProgress,
    intensity: 1 - phaseProgress,
  };
}
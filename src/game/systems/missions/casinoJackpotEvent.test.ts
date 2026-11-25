import { describe, expect, it } from 'vitest';
import {
  CASINO_JACKPOT_CYCLE_MS,
  CASINO_JACKPOT_FLASH_MS,
  CASINO_JACKPOT_RECOVERY_MS,
  CASINO_JACKPOT_WARNING_MS,
  CASINO_JACKPOT_WARNING_START_MS,
  getCasinoJackpotDistractionMs,
  sampleCasinoJackpotEvent,
} from './casinoJackpotEvent';

describe('Casino slot-machine jackpot sequence', () => {
  it('stays quiet before its warning', () => {
    expect(sampleCasinoJackpotEvent(0, 'casino-main').phase).toBe('idle');
    expect(sampleCasinoJackpotEvent(CASINO_JACKPOT_WARNING_START_MS - 1, 'casino-main').phase).toBe('idle');
  });

  it('runs warning, flash and recovery at exact boundaries', () => {
    expect(sampleCasinoJackpotEvent(CASINO_JACKPOT_WARNING_START_MS, 'casino-main'))
      .toMatchObject({ phase: 'warning', phaseProgress: 0 });
    const flashAt = CASINO_JACKPOT_WARNING_START_MS + CASINO_JACKPOT_WARNING_MS;
    expect(sampleCasinoJackpotEvent(flashAt, 'casino-main')).toMatchObject({ phase: 'flash', phaseProgress: 0 });
    const recoveryAt = flashAt + CASINO_JACKPOT_FLASH_MS;
    expect(sampleCasinoJackpotEvent(recoveryAt, 'casino-main')).toMatchObject({ phase: 'recovery', phaseProgress: 0 });
    expect(sampleCasinoJackpotEvent(recoveryAt + CASINO_JACKPOT_RECOVERY_MS, 'casino-main').phase).toBe('idle');
  });

  it('rotates lanes each cycle and uses a distinct initial bar lane', () => {
    expect(sampleCasinoJackpotEvent(3000, 'casino-main')).toMatchObject({ laneIndex: 0, centerX: 300 });
    expect(sampleCasinoJackpotEvent(3000, 'casino-bar')).toMatchObject({ laneIndex: 2, centerX: 980 });
    expect(sampleCasinoJackpotEvent(CASINO_JACKPOT_CYCLE_MS + 3000, 'casino-main'))
      .toMatchObject({ laneIndex: 1, centerX: 640, cycleIndex: 1 });
    expect(sampleCasinoJackpotEvent(CASINO_JACKPOT_CYCLE_MS * 2 + 3000, 'casino-main'))
      .toMatchObject({ laneIndex: 2, centerX: 980, cycleIndex: 2 });
  });

  it('uses short, archetype-specific distraction windows and keeps the boss immune', () => {
    expect(getCasinoJackpotDistractionMs('guard')).toBe(1350);
    expect(getCasinoJackpotDistractionMs('assault')).toBe(900);
    expect(getCasinoJackpotDistractionMs('armored')).toBe(420);
    expect(getCasinoJackpotDistractionMs('boss')).toBe(0);
  });

  it('stays inactive during the rest interval', () => {
    expect(sampleCasinoJackpotEvent(CASINO_JACKPOT_CYCLE_MS - 1, 'casino-main'))
      .toMatchObject({ phase: 'idle', intensity: 0 });
  });

  it('rejects invalid timing and non-Casino room IDs', () => {
    expect(() => sampleCasinoJackpotEvent(Number.NaN, 'casino-main')).toThrow(RangeError);
    expect(() => sampleCasinoJackpotEvent(-1, 'casino-main')).toThrow(RangeError);
    expect(() => sampleCasinoJackpotEvent(3000, 'east-express' as 'casino-main')).toThrow(RangeError);
  });
});
import { describe, expect, it } from 'vitest';
import {
  CASINO_LIGHT_CYCLE_MS,
  CASINO_LIGHT_FLASH_MS,
  CASINO_LIGHT_RECOVERY_MS,
  CASINO_LIGHT_WARNING_MS,
  CASINO_LIGHT_WARNING_START_MS,
  sampleCasinoLightEvent,
} from './casinoLightEvent';

describe('Casino signature lighting event', () => {
  it('stays quiet before the first warning', () => {
    expect(sampleCasinoLightEvent(0, 'casino-main').phase).toBe('idle');
    expect(sampleCasinoLightEvent(CASINO_LIGHT_WARNING_START_MS - 1, 'casino-main').phase).toBe('idle');
  });
  it('runs warning, flash and recovery at exact deterministic boundaries', () => {
    const warning = sampleCasinoLightEvent(CASINO_LIGHT_WARNING_START_MS, 'casino-main');
    expect(warning.phase).toBe('warning');
    expect(warning.phaseProgress).toBe(0);
    const flashTime = CASINO_LIGHT_WARNING_START_MS + CASINO_LIGHT_WARNING_MS;
    expect(sampleCasinoLightEvent(flashTime, 'casino-main').phase).toBe('flash');
    const recoveryTime = flashTime + CASINO_LIGHT_FLASH_MS;
    expect(sampleCasinoLightEvent(recoveryTime, 'casino-main').phase).toBe('recovery');
    expect(sampleCasinoLightEvent(recoveryTime + CASINO_LIGHT_RECOVERY_MS, 'casino-main').phase).toBe('idle');
  });
  it('alternates the spotlight across lanes and offsets the bar by one lane', () => {
    expect(sampleCasinoLightEvent(5000, 'casino-main')).toMatchObject({ laneIndex: 0, centerX: 300 });
    expect(sampleCasinoLightEvent(5000, 'casino-bar')).toMatchObject({ laneIndex: 1, centerX: 640 });
    expect(sampleCasinoLightEvent(CASINO_LIGHT_CYCLE_MS + 5000, 'casino-main'))
      .toMatchObject({ laneIndex: 1, centerX: 640, cycleIndex: 1 });
    expect(sampleCasinoLightEvent(CASINO_LIGHT_CYCLE_MS * 2 + 5000, 'casino-main'))
      .toMatchObject({ laneIndex: 2, centerX: 980, cycleIndex: 2 });
  });
  it('stays inactive during the rest interval', () => {
    expect(sampleCasinoLightEvent(CASINO_LIGHT_CYCLE_MS - 1, 'casino-main'))
      .toMatchObject({ phase: 'idle', intensity: 0 });
  });
  it('rejects invalid elapsed time and non-Casino room identifiers', () => {
    expect(() => sampleCasinoLightEvent(Number.NaN, 'casino-main')).toThrow(RangeError);
    expect(() => sampleCasinoLightEvent(-1, 'casino-main')).toThrow(RangeError);
    expect(() => sampleCasinoLightEvent(5000, 'east-express' as 'casino-main')).toThrow(RangeError);
  });
});
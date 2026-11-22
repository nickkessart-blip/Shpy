import { describe, expect, it } from 'vitest';
import { BALANCE } from './balance';
import { ENEMIES } from './enemies';
import { CASINO_MISSION } from './missions';

describe('casino mission data', () => {
  it.each(CASINO_MISSION)('$id has valid waves and spawn points', (scene) => {
    expect(scene.waves).toHaveLength(scene.id === 'casino-bar' ? 6 : 5);
    for (const wave of scene.waves) {
      expect(wave.enemies.length).toBeGreaterThan(0);
      expect(wave.spawnPoints).toHaveLength(wave.enemies.length);
      for (const enemy of wave.enemies) expect(ENEMIES[enemy]).toBeDefined();
      for (const spawn of wave.spawnPoints) {
        expect(spawn.x).toBeGreaterThan(0); expect(spawn.x).toBeLessThan(1280);
        expect(spawn.y).toBeGreaterThan(0); expect(spawn.y).toBeLessThan(720);
        if (spawn.coverId) expect(scene.covers.some((cover) => cover.id === spawn.coverId)).toBe(true);
      }
    }
  });
  it('ends the casino operation with a dedicated boss encounter', () => {
    const finalWave = CASINO_MISSION[CASINO_MISSION.length - 1].waves.at(-1);
    expect(finalWave?.enemies).toEqual(['boss']);
    expect(ENEMIES.boss.hp).toBeGreaterThan(ENEMIES.armored.hp);
  });
  it('uses unique location identifiers', () => {
    expect(new Set(CASINO_MISSION.map((scene) => scene.id)).size).toBe(CASINO_MISSION.length);
  });
  it('never lets a standard enemy die to one headshot, even with max damage upgrades', () => {
    const maxHeadDamage = BALANCE.weapon.damage[4] * BALANCE.weapon.headMultiplier[4];
    for (const type of ['guard', 'assault', 'armored'] as const) expect(maxHeadDamage).toBeLessThan(ENEMIES[type].hp);
  });
});

import { describe, expect, it } from 'vitest';
import { ENEMIES } from './enemies';
import { CASINO_MISSION } from './missions';

describe('casino mission data', () => {
  it.each(CASINO_MISSION)('$id has five valid waves', (scene) => {
    expect(scene.waves).toHaveLength(5);
    for (const wave of scene.waves) {
      expect(wave.enemies.length).toBeGreaterThan(0);
      expect(wave.spawnPoints).toHaveLength(wave.enemies.length);
      for (const enemy of wave.enemies) expect(ENEMIES[enemy]).toBeDefined();
      for (const spawn of wave.spawnPoints) {
        expect(spawn.x).toBeGreaterThan(0);
        expect(spawn.x).toBeLessThan(1280);
        expect(spawn.y).toBeGreaterThan(0);
        expect(spawn.y).toBeLessThan(720);
        if (spawn.coverId) {
          expect(scene.covers.some((cover) => cover.id === spawn.coverId)).toBe(true);
        }
      }
    }
  });

  it('uses unique location identifiers so transitions cannot target the same room', () => {
    expect(new Set(CASINO_MISSION.map((scene) => scene.id)).size).toBe(CASINO_MISSION.length);
  });
});

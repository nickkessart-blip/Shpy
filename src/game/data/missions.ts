import type { EnemyType } from './enemies';

export interface SpawnPoint { x: number; y: number; coverId?: string }
export interface CoverDefinition { id: string; x: number; y: number; width: number; height: number }
export interface WaveDefinition { enemies: EnemyType[]; spawnPoints: SpawnPoint[] }
export interface MissionSceneDefinition {
  id: string;
  title: string;
  subtitle: string;
  backgroundSlot: 'backgrounds/casino-main' | 'backgrounds/casino-bar';
  covers: CoverDefinition[];
  waves: WaveDefinition[];
}

/**
 * Each location is a combat stop on the route. Five waves are cleared before
 * the agent automatically walks to the next area; the Phaser scene stays alive.
 */
export const CASINO_MISSION: MissionSceneDefinition[] = [
  {
    id: 'casino-main', title: 'Казино «Рояль»', subtitle: 'ГЛАВНЫЙ ЗАЛ',
    backgroundSlot: 'backgrounds/casino-main',
    covers: [
      { id: 'table-left', x: 250, y: 420, width: 260, height: 94 },
      { id: 'table-right', x: 850, y: 420, width: 185, height: 94 },
    ],
    waves: [
      { enemies: ['guard', 'guard'], spawnPoints: [{ x: 365, y: 350, coverId: 'table-left' }, { x: 900, y: 345, coverId: 'table-right' }] },
      { enemies: ['guard', 'assault'], spawnPoints: [{ x: 545, y: 330, coverId: 'table-left' }, { x: 770, y: 345, coverId: 'table-right' }] },
      { enemies: ['armored', 'guard'], spawnPoints: [{ x: 390, y: 350, coverId: 'table-left' }, { x: 920, y: 350, coverId: 'table-right' }] },
      { enemies: ['assault', 'guard', 'guard'], spawnPoints: [{ x: 350, y: 345, coverId: 'table-left' }, { x: 930, y: 340, coverId: 'table-right' }, { x: 640, y: 310 }] },
      { enemies: ['armored', 'assault', 'guard'], spawnPoints: [{ x: 545, y: 340, coverId: 'table-left' }, { x: 770, y: 340, coverId: 'table-right' }, { x: 640, y: 300 }] },
    ],
  },
  {
    id: 'casino-bar', title: 'Операция «Рояль»', subtitle: 'БАР И VIP-ПРОХОД',
    backgroundSlot: 'backgrounds/casino-bar',
    covers: [
      { id: 'bar-left-table', x: 280, y: 430, width: 170, height: 84 },
      { id: 'bar-counter', x: 720, y: 425, width: 180, height: 100 },
      { id: 'bar-right-table', x: 1020, y: 430, width: 150, height: 84 },
    ],
    waves: [
      { enemies: ['armored', 'guard'], spawnPoints: [{ x: 560, y: 340, coverId: 'bar-counter' }, { x: 1080, y: 345, coverId: 'bar-right-table' }] },
      { enemies: ['assault', 'guard'], spawnPoints: [{ x: 380, y: 345, coverId: 'bar-left-table' }, { x: 960, y: 345, coverId: 'bar-right-table' }] },
      { enemies: ['armored', 'assault'], spawnPoints: [{ x: 560, y: 340, coverId: 'bar-counter' }, { x: 380, y: 345, coverId: 'bar-left-table' }] },
      { enemies: ['assault', 'guard', 'guard'], spawnPoints: [{ x: 380, y: 345, coverId: 'bar-left-table' }, { x: 800, y: 340, coverId: 'bar-counter' }, { x: 1080, y: 345, coverId: 'bar-right-table' }] },
      { enemies: ['armored', 'assault', 'assault'], spawnPoints: [{ x: 560, y: 340, coverId: 'bar-counter' }, { x: 380, y: 345, coverId: 'bar-left-table' }, { x: 1080, y: 345, coverId: 'bar-right-table' }] },
    ],
  },
];

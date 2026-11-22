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
    ],
  },
  {
    id: 'casino-bar', title: 'Операция «Рояль»', subtitle: 'БАР И VIP-ПРОХОД',
    backgroundSlot: 'backgrounds/casino-bar',
    covers: [
      { id: 'bar-counter', x: 720, y: 425, width: 180, height: 100 },
    ],
    waves: [
      { enemies: ['armored', 'guard'], spawnPoints: [{ x: 560, y: 340, coverId: 'bar-counter' }, { x: 825, y: 355, coverId: 'bar-counter' }] },
      { enemies: ['assault', 'guard'], spawnPoints: [{ x: 400, y: 345, coverId: 'bar-counter' }, { x: 890, y: 345, coverId: 'bar-counter' }] },
    ],
  },
];

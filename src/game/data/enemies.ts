export type EnemyType = 'guard' | 'armored' | 'assault' | 'boss';
export interface EnemyDefinition {
  id: EnemyType; name: string; hp: number; damage: number;
  exposeMs: number; aimMs: number; hiddenMs: number; peekMs: number;
  color: number; description: string;
}
export const ENEMIES: Record<EnemyType, EnemyDefinition> = {
  guard: { id: 'guard', name: 'Охранник', hp: 5, damage: 8, exposeMs: 750, aimMs: 1050, hiddenMs: 1150, peekMs: 950, color: 0x91a6b8, description: 'Базовый противник. Держит позицию и пользуется укрытием.' },
  armored: { id: 'armored', name: 'Бронированный', hp: 12, damage: 13, exposeMs: 1050, aimMs: 1350, hiddenMs: 900, peekMs: 800, color: 0xd18b4a, description: 'Высокая прочность, медленное перемещение.' },
  assault: { id: 'assault', name: 'Штурмовик', hp: 8, damage: 10, exposeMs: 420, aimMs: 820, hiddenMs: 700, peekMs: 600, color: 0xc95e5e, description: 'Часто меняет позицию и быстро готовит атаку.' },
  boss: { id: 'boss', name: 'Начальник охраны', hp: 42, damage: 18, exposeMs: 820, aimMs: 1750, hiddenMs: 0, peekMs: 0, color: 0xe0b66f, description: 'Босс казино. Ускоряет атаки и меняет позицию на каждой фазе.' },
};

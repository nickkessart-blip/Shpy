export type CosmeticId =
  | 'hero-standard' | 'hero-night' | 'hero-burgundy'
  | 'weapon-standard' | 'weapon-graphite' | 'weapon-crimson';

export interface CosmeticDefinition {
  id: CosmeticId;
  category: 'hero' | 'weapon';
  name: string;
  description: string;
  componentCost: number;
  tint: number;
}

export interface CosmeticLoadout {
  unlocked: CosmeticId[];
  heroSkinId: CosmeticId;
  weaponSkinId: CosmeticId;
}

export const COSMETICS: readonly CosmeticDefinition[] = [
  {
    id: 'hero-standard', category: 'hero', name: 'ШТАТНАЯ ФОРМА',
    description: 'Стандартная экипировка агентства.', componentCost: 0, tint: 0x263441,
  },
  {
    id: 'hero-night', category: 'hero', name: 'НОЧНОЙ ОПЕРАТИВНИК',
    description: 'Тёмная полевая форма с холодным акцентом.', componentCost: 45, tint: 0x24485a,
  },
  {
    id: 'hero-burgundy', category: 'hero', name: 'КРАСНЫЙ ПРОТОКОЛ',
    description: 'Бордовая форма для тех, кто не любит сливаться с мебелью.', componentCost: 65, tint: 0x65343d,
  },
  {
    id: 'weapon-standard', category: 'weapon', name: 'СЛУЖЕБНАЯ ОТДЕЛКА',
    description: 'Заводской вид оружия.', componentCost: 0, tint: 0x56616c,
  },
  {
    id: 'weapon-graphite', category: 'weapon', name: 'МАТОВЫЙ ГРАФИТ',
    description: 'Тёмное матовое покрытие.', componentCost: 30, tint: 0x303943,
  },
  {
    id: 'weapon-crimson', category: 'weapon', name: 'КРАСНАЯ ЛИНИЯ',
    description: 'Тёмная отделка с бордовым акцентом.', componentCost: 50, tint: 0x9c3d45,
  },
] as const;

export const DEFAULT_COSMETICS: CosmeticLoadout = {
  unlocked: ['hero-standard', 'weapon-standard'],
  heroSkinId: 'hero-standard',
  weaponSkinId: 'weapon-standard',
};

export function getCosmetic(id: CosmeticId): CosmeticDefinition {
  return COSMETICS.find((cosmetic) => cosmetic.id === id) ?? COSMETICS[0];
}

export function normalizeCosmetics(value: unknown): CosmeticLoadout {
  if (!value || typeof value !== 'object') return structuredClone(DEFAULT_COSMETICS);
  const raw = value as { unlocked?: unknown; heroSkinId?: unknown; weaponSkinId?: unknown };
  const unlocked = Array.isArray(raw.unlocked)
    ? raw.unlocked.filter((id): id is CosmeticId =>
      typeof id === 'string' && COSMETICS.some((cosmetic) => cosmetic.id === id))
    : [];
  if (!unlocked.includes('hero-standard')) unlocked.push('hero-standard');
  if (!unlocked.includes('weapon-standard')) unlocked.push('weapon-standard');
  const heroSkinId = typeof raw.heroSkinId === 'string'
    && unlocked.includes(raw.heroSkinId as CosmeticId)
    && getCosmetic(raw.heroSkinId as CosmeticId).category === 'hero'
      ? raw.heroSkinId as CosmeticId
      : 'hero-standard';
  const weaponSkinId = typeof raw.weaponSkinId === 'string'
    && unlocked.includes(raw.weaponSkinId as CosmeticId)
    && getCosmetic(raw.weaponSkinId as CosmeticId).category === 'weapon'
      ? raw.weaponSkinId as CosmeticId
      : 'weapon-standard';
  return { unlocked: [...new Set(unlocked)], heroSkinId, weaponSkinId };
}

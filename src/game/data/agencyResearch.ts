export type AgencyResearchId = 'intelNetwork' | 'logistics' | 'training';

export interface AgencyResearchDefinition {
  id: AgencyResearchId;
  title: string;
  description: string;
  costs: readonly number[];
  effect: (level: number) => string;
}

export const AGENCY_RESEARCH: readonly AgencyResearchDefinition[] = [
  { id: 'intelNetwork', title: 'СЕТЬ ИНФОРМАТОРОВ',
    description: 'Разведданные повышают вероятность успеха операций оперативников.',
    costs: [0, 40, 90, 160], effect: (level) => '+' + level * 5 + '% к шансу успеха' },
  { id: 'logistics', title: 'ЛОГИСТИЧЕСКИЙ ОТДЕЛ',
    description: 'Оптимизация маршрутов сокращает время возвращения отрядов.',
    costs: [0, 60, 130], effect: '−' + levelPercent(0) },
  { id: 'training', title: 'УЧЕБНЫЙ ЦЕНТР',
    description: 'Регулярная подготовка ускоряет рост опыта оперативников.',
    costs: [0, 50, 110], effect: (level) => '+' + level * 20 + '% к опыту оперативников' },
] as const;

function levelPercent(level: number): string { return level * 10 + '% времени'; }

export const DEFAULT_AGENCY_RESEARCH: Record<AgencyResearchId, number> = {
  intelNetwork: 0, logistics: 0, training: 0,
};

export function normalizeAgencyResearch(value: unknown): Record<AgencyResearchId, number> {
  const record = value && typeof value === 'object'
    ? value as Partial<Record<AgencyResearchId, unknown>> : {};
  return {
    intelNetwork: clamp(record.intelNetwork, AGENCY_RESEARCH[0].costs.length - 1),
    logistics: clamp(record.logistics, AGENCY_RESEARCH[1].costs.length - 1),
    training: clamp(record.training, AGENCY_RESEARCH[2].costs.length - 1),
  };
}

function clamp(value: unknown, max: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(max, Math.floor(value))) : 0;
}

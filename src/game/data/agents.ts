export type AgentRole = 'scout' | 'engineer' | 'infiltrator' | 'assault';
export type AgentMissionId = 'recon' | 'supply' | 'sabotage';

export interface AgentCandidate {
  id: string;
  name: string;
  codename: string;
  role: AgentRole;
  description: string;
  recruitCost: number;
  unlockLevel: number;
}

export interface AgencyAgent {
  id: string;
  level: number;
  xp: number;
}

export interface AgentMissionDefinition {
  id: AgentMissionId;
  title: string;
  briefing: string;
  unlockLevel: number;
  minimumAgents: number;
  maximumAgents: number;
  durationMs: number;
  baseSuccessChance: number;
  componentReward: number;
  agentXpReward: number;
  favoredRole: AgentRole;
}

export interface AgentMissionRun {
  id: string;
  missionId: AgentMissionId;
  agentIds: string[];
  startedAt: number;
  completesAt: number;
  success: boolean;
  successChance: number;
}

export interface AgentMissionReport {
  id: string;
  missionId: AgentMissionId;
  success: boolean;
  componentsEarned: number;
  agentXpEarned: number;
  completedAt: number;
}

export const AGENT_CANDIDATES: readonly AgentCandidate[] = [
  {
    id: 'fox',
    name: 'Ирина',
    codename: 'ЛИСА',
    role: 'scout',
    description: 'Разведка, наблюдение и поиск слабых мест.',
    recruitCost: 300,
    unlockLevel: 3,
  },
  {
    id: 'cipher',
    name: 'Марк',
    codename: 'ШТРИХ',
    role: 'engineer',
    description: 'Техника, снабжение и подготовка оборудования.',
    recruitCost: 420,
    unlockLevel: 4,
  },
  {
    id: 'shade',
    name: 'Вера',
    codename: 'ТЕНЬ',
    role: 'infiltrator',
    description: 'Скрытное проникновение и саботаж.',
    recruitCost: 520,
    unlockLevel: 5,
  },
  {
    id: 'hammer',
    name: 'Борис',
    codename: 'МОЛОТ',
    role: 'assault',
    description: 'Силовое прикрытие и операции повышенного риска.',
    recruitCost: 650,
    unlockLevel: 6,
  },
] as const;

export const AGENT_MISSIONS: readonly AgentMissionDefinition[] = [
  {
    id: 'recon',
    title: 'НАБЛЮДЕНИЕ ЗА СКЛАДОМ',
    briefing: 'Выяснить, кто и когда вывозит оборудование.',
    unlockLevel: 3,
    minimumAgents: 1,
    maximumAgents: 2,
    durationMs: 60_000,
    baseSuccessChance: 62,
    componentReward: 18,
    agentXpReward: 25,
    favoredRole: 'scout',
  },
  {
    id: 'supply',
    title: 'ПЕРЕХВАТ ГРУЗА',
    briefing: 'Перехватить партию деталей до передачи посреднику.',
    unlockLevel: 4,
    minimumAgents: 2,
    maximumAgents: 3,
    durationMs: 180_000,
    baseSuccessChance: 52,
    componentReward: 44,
    agentXpReward: 45,
    favoredRole: 'engineer',
  },
  {
    id: 'sabotage',
    title: 'СОРВАТЬ СДЕЛКУ',
    briefing: 'Незаметно вывести из строя логистику конкурентов.',
    unlockLevel: 5,
    minimumAgents: 3,
    maximumAgents: 4,
    durationMs: 360_000,
    baseSuccessChance: 42,
    componentReward: 85,
    agentXpReward: 70,
    favoredRole: 'infiltrator',
  },
] as const;

export function getAgentLevel(xp: number): number {
  return Math.max(1, Math.min(5, 1 + Math.floor(Math.max(0, xp) / 100)));
}

export function getAgentXpToNextLevel(xp: number): number {
  const level = getAgentLevel(xp);
  return level >= 5 ? 0 : level * 100 - Math.max(0, xp);
}

export function getAgentMissionSlots(accountLevel: number): number {
  if (accountLevel >= 12) return 3;
  if (accountLevel >= 7) return 2;
  return 1;
}

export function getAgentCandidate(id: string): AgentCandidate | undefined {
  return AGENT_CANDIDATES.find((candidate) => candidate.id === id);
}

export function getAgentMission(id: AgentMissionId): AgentMissionDefinition | undefined {
  return AGENT_MISSIONS.find((mission) => mission.id === id);
}

export function calculateAgentMissionChance(
  mission: AgentMissionDefinition,
  agents: readonly AgencyAgent[],
): number {
  if (agents.length < mission.minimumAgents || agents.length > mission.maximumAgents) return 0;

  const averageLevel = agents.reduce((sum, agent) => sum + getAgentLevel(agent.xp), 0) / agents.length;
  const specialists = agents.filter((agent) => getAgentCandidate(agent.id)?.role === mission.favoredRole).length;
  const extraTeamMembers = agents.length - mission.minimumAgents;
  const chance = mission.baseSuccessChance
    + averageLevel * 4
    + specialists * 8
    + extraTeamMembers * 3;

  return Math.max(20, Math.min(95, Math.round(chance)));
}

export function normalizeAgentRoster(value: unknown): AgencyAgent[] {
  if (!Array.isArray(value)) return [];
  const normalized: AgencyAgent[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const record = item as { id?: unknown; xp?: unknown };
    if (typeof record.id !== 'string' || !getAgentCandidate(record.id)) continue;
    if (normalized.some((agent) => agent.id === record.id)) continue;
    const xp = typeof record.xp === 'number' && Number.isFinite(record.xp)
      ? Math.max(0, Math.floor(record.xp))
      : 0;
    normalized.push({ id: record.id, xp, level: getAgentLevel(xp) });
  }
  return normalized;
}

export function normalizeAgentMissionRuns(value: unknown, agents: readonly AgencyAgent[]): AgentMissionRun[] {
  if (!Array.isArray(value)) return [];
  const normalized: AgentMissionRun[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const run = item as {
      id?: unknown; missionId?: unknown; agentIds?: unknown; startedAt?: unknown;
      completesAt?: unknown; success?: unknown; successChance?: unknown;
    };
    const mission = typeof run.missionId === 'string'
      ? AGENT_MISSIONS.find((entry) => entry.id === run.missionId)
      : undefined;
    if (!mission || typeof run.id !== 'string' || !Array.isArray(run.agentIds)) continue;
    const agentIds = run.agentIds.filter((id): id is string =>
      typeof id === 'string' && agents.some((agent) => agent.id === id));
    if (agentIds.length < mission.minimumAgents || agentIds.length > mission.maximumAgents) continue;
    if (typeof run.startedAt !== 'number' || !Number.isFinite(run.startedAt)
      || typeof run.completesAt !== 'number' || !Number.isFinite(run.completesAt)) continue;
    normalized.push({
      id: run.id,
      missionId: mission.id,
      agentIds: [...new Set(agentIds)],
      startedAt: Math.max(0, run.startedAt),
      completesAt: Math.max(run.startedAt, run.completesAt),
      success: run.success === true,
      successChance: typeof run.successChance === 'number' && Number.isFinite(run.successChance)
        ? Math.max(0, Math.min(100, run.successChance))
        : 0,
    });
  }
  return normalized;
}

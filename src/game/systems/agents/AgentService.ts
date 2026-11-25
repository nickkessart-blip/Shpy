import {
  AGENT_CANDIDATES, AGENT_MISSIONS, calculateAgentMissionChance, getAgentLevel,
  getAgentMission, getAgentMissionSlots, type AgentMissionId, type AgentMissionReport,
} from '../../data/agents';
import { getAccountLevel } from '../../data/progression';
import { saveService, type SaveService } from '../../../persistence/SaveService';

export type RecruitResult = { success: true } | {
  success: false; reason: 'locked' | 'already-recruited' | 'funds' | 'unknown';
};

export type DispatchResult = { success: true; runId: string; successChance: number } | {
  success: false; reason: 'locked' | 'team-size' | 'busy' | 'slots' | 'unknown';
};

export class AgentService {
  private readonly saves: SaveService;

  constructor(saves: SaveService = saveService) {
    this.saves = saves;
  }

  recruit(candidateId: string): RecruitResult {
    const candidate = AGENT_CANDIDATES.find((entry) => entry.id === candidateId);
    if (!candidate) return { success: false, reason: 'unknown' };

    const save = this.saves.load();
    if (getAccountLevel(save.accountXp) < candidate.unlockLevel) return { success: false, reason: 'locked' };
    if (save.agents.some((agent) => agent.id === candidate.id)) {
      return { success: false, reason: 'already-recruited' };
    }
    if (save.dollars < candidate.recruitCost) return { success: false, reason: 'funds' };

    save.dollars -= candidate.recruitCost;
    save.agents.push({ id: candidate.id, level: 1, xp: 0 });
    this.saves.save(save);
    return { success: true };
  }

  dispatch(
    missionId: AgentMissionId,
    agentIds: readonly string[],
    now = Date.now(),
    randomValue = Math.random(),
  ): DispatchResult {
    const mission = getAgentMission(missionId);
    if (!mission) return { success: false, reason: 'unknown' };

    const save = this.saves.load();
    const accountLevel = getAccountLevel(save.accountXp);
    if (accountLevel < mission.unlockLevel) return { success: false, reason: 'locked' };
    if (agentIds.length < mission.minimumAgents || agentIds.length > mission.maximumAgents
      || new Set(agentIds).size !== agentIds.length) {
      return { success: false, reason: 'team-size' };
    }
    if (save.agentMissions.length >= getAgentMissionSlots(accountLevel)) {
      return { success: false, reason: 'slots' };
    }

    const busyIds = new Set(save.agentMissions.flatMap((run) => run.agentIds));
    if (agentIds.some((id) => busyIds.has(id) || !save.agents.some((agent) => agent.id === id))) {
      return { success: false, reason: 'busy' };
    }

    const team = agentIds.map((id) => save.agents.find((agent) => agent.id === id)!);
    const research = save.agencyResearch;
    const successChance = Math.min(95, calculateAgentMissionChance(mission, team) + research.intelNetwork * 5);
    const runId = mission.id + '-' + now + '-' + save.agentMissions.length;
    save.agentMissions.push({
      id: runId,
      missionId,
      agentIds: [...agentIds],
      startedAt: now,
      completesAt: now + Math.round(mission.durationMs * (1 - research.logistics * 0.1)),
      success: Math.max(0, Math.min(0.999999, randomValue)) * 100 < successChance,
      successChance,
    });
    this.saves.save(save);
    return { success: true, runId, successChance };
  }

  collectMission(runId: string, now = Date.now()): AgentMissionReport | null {
    const save = this.saves.load();
    const index = save.agentMissions.findIndex((run) => run.id === runId);
    if (index < 0) return null;
    const run = save.agentMissions[index];
    if (!run || run.completesAt > now) return null;

    const mission = getAgentMission(run.missionId);
    if (!mission) return null;
    save.agentMissions.splice(index, 1);
    const componentsEarned = run.success ? mission.componentReward : 0;
    save.components += componentsEarned;
    save.agents = save.agents.map((agent) => {
      if (!run.agentIds.includes(agent.id)) return agent;
      const xp = agent.xp + Math.round(mission.agentXpReward * (1 + save.agencyResearch.training * 0.2));
      return { ...agent, xp, level: getAgentLevel(xp) };
    });
    this.saves.save(save);
    return {
      id: run.id,
      missionId: run.missionId,
      success: run.success,
      componentsEarned,
      agentXpEarned: Math.round(mission.agentXpReward * (1 + save.agencyResearch.training * 0.2)),
      completedAt: now,
    };
  }

  getCandidateList() {
    return AGENT_CANDIDATES;
  }

  getMissionList() {
    return AGENT_MISSIONS;
  }

  getAvailableAgents() {
    const save = this.saves.load();
    const busyIds = new Set(save.agentMissions.flatMap((run) => run.agentIds));
    return save.agents.filter((agent) => !busyIds.has(agent.id));
  }

  getMissionSuccessChance(missionId: AgentMissionId, agentIds: readonly string[]): number {
    const mission = getAgentMission(missionId);
    if (!mission) return 0;
    const save = this.saves.load();
    const team = agentIds.map((id) => save.agents.find((agent) => agent.id === id))
      .filter((agent): agent is NonNullable<typeof agent> => Boolean(agent));
    return Math.min(95, calculateAgentMissionChance(mission, team) + save.agencyResearch.intelNetwork * 5);
  }
}

export const agentService = new AgentService();

import { beforeEach, describe, expect, it } from 'vitest';
import { AgentService } from './AgentService';
import { SaveService } from '../../../persistence/SaveService';

describe('agent operations', () => {
  let saves: SaveService;
  let agents: AgentService;

  beforeEach(() => {
    saves = new SaveService();
    const save = saves.load();
    save.accountXp = 700;
    save.dollars = 1200;
    saves.save(save);
    agents = new AgentService(saves);
  });

  it('recruits an unlocked agent for dollars', () => {
    expect(agents.recruit('fox')).toEqual({ success: true });
    const save = saves.load();
    expect(save.dollars).toBe(900);
    expect(save.agents).toEqual([{ id: 'fox', level: 1, xp: 0 }]);
    expect(save.accountXp).toBe(700);
  });

  it('keeps a deployed team assigned until the side operation is complete', () => {
    agents.recruit('fox');
    const dispatch = agents.dispatch('recon', ['fox'], 1_000, 0);
    expect(dispatch.success).toBe(true);
    if (!dispatch.success) return;

    expect(agents.getAvailableAgents()).toHaveLength(0);
    expect(agents.collectMission(dispatch.runId, 30_000)).toBeNull();
    expect(saves.load().agentMissions).toHaveLength(1);

    const report = agents.collectMission(dispatch.runId, 61_000);
    expect(report).toMatchObject({ success: true, componentsEarned: 18, agentXpEarned: 25 });
    const save = saves.load();
    expect(save.agentMissions).toHaveLength(0);
    expect(save.components).toBe(18);
    expect(save.agents[0]).toMatchObject({ id: 'fox', xp: 25, level: 1 });
    expect(save.accountXp).toBe(700);
    expect(save.dollars).toBe(900);
  });

  it('does not grant components when the team fails its operation', () => {
    agents.recruit('fox');
    const dispatch = agents.dispatch('recon', ['fox'], 1_000, 0.999999);
    expect(dispatch.success).toBe(true);
    if (!dispatch.success) return;

    const report = agents.collectMission(dispatch.runId, 61_000);
    expect(report).toMatchObject({ success: false, componentsEarned: 0 });
    expect(saves.load().components).toBe(0);
    expect(saves.load().agents[0]?.xp).toBe(25);
  });
  it('automatically assigns the strongest available team to the best expected component rate', () => {
    const save = saves.load();
    save.accountXp = 2_400;
    save.dollars = 3_000;
    saves.save(save);
    for (const id of ['fox', 'cipher', 'shade', 'hammer']) expect(agents.recruit(id)).toEqual({ success: true });

    const dispatch = agents.dispatchRecommended(5_000, 0);
    expect(dispatch.success).toBe(true);
    const run = saves.load().agentMissions[0];
    expect(run).toMatchObject({ missionId: 'recon', agentIds: ['fox', 'cipher'] });
    expect(agents.getAvailableAgents().map((agent) => agent.id)).toEqual(['shade', 'hammer']);
  });

  it('does not auto-dispatch when every operative is already assigned', () => {
    const save = saves.load();
    save.accountXp = 1_800;
    saves.save(save);
    agents.recruit('fox');
    expect(agents.dispatch('recon', ['fox'], 1_000, 0).success).toBe(true);
    expect(agents.dispatchRecommended(2_000, 0)).toEqual({ success: false, reason: 'team-size' });
    expect(saves.load().agentMissions).toHaveLength(1);
  });

  it('collects all completed operative reports in one batch and leaves unfinished runs untouched', () => {
    const save = saves.load();
    save.accountXp = 1_800;
    save.dollars = 1_000;
    saves.save(save);
    expect(agents.recruit('fox')).toEqual({ success: true });
    expect(agents.recruit('cipher')).toEqual({ success: true });
    const first = agents.dispatch('recon', ['fox'], 1_000, 0);
    const second = agents.dispatch('recon', ['cipher'], 1_000, 0);
    expect(first.success && second.success).toBe(true);

    expect(agents.collectReadyMissions(60_999)).toHaveLength(0);
    const reports = agents.collectReadyMissions(61_000);
    expect(reports).toHaveLength(2);
    expect(reports.every((report) => report.success)).toBe(true);
    expect(saves.load().components).toBe(36);
    expect(saves.load().agentMissions).toHaveLength(0);
  });

});

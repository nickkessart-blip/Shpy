import { describe, expect, it } from 'vitest';
import {
  AGENT_CANDIDATES, AGENT_MISSIONS, calculateAgentMissionChance, getAgentLevel,
  getAgentMissionSlots, getAgentXpToNextLevel,
} from './agents';

describe('agency agent progression', () => {
  it('unlocks recruitment candidates over account progression', () => {
    expect(AGENT_CANDIDATES.map((candidate) => candidate.unlockLevel)).toEqual([3, 4, 5, 6]);
    expect(getAgentMissionSlots(3)).toBe(1);
    expect(getAgentMissionSlots(7)).toBe(2);
    expect(getAgentMissionSlots(12)).toBe(3);
  });

  it('levels agents independently from account XP', () => {
    expect([0, 99, 100, 250, 400, 999].map(getAgentLevel)).toEqual([1, 1, 2, 3, 5, 5]);
    expect(getAgentXpToNextLevel(0)).toBe(100);
    expect(getAgentXpToNextLevel(250)).toBe(50);
    expect(getAgentXpToNextLevel(500)).toBe(0);
  });

  it('calculates a valid mission chance from level and favored specialty', () => {
    const mission = AGENT_MISSIONS.find((entry) => entry.id === 'recon')!;
    const scout = { id: 'fox', level: 1, xp: 0 };
    const engineer = { id: 'cipher', level: 1, xp: 0 };
    expect(calculateAgentMissionChance(mission, [scout])).toBeGreaterThan(
      calculateAgentMissionChance(mission, [engineer]),
    );
    expect(calculateAgentMissionChance(mission, [])).toBe(0);
    expect(calculateAgentMissionChance(mission, [scout, engineer, scout])).toBe(0);
  });
});

import type { MissionId } from '../../data/missions';
export interface MissionResult {
  success: boolean;
  elapsedSeconds: number;
  kills: number;
  shots: number;
  hits: number;
  damageTaken: number;
  accountXpEarned: number;
  dollarsEarned: number;
}

export const runSession = {
  result: null as MissionResult | null,
  startedAt: 0,
  missionId: 'casino' as MissionId,
  reset(missionId: MissionId = 'casino'): void { this.result = null; this.startedAt = Date.now(); this.missionId = missionId; },
};

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
  reset(): void { this.result = null; this.startedAt = Date.now(); },
};

export type TutorialStep = 'fire' | 'reload' | 'telegraph' | 'dodge' | 'cover' | 'finish';
export type TutorialEvent = 'shot' | 'reload' | 'projectile' | 'evade' | 'enemy-peek' | 'kill';
export type TutorialProgress = TutorialStep | 'complete';

const NEXT: Record<TutorialStep, Partial<Record<TutorialEvent, TutorialProgress>>> = {
  fire: { shot: 'reload' },
  reload: { reload: 'telegraph' },
  telegraph: { projectile: 'dodge' },
  dodge: { evade: 'cover' },
  cover: { 'enemy-peek': 'finish' },
  finish: { kill: 'complete' },
};

/** Advance onboarding only when the corresponding gameplay event occurs. */
export function advanceFirstOperationTutorial(current: TutorialStep, event: TutorialEvent): TutorialProgress {
  return NEXT[current][event] ?? current;
}
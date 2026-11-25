import { describe, expect, it } from 'vitest';
import { advanceFirstOperationTutorial, type TutorialEvent, type TutorialStep } from './firstOperationTutorial';

describe('first-operation tutorial progression', () => {
  it('advances through actual gameplay events in the expected order', () => {
    const events: TutorialEvent[] = ['shot', 'reload', 'projectile', 'evade', 'enemy-peek', 'kill'];
    const expected: Array<TutorialStep | 'complete'> = ['reload', 'telegraph', 'dodge', 'cover', 'finish', 'complete'];
    let step: TutorialStep = 'fire';
    events.forEach((event, index) => {
      const next = advanceFirstOperationTutorial(step, event);
      expect(next).toBe(expected[index]);
      if (next !== 'complete') step = next;
    });
  });
  it('ignores unrelated events and cannot skip required combat actions', () => {
    expect(advanceFirstOperationTutorial('fire', 'reload')).toBe('fire');
    expect(advanceFirstOperationTutorial('reload', 'projectile')).toBe('reload');
    expect(advanceFirstOperationTutorial('telegraph', 'evade')).toBe('telegraph');
    expect(advanceFirstOperationTutorial('dodge', 'kill')).toBe('dodge');
    expect(advanceFirstOperationTutorial('cover', 'kill')).toBe('cover');
  });
  it('does not complete before the finish step receives a kill event', () => {
    expect(advanceFirstOperationTutorial('finish', 'enemy-peek')).toBe('finish');
    expect(advanceFirstOperationTutorial('finish', 'kill')).toBe('complete');
  });
});
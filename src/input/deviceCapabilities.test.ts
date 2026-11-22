import { describe, expect, it } from 'vitest';
import { shouldUseTouchControls } from './deviceCapabilities';

describe('touch control detection', () => {
  it('detects Android-style touch capability without relying on ontouchstart', () => {
    expect(shouldUseTouchControls({ maxTouchPoints: 5, hasTouchStart: false })).toBe(true);
  });

  it('detects coarse-pointer devices when touch-point count is unavailable', () => {
    expect(shouldUseTouchControls({ maxTouchPoints: 0, coarsePointer: true })).toBe(true);
  });

  it('detects legacy touch event support', () => {
    expect(shouldUseTouchControls({ hasTouchStart: true })).toBe(true);
  });

  it('keeps mouse-only devices on the desktop layout', () => {
    expect(shouldUseTouchControls({ maxTouchPoints: 0, hasTouchStart: false, coarsePointer: false })).toBe(false);
  });
});

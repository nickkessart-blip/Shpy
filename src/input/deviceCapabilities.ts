export interface TouchInputSignals {
  maxTouchPoints?: number;
  hasTouchStart?: boolean;
  coarsePointer?: boolean;
}

/** Pure capability check, kept separate so mobile input detection can be tested. */
export function shouldUseTouchControls(signals: TouchInputSignals): boolean {
  return (signals.maxTouchPoints ?? 0) > 0
    || signals.hasTouchStart === true
    || signals.coarsePointer === true;
}

export function hasTouchInput(): boolean {
  if (typeof window === 'undefined') return false;

  const coarsePointer = typeof window.matchMedia === 'function'
    && (
      window.matchMedia('(pointer: coarse)').matches
      || window.matchMedia('(any-pointer: coarse)').matches
    );

  return shouldUseTouchControls({
    maxTouchPoints: typeof navigator === 'undefined' ? 0 : navigator.maxTouchPoints,
    hasTouchStart: 'ontouchstart' in window,
    coarsePointer,
  });
}

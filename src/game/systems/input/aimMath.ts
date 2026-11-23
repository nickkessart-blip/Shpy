export interface AimVector {
  x: number;
  y: number;
}

const DEAD_ZONE = 0.05;
const BASE_SPEED_PER_MS = 1.35;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * A thumb-friendly response curve: small but intentional movements stay useful,
 * while full deflection can cross the screen in well under a second.
 */
export function getAimVelocity(vector: AimVector, sensitivity: number): AimVector {
  const magnitude = Math.hypot(vector.x, vector.y);
  if (!Number.isFinite(magnitude) || magnitude <= DEAD_ZONE) return { x: 0, y: 0 };

  const normalizedPower = (Math.min(1, magnitude) - DEAD_ZONE) / (1 - DEAD_ZONE);
  const response = 0.22 + 0.78 * Math.pow(normalizedPower, 0.78);
  const safeSensitivity = clamp(Number.isFinite(sensitivity) ? sensitivity : 1.8, 0.5, 4);
  const speed = BASE_SPEED_PER_MS * safeSensitivity * response;

  return {
    x: (vector.x / magnitude) * speed,
    y: (vector.y / magnitude) * speed,
  };
}

export function moveAim(
  point: AimVector,
  vector: AimVector,
  sensitivity: number,
  deltaMs: number,
  width: number,
  height: number,
): AimVector {
  const velocity = getAimVelocity(vector, sensitivity);
  // Do not reuse the simulation's 50ms step cap. Slow phones must not lose
  // half of their aim travel simply because they render below 20 FPS.
  const delta = clamp(Number.isFinite(deltaMs) ? deltaMs : 0, 0, 120);

  return {
    x: clamp(point.x + velocity.x * delta, 18, width - 18),
    y: clamp(point.y + velocity.y * delta, 90, height - 130),
  };
}

export interface AimVector {
  x: number;
  y: number;
}

const DEAD_ZONE = 0.12;
const BASE_SPEED_PER_MS = 1.05;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Converts a normalized radial stick vector into cursor velocity in world pixels per millisecond. */
export function getAimVelocity(vector: AimVector, sensitivity: number): AimVector {
  const length = Math.min(1, Math.hypot(vector.x, vector.y));
  if (!Number.isFinite(length) || length <= DEAD_ZONE) return { x: 0, y: 0 };

  const normalizedPower = (length - DEAD_ZONE) / (1 - DEAD_ZONE);
  const response = normalizedPower * (0.38 + normalizedPower * 0.62);
  const safeSensitivity = clamp(Number.isFinite(sensitivity) ? sensitivity : 1.4, 0.5, 2.5);
  const speed = BASE_SPEED_PER_MS * safeSensitivity * response;
  return {
    x: (vector.x / length) * speed,
    y: (vector.y / length) * speed,
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
  const delta = Math.max(0, Math.min(50, Number.isFinite(deltaMs) ? deltaMs : 0));
  return {
    x: clamp(point.x + velocity.x * delta, 18, width - 18),
    y: clamp(point.y + velocity.y * delta, 90, height - 130),
  };
}

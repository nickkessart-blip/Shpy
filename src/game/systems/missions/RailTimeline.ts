export interface RailTimelineConfig {
  routeLength: number;
  speedPxPerSecond: number;
}

/**
 * Deterministic, renderer-independent route clock for a rail-shooter segment.
 * Visual layers consume wrapped offsets; combat and hitbox coordinates do not.
 */
export class RailTimeline {
  private routeLength: number;
  private readonly speedPxPerSecond: number;
  private distanceValue = 0;

  constructor(config: RailTimelineConfig) {
    this.assertPositiveFinite(config.routeLength, 'routeLength');
    this.assertPositiveFinite(config.speedPxPerSecond, 'speedPxPerSecond');
    this.routeLength = config.routeLength;
    this.speedPxPerSecond = config.speedPxPerSecond;
  }

  get distance(): number {
    return this.distanceValue;
  }

  get progress(): number {
    return this.routeLength > 0 ? this.distanceValue / this.routeLength : 0;
  }

  get complete(): boolean {
    return this.distanceValue >= this.routeLength;
  }

  advance(deltaMs: number): number {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0 || this.complete) return this.distanceValue;
    this.distanceValue = Math.min(
      this.routeLength,
      this.distanceValue + this.speedPxPerSecond * (deltaMs / 1000),
    );
    return this.distanceValue;
  }

  reset(routeLength = this.routeLength): void {
    this.assertPositiveFinite(routeLength, 'routeLength');
    this.routeLength = routeLength;
    this.distanceValue = 0;
  }

  /**
   * Negative tile offset for a repeating decorative layer. Each layer supplies
   * its own period and speed multiplier; this never changes gameplay positions.
   */
  layerOffset(period: number, speedFactor: number): number {
    this.assertPositiveFinite(period, 'period');
    if (!Number.isFinite(speedFactor) || speedFactor < 0) {
      throw new RangeError('speedFactor must be a finite non-negative number');
    }
    return -((this.distanceValue * speedFactor) % period);
  }

  private assertPositiveFinite(value: number, name: string): void {
    if (!Number.isFinite(value) || value <= 0) {
      throw new RangeError(name + ' must be a positive finite number');
    }
  }
}

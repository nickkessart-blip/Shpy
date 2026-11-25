import { describe, expect, it } from 'vitest';
import { RailTimeline } from './RailTimeline';

describe('RailTimeline', () => {
  it('advances route distance deterministically from elapsed milliseconds', () => {
    const rail = new RailTimeline({ routeLength: 1200, speedPxPerSecond: 60 });
    rail.advance(1000);
    rail.advance(500);
    expect(rail.distance).toBe(90);
    expect(rail.progress).toBeCloseTo(0.075, 8);
    expect(rail.complete).toBe(false);
  });

  it('clamps at the route end and never reports progress above one', () => {
    const rail = new RailTimeline({ routeLength: 100, speedPxPerSecond: 80 });
    rail.advance(5000);
    expect(rail.distance).toBe(100);
    expect(rail.progress).toBe(1);
    expect(rail.complete).toBe(true);
    rail.advance(1000);
    expect(rail.distance).toBe(100);
  });

  it('resets distance and completion for a new mission segment', () => {
    const rail = new RailTimeline({ routeLength: 100, speedPxPerSecond: 100 });
    rail.advance(1000);
    rail.reset(400);
    expect(rail.distance).toBe(0);
    expect(rail.progress).toBe(0);
    expect(rail.complete).toBe(false);
  });

  it('wraps each parallax layer using its own period and speed factor', () => {
    const rail = new RailTimeline({ routeLength: 1000, speedPxPerSecond: 100 });
    rail.advance(2500);
    expect(rail.layerOffset(100, 1)).toBe(-50);
    expect(rail.layerOffset(200, 0.5)).toBe(-125);
  });

  it('moves non-tileable art by bounded progress without wrapping', () => {
    const rail = new RailTimeline({ routeLength: 1000, speedPxPerSecond: 100 });
    rail.advance(2500);
    expect(rail.layerTravel(80, 0.5)).toBe(-10);
    expect(rail.layerTravel(80, 2)).toBe(-40);
    rail.advance(10000);
    expect(rail.layerTravel(80, 2)).toBe(-80);
  });

  it('ignores invalid or non-positive frame deltas', () => {
    const rail = new RailTimeline({ routeLength: 1000, speedPxPerSecond: 100 });
    rail.advance(0);
    rail.advance(-10);
    rail.advance(Number.NaN);
    expect(rail.distance).toBe(0);
  });

  it('rejects invalid route configuration', () => {
    expect(() => new RailTimeline({ routeLength: 0, speedPxPerSecond: 60 })).toThrow(RangeError);
    expect(() => new RailTimeline({ routeLength: 100, speedPxPerSecond: -1 })).toThrow(RangeError);
  });
});

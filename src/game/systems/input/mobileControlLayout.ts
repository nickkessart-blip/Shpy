/**
 * Choose a physical touch-control scale independently of Phaser's 1280×720
 * logical resolution. Small logical-to-CSS ratios made the controls unusable
 * on compact landscape phones.
 */
export function getMobileControlScale(viewportWidth: number, viewportHeight: number): number {
  const width = Number.isFinite(viewportWidth) ? Math.max(0, viewportWidth) : 0;
  const height = Number.isFinite(viewportHeight) ? Math.max(0, viewportHeight) : 0;
  return Math.max(0.8, Math.min(1.15, width / 800, height / 450));
}

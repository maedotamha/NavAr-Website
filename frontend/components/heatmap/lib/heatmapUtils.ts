// ─── Canvas heatmap rendering engine ─────────────────────────────────────────
//
// Architecture:
//   1. Each node's visit count is normalised to 0..1 intensity
//   2. On the offscreen canvas each point is drawn as a radial gradient (grayscale)
//   3. A pixel-level colour LUT pass maps grayscale α → RGBA hot-cold colour
//   4. The result is blitted onto the visible canvas
//
// This approach (shadow canvas + colour LUT) allows blending overlapping
// points naturally and produces smooth, authentic heatmap gradients.

export interface ScreenPoint {
  x: number;
  y: number;
  intensity: number;   // 0..1
  radius: number;      // pixels
}

// Colour stops: cold (blue) → warm (red)
// Each stop: [t, r, g, b, a]  where t ∈ [0,1]
const COLOUR_STOPS: [number, number, number, number, number][] = [
  [0.00,   0,   0, 180,   0],
  [0.15,   0,  80, 255, 100],
  [0.30,   0, 200, 255, 150],
  [0.50,   0, 255, 120, 180],
  [0.65, 140, 255,   0, 205],
  [0.78, 255, 220,   0, 225],
  [0.88, 255,  80,   0, 240],
  [1.00, 255,   0,  60, 255],
];

function lerpColour(t: number): [number, number, number, number] {
  if (t <= 0) return [0, 0, 0, 0];
  if (t >= 1) return [255, 0, 60, 255];

  for (let i = 1; i < COLOUR_STOPS.length; i++) {
    const [t1, r1, g1, b1, a1] = COLOUR_STOPS[i];
    const [t0, r0, g0, b0, a0] = COLOUR_STOPS[i - 1];
    if (t <= t1) {
      const f = (t - t0) / (t1 - t0);
      return [
        Math.round(r0 + f * (r1 - r0)),
        Math.round(g0 + f * (g1 - g0)),
        Math.round(b0 + f * (b1 - b0)),
        Math.round(a0 + f * (a1 - a0)),
      ];
    }
  }
  return [255, 0, 60, 255];
}

/**
 * Paint a heatmap onto `ctx` from an array of screen-space points.
 * Call this every time the map moves or the data changes.
 */
export function paintHeatmap(
  ctx: CanvasRenderingContext2D,
  points: ScreenPoint[],
  blurPasses = 1,
): void {
  const { width, height } = ctx.canvas;
  if (points.length === 0 || width === 0 || height === 0) {
    ctx.clearRect(0, 0, width, height);
    return;
  }

  // ── Step 1: draw radial gradients on offscreen grayscale canvas ────────────
  const shadow = document.createElement('canvas');
  shadow.width = width;
  shadow.height = height;
  const sc = shadow.getContext('2d')!;
  sc.clearRect(0, 0, width, height);

  for (const pt of points) {
    const { x, y, intensity, radius } = pt;
    if (radius <= 0 || intensity <= 0) continue;

    // Multiple layers of decreasing opacity for softer falloff
    const maxAlpha = Math.min(1, 0.12 + intensity * 0.88);
    const grad = sc.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0,   `rgba(0,0,0,${maxAlpha})`);
    grad.addColorStop(0.35, `rgba(0,0,0,${maxAlpha * 0.65})`);
    grad.addColorStop(0.70, `rgba(0,0,0,${maxAlpha * 0.25})`);
    grad.addColorStop(1,   'rgba(0,0,0,0)');

    sc.fillStyle = grad;
    sc.beginPath();
    sc.arc(x, y, radius, 0, Math.PI * 2);
    sc.fill();
  }

  // ── Step 2: (optional) simple box blur to soften hard edges ───────────────
  // Done by drawing the shadow canvas slightly transparent over itself
  if (blurPasses > 0) {
    sc.globalAlpha = 0.4;
    for (let p = 0; p < blurPasses; p++) {
      sc.drawImage(shadow, -1, -1);
      sc.drawImage(shadow,  1,  1);
    }
    sc.globalAlpha = 1;
  }

  // ── Step 3: colour LUT pass ────────────────────────────────────────────────
  const imgData = sc.getImageData(0, 0, width, height);
  const { data } = imgData;

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3] / 255;   // grayscale intensity stored in alpha
    if (alpha < 0.01) {
      data[i + 3] = 0;
      continue;
    }
    const [r, g, b, a] = lerpColour(alpha);
    data[i]     = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = a;
  }

  // ── Step 4: blit to visible canvas ────────────────────────────────────────
  ctx.clearRect(0, 0, width, height);
  ctx.putImageData(imgData, 0, 0);
}

/** Compute a radius in pixels that scales with zoom level */
export function heatRadius(zoom: number, baseRadius = 35): number {
  // At zoom=16 use baseRadius; scale by factor of 1.8 per zoom step
  return Math.max(10, Math.min(200, baseRadius * Math.pow(1.8, zoom - 16)));
}

/** Normalise raw visit counts to 0..1 */
export function normaliseIntensities(
  visits: Record<string, number>,
): Record<string, number> {
  const values = Object.values(visits);
  if (values.length === 0) return {};
  const max = Math.max(...values);
  if (max === 0) return Object.fromEntries(Object.keys(visits).map(k => [k, 0]));
  return Object.fromEntries(Object.entries(visits).map(([k, v]) => [k, v / max]));
}

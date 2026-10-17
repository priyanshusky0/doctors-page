// Scene 11: the partnership as one line. It runs through the four steps with a heartbeat
// between each, then rolls up into a ring that becomes the Sugar360 mark.
// The roll is the unroll from the sugar360-story experiment played in reverse: points
// return to the ring in order (a ribbon curling, not a morph), while the line's span shrinks
// to the circle's width, so the shape never crosses itself.

export const JOURNEY_VB = { w: 1200, h: 360 };
const N = 240;
// ring radius = the middle of the mark's band, so the formed ring sits exactly on the logo
export const RING = { cx: 600, cy: 180, r: 110, band: 40 };
const LINE = { x0: 0, x1: 1200, base: 180, amp: 74 };

/** Where the four steps sit along the line (column centres). */
export const STEP_AT = [0.125, 0.375, 0.625, 0.875];
const BEATS_AT = [0.25, 0.5, 0.75];

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (t: number) => t * t * (3 - 2 * t);

/** One heartbeat (P wave, QRS, T wave); t is 0..1 within the beat. */
function beat(t: number) {
  const g = (c: number, w: number, h: number) => h * Math.exp(-(((t - c) / w) ** 2));
  return g(0.2, 0.05, 0.12) - g(0.4, 0.02, 0.2) + g(0.45, 0.02, 1) - g(0.5, 0.022, 0.34) + g(0.72, 0.07, 0.22);
}
function signal(s: number) {
  for (const c of BEATS_AT) {
    const u = (s - c) / 0.1 + 0.5;
    if (u > 0 && u < 1) return beat(u);
  }
  return 0;
}

/** A point at line position s (0..1), at roll progress p (1 = the line, 0 = the ring). */
export function journeyPoint(p: number, s: number) {
  const g = smoothstep(clamp(p));
  const half = lerp(RING.r, (LINE.x1 - LINE.x0) / 2, g);
  const mid = lerp(RING.cx, (LINE.x0 + LINE.x1) / 2, g);
  const base = lerp(RING.cy, LINE.base, g);
  const a = -Math.PI / 2 + 2 * Math.PI * s;
  const e = smoothstep(clamp((p - s * 0.3) / 0.7));
  return {
    x: lerp(RING.cx + RING.r * Math.cos(a), mid - half + s * 2 * half, e),
    y: lerp(RING.cy + RING.r * Math.sin(a), base - signal(s) * LINE.amp * g, e),
  };
}

export function journeyPath(p: number) {
  let d = "";
  for (let i = 0; i < N; i++) {
    const q = journeyPoint(p, i / (N - 1));
    d += `${i ? "L" : "M"}${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
  }
  return d;
}

export const JOURNEY_LINE = journeyPath(1);

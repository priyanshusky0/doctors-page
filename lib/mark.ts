// Sugar360 mark geometry, rebuilt from the official logo (see scripts/build_mark.py).
// Units are pixels of the 2250px source artwork; the viewBox is the mark's exact bounds,
// so it lines up with the icon in public/brand/logo-white.webp.

export const VIEWBOX = { x: 448, y: 483, w: 1352, h: 1283 };
export const VIEWBOX_ATTR = `${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.w} ${VIEWBOX.h}`;

export const CENTER = { x: 1090, y: 1125 };
export const DOT = { x: 1660, y: 757, r: 140, gap: 169 };

export const CRESCENT_D =
  "M883.9 517.0 A642 642 0 0 0 886.6 1733.9 A888 888 0 0 1 883.9 517.0Z";
export const LARGER_D =
  "M943.1 500.0 A642 642 0 1 1 945.9 1750.6 A858 858 0 0 1 703.8 1348.0 " +
  "A446 446 0 1 0 702.8 903.7 A858 858 0 0 1 943.1 500.0Z";

/** Where the dot and the ring's hole sit, as fractions of the mark box (for HTML overlays). */
export const DOT_FRAC = {
  x: (DOT.x - VIEWBOX.x) / VIEWBOX.w,
  y: (DOT.y - VIEWBOX.y) / VIEWBOX.h,
};
export const HOLE_FRAC = {
  x: (CENTER.x - VIEWBOX.x) / VIEWBOX.w,
  y: (CENTER.y - VIEWBOX.y) / VIEWBOX.h,
};

/** Number of sections the larger part is split into: one per Scene 2 / Scene 8 fragment. */
export const SEGMENTS = 6;

/**
 * Pie wedges around the centre that cut the larger part into SEGMENTS pieces, running
 * clockwise from its upper tip, over the right side, to its lower tip.
 */
export function wedges(): string[] {
  const start = -103;
  const end = 103;
  const step = (end - start) / SEGMENTS;
  const R = 1200;
  const pt = (deg: number) => {
    const a = (deg * Math.PI) / 180;
    return `${(CENTER.x + R * Math.cos(a)).toFixed(1)} ${(CENTER.y + R * Math.sin(a)).toFixed(1)}`;
  };
  return Array.from({ length: SEGMENTS }, (_, i) => {
    // first and last wedges reach past the tips so the thin ends are covered
    const a0 = i === 0 ? -180 : start + i * step - 1.2;
    const a1 = i === SEGMENTS - 1 ? 180 : start + (i + 1) * step + 1.2;
    const mid = (a0 + a1) / 2;
    return `M${CENTER.x} ${CENTER.y} L${pt(a0)} L${pt(mid)} L${pt(a1)}Z`;
  });
}

/** The five readings carried by the lifeline, in order (Scenes 2 and 8). */
export const READINGS: { label: string; value: number }[] = [
  { label: "Fasting", value: 148 },
  { label: "Post-meal", value: 232 },
  { label: "Random", value: 176 },
  { label: "Fasting", value: 162 },
  { label: "Post-meal", value: 241 },
];

/**
 * The lifeline: a glucose-trace curve in a 1000 x 320 box, starting at the dot (x = 0).
 * The same path is used in Scene 2 and Scene 8, so its shape is identical in both.
 */
export const TRACE = (() => {
  const W = 1000;
  const yOf = (v: number) => 280 - ((v - 100) / 160) * 230;
  const xs = [170, 350, 530, 710, 890];
  // readings plus small in-between wobbles, so it reads as a continuous trace
  const pts: [number, number][] = [[0, yOf(150)], [70, yOf(141)]];
  READINGS.forEach((r, i) => {
    pts.push([xs[i], yOf(r.value)]);
    if (i < READINGS.length - 1) {
      const nx = (xs[i] + xs[i + 1]) / 2;
      const ny = (yOf(r.value) + yOf(READINGS[i + 1].value)) / 2 + (i % 2 ? -26 : 30);
      pts.push([nx, ny]);
    }
  });
  pts.push([W, yOf(214)]);
  // Catmull-Rom through the points, as cubic Beziers
  let d = `M${pts[0][0]} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1].toFixed(1)}`;
  }
  return {
    d,
    width: W,
    height: 320,
    end: { x: W, y: yOf(214) },
    points: READINGS.map((r, i) => ({ ...r, x: xs[i], y: yOf(r.value) })),
  };
})();

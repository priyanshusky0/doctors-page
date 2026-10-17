// Drives one <Lifeline>. Both variants use the identical path; only what happens to the
// readings differs. Scene 2: they glow as the line passes, then fade before reaching the
// circle. Scene 8: they travel back along the line into the circle.

import { TRACE } from "@/lib/mark";

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function createLifeline(root: HTMLElement) {
  const path = root.querySelector<SVGPathElement>(".ll-path")!;
  const head = root.querySelector<SVGCircleElement>(".ll-head");
  const readings = Array.from(root.querySelectorAll<SVGGElement>(".ll-reading"));
  const L = path.getTotalLength();

  // where along the line (0..1) each reading sits
  const at = TRACE.points.map((p) => {
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i <= 400; i++) {
      const q = path.getPointAtLength((i / 400) * L);
      const d = Math.abs(q.x - p.x);
      if (d < bestD) {
        bestD = d;
        best = i / 400;
      }
    }
    return best;
  });

  path.style.strokeDasharray = "1 1";
  const pt = (f: number) => path.getPointAtLength(Math.min(1, Math.max(0, f)) * L);

  /** Scene 2: the line runs out from the circle as the dot drifts away; p is 0..1. */
  function broken(p: number) {
    path.style.strokeDashoffset = String(1 - p);
    if (head) {
      const q = pt(p);
      head.setAttribute("cx", q.x.toFixed(1));
      head.setAttribute("cy", q.y.toFixed(1));
      head.style.opacity = p > 0.001 ? "1" : "0";
    }
    readings.forEach((g, i) => {
      const f = at[i];
      const glow = smooth(f - 0.03, f + 0.02, p);
      const gone = smooth(f + 0.1, f + 0.26, p);
      const o = glow * (1 - gone * 0.92);
      g.style.opacity = o.toFixed(3);
      g.classList.toggle("is-hot", glow > 0.5 && gone < 0.3);
    });
  }

  /** Scene 8: draw 0..1 lays the line back along the circle; travel[i] 0..1 carries reading i in. */
  function held(draw: number, travel: number[]) {
    path.style.strokeDashoffset = String(1 - draw);
    readings.forEach((g, i) => {
      const t = travel[i] ?? 0;
      const f = at[i] * (1 - t);
      const q = pt(f);
      const shown = smooth(at[i] - 0.02, at[i] + 0.02, draw);
      const o = shown * (1 - smooth(0.82, 1, t));
      g.setAttribute("transform", `translate(${q.x.toFixed(1)} ${q.y.toFixed(1)})`);
      g.style.opacity = o.toFixed(3);
      g.classList.toggle("is-hot", t > 0.02 && t < 0.95);
    });
  }

  return { broken, held, count: readings.length };
}

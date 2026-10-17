// The fixed Sugar360 mark. It follows whichever slot the active scene names, easing
// between them so it travels through the story; scenes tween its parts directly.

import gsap from "gsap";
import { DOT, SEGMENTS, VIEWBOX } from "@/lib/mark";

export const BASE_W = 400; // css width of #mark before scaling

export type MarkCtl = ReturnType<typeof createMark>;

export function createMark() {
  const el = document.getElementById("mark") as unknown as SVGSVGElement;
  const q = <T extends Element>(s: string) => el.querySelector(s) as T;
  const parts = {
    segs: Array.from(el.querySelectorAll<SVGPathElement>(".mk-seg")),
    base: q<SVGPathElement>(".mk-larger-base"),
    cres: q<SVGPathElement>(".mk-cres"),
    cresGlow: q<SVGPathElement>(".mk-cres-glow"),
    largerGlow: q<SVGPathElement>(".mk-larger-glow"),
    dot: q<SVGCircleElement>(".mk-dot"),
    hole: q<SVGCircleElement>(".mk-gap-hole"),
  };
  if (parts.segs.length !== SEGMENTS) throw new Error("mark segments missing");

  el.style.width = `${BASE_W}px`;
  el.style.height = `${(BASE_W * VIEWBOX.h) / VIEWBOX.w}px`;

  // The mark sits exactly on its slot. Only when the slot changes does it travel, over
  // TRAVEL seconds, from wherever it was; after that it tracks the slot with no lag, so it
  // never trails behind a scrolling scene.
  const TRAVEL = 0.85;
  let slot: Element | null = null;
  let fade = 1; // extra multiplier scenes use for crossfades (final logo)
  let blend: { a: Element; b: Element; t: number } | null = null; // scroll-driven move (final logo)
  const cur = { x: 0, y: 0, s: 1, o: 0 };
  const from = { x: 0, y: 0, s: 1 };
  let travel = 1; // 0..1 progress of the current slot-to-slot move
  let placed = false;

  function setSlot(next: Element | null) {
    if (next === slot) return;
    slot = next;
    if (next) {
      Object.assign(from, { x: cur.x, y: cur.y, s: cur.s });
      travel = placed && cur.o > 0.05 ? 0 : 1; // first appearance: no flight in from nowhere
    }
  }

  /** Move between two slots by scroll progress t (0 = a, 1 = b), with no time easing. */
  function setBlend(a: Element | null, b: Element | null, t: number) {
    blend = a && b ? { a, b, t } : null;
  }

  function setFade(v: number) {
    fade = v;
  }

  const rectOf = (el: Element) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 ? { x: r.left, y: r.top, s: r.width / BASE_W } : null;
  };
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function frame(dt: number) {
    let target: { x: number; y: number; s: number } | null = null;
    if (blend) {
      const A = rectOf(blend.a);
      const B = rectOf(blend.b);
      if (A && B) {
        const t = ease(Math.min(1, Math.max(0, blend.t)));
        target = { x: A.x + (B.x - A.x) * t, y: A.y + (B.y - A.y) * t, s: A.s + (B.s - A.s) * t };
      }
      travel = 1;
    } else if (slot) {
      target = rectOf(slot);
    }
    if (target) {
      if (travel < 1) {
        travel = Math.min(1, travel + dt / TRAVEL);
        const k = ease(travel);
        cur.x = from.x + (target.x - from.x) * k;
        cur.y = from.y + (target.y - from.y) * k;
        cur.s = from.s + (target.s - from.s) * k;
      } else {
        cur.x = target.x;
        cur.y = target.y;
        cur.s = target.s;
      }
      placed = true;
    }
    const ko = 1 - Math.exp(-dt * 6);
    cur.o += ((target ? 1 : 0) - cur.o) * ko;
    const o = cur.o * fade;
    el.style.transform = `translate3d(${cur.x.toFixed(2)}px, ${cur.y.toFixed(2)}px, 0) scale(${cur.s.toFixed(4)})`;
    el.style.opacity = o.toFixed(3);
    el.style.visibility = o < 0.005 ? "hidden" : "visible";
  }

  type Look = {
    segs?: number | number[];
    base?: number;
    dot?: number;
    dotAt?: [number, number];
    hole?: number;
    cresGlow?: number;
    largerGlow?: number;
  };

  let looks: gsap.core.Tween[] = [];
  /** Stop any look still easing in, so a scene timeline owns the parts it animates. */
  function clearLooks() {
    looks.forEach((t) => t.kill());
    looks = [];
  }

  /** Ease the mark's parts to a look (for scenes that do not animate those parts themselves). */
  function look(l: Look, duration = 0.9) {
    clearLooks();
    const to = (t: gsap.TweenTarget, vars: gsap.TweenVars) => looks.push(gsap.to(t, { duration, ...vars }));
    const segs = l.segs;
    if (segs !== undefined) {
      parts.segs.forEach((s, i) => to(s, { opacity: Array.isArray(segs) ? segs[i] : segs }));
    }
    if (l.base !== undefined) to(parts.base, { opacity: l.base });
    if (l.dot !== undefined) to(parts.dot, { opacity: l.dot });
    if (l.dotAt) to(parts.dot, { x: l.dotAt[0], y: l.dotAt[1] });
    if (l.hole !== undefined) to(parts.hole, { attr: { r: l.hole } });
    if (l.cresGlow !== undefined) to(parts.cresGlow, { opacity: l.cresGlow });
    if (l.largerGlow !== undefined) to(parts.largerGlow, { opacity: l.largerGlow });
  }

  // starting look: Scene 0
  gsap.set(parts.segs, { opacity: 0 });
  gsap.set([parts.cresGlow, parts.largerGlow], { opacity: 0 });
  gsap.set(parts.base, { opacity: 1 });

  return { el, parts, setSlot, setBlend, setFade, frame, look, clearLooks, HOLE: DOT.gap };
}

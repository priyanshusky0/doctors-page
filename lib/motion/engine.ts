// The scroll film. Each scene is pinned and scrubbed: lines arrive one at a time, the mark
// travels between scene slots and changes state, and the photos drift in depth.
// Everything here is progressive: the page reads in full without it.

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { createDepth, type Depth } from "./depth";
import { createLifeline } from "./lifeline";
import { createMark, type MarkCtl } from "./mark";
import { STEP_AT, journeyPath, journeyPoint, RING } from "@/lib/pulse";

type Look = Parameters<MarkCtl["look"]>[0];

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T;
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) =>
  Array.from(r.querySelectorAll(s)) as T[];

const FULL: Look = { segs: 1, base: 0, dot: 1, dotAt: [0, 0], hole: 169, cresGlow: 0, largerGlow: 0 };

export function start() {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  const root = document.documentElement;
  root.classList.add("motion");

  const lenis = new Lenis({ autoRaf: false, lerp: 0.1, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  const raf = (t: number) => lenis.raf(t * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);

  const mark = createMark();
  const P = mark.parts;
  const canvas = $<HTMLCanvasElement>("#depth");
  const depth: Depth | null = matchMedia("(prefers-reduced-data: reduce)").matches ? null : createDepth(canvas);
  if (!depth) canvas.style.display = "none";

  // ---------- helpers ----------
  const scene = (id: string) => $(`[data-scene="${id}"]`);
  const slotOf = (el: Element, name: string) => el.querySelector(`[data-slot="${name}"]`);
  const show = (tl: gsap.core.Timeline, t: gsap.TweenTarget, at: number, d = 0.8) =>
    tl.fromTo(t, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: d, ease: "power2.out" }, at);
  const hide = (tl: gsap.core.Timeline, t: gsap.TweenTarget, at: number, d = 0.7) =>
    tl.to(t, { autoAlpha: 0, y: -18, duration: d, ease: "power1.in" }, at);
  /** Owns a mark property from the start of a scene timeline, so scrubbing back restores it. */
  const own = (tl: gsap.core.Timeline, t: gsap.TweenTarget, vars: gsap.TweenVars) =>
    tl.fromTo(t, vars, { ...vars, duration: 0.001 }, 0);

  // On phones the long scenes flow and reveal line by line instead of pinning.
  const phone = matchMedia("(max-width: 760px)").matches;
  const FLOW_ON_PHONE = new Set(["7", "9b"]);

  function pin(id: string, screens: number, build: (tl: gsap.core.Timeline, el: HTMLElement) => void, onUpdate?: (p: number) => void) {
    const el = scene(id);
    if (phone && FLOW_ON_PHONE.has(id)) {
      const office = el.querySelector(".office");
      if (office) gsap.fromTo(office, { xPercent: 100 }, { xPercent: 0, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 70%", end: "top 0%", scrub: 0.6 } });
      $$(".ln", el).forEach((l) =>
        gsap.fromTo(l, { autoAlpha: 0, y: 26 }, {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: { trigger: l, start: "top 90%", toggleActions: "play none none reverse" },
        }),
      );
      return null;
    }
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: el,
        start: "top top",
        end: () => `+=${Math.round(window.innerHeight * screens)}`,
        pin: true,
        scrub: 0.7,
        invalidateOnRefresh: true,
        onUpdate: onUpdate ? (s) => onUpdate(s.progress) : undefined,
      },
    });
    build(tl, el);
    return tl;
  }

  // ---------- scenes ----------

  // 0 Opening: the clinic doors slide apart and we walk into the consulting room;
  //   then the mark and the line arrive, and the crescent glows once.
  root.classList.add("intro");
  const s0 = scene("0");
  const fadeIn = (p: number) => Math.min(1, Math.max(0, (p - 0.3) / 0.12));
  let s0Active = true;
  const s0tl = pin("0", 2.8, (tl, el) => {
    const doorL = $(".entry__door--l", el);
    const doorR = $(".entry__door--r", el);
    const entry = $(".entry", el);
    tl.to($(".entry__cue", el), { autoAlpha: 0, duration: 0.25 }, 0);
    tl.to(doorL, { xPercent: -102, duration: 1.15, ease: "power2.inOut" }, 0.1);
    tl.to(doorR, { xPercent: 102, duration: 1.15, ease: "power2.inOut" }, 0.1);
    // walking forward: the doorway grows past us
    tl.fromTo(entry, { scale: 1 }, { scale: 1.22, duration: 1.3, ease: "power1.in" }, 0);
    tl.to($$(".entry__header, .entry__track", el), { autoAlpha: 0, duration: 0.35 }, 0.95);
    // the logo on the black glass lifts away as the doors part
    const logo = $(".entry__logo", el);
    tl.to($(".entry__kicker", el), { autoAlpha: 0, y: -16, duration: 0.3 }, 0.05);
    tl.to(logo, { y: -60, scale: 0.86, autoAlpha: 0, filter: "blur(6px)", duration: 0.7, ease: "power2.in" }, 0.1);

    tl.set(entry, { autoAlpha: 0 }, 1.32);
    const [kicker, line, cue] = $$(".s0__copy .ln", el);
    show(tl, kicker, 1.2);
    show(tl, line, 1.35, 1);
    show(tl, cue, 1.7);
    tl.to(P.cresGlow, { keyframes: [{ opacity: 0.9, duration: 0.35 }, { opacity: 0, duration: 0.5 }] }, 1.4);
    tl.to($(".s0__copy", el), { autoAlpha: 0, y: -40, duration: 0.7 }, 2.3);
    tl.to({}, { duration: 0.2 });
  }, (p) => {
    if (s0Active) mark.setFade(fadeIn(p));
  });
  mark.setFade(0);

  // 1 The report looks good
  pin("1", 3.2, (tl, el) => {
    own(tl, P.largerGlow, { opacity: 0 });
    const ls = $$(".ln", el);
    ls.forEach((l, i) => show(tl, l, 0.2 + i * 0.9 + (i >= 4 ? 0.4 : 0) + (i === ls.length - 1 ? 0.6 : 0)));
    const at = 0.2 + (ls.length - 1) * 0.9 + 1.0;
    tl.to(P.largerGlow, {
      keyframes: [
        { opacity: 0.45, duration: 0.5 },
        { opacity: 0.1, duration: 0.6 },
        { opacity: 0.35, duration: 0.5 },
        { opacity: 0.08, duration: 0.6 },
      ],
    }, at + 0.3);
  });

  /** Scenes 2 and 8: a big photo takes the stage as its fragment arrives, then gives way. */
  function evidence(tl: gsap.core.Timeline, el: HTMLElement, at: (i: number) => number, end: number, clean: boolean) {
    const shots = $$(".shot", el);
    shots.forEach((shot, k) => {
      const i = Number(shot.dataset.for);
      const tilt = clean ? 0 : k % 2 ? -2.4 : 2.2;
      const t0 = at(i) + 0.05;
      tl.fromTo(shot, { autoAlpha: 0, y: 70, rotation: tilt * 3, scale: 0.94 }, {
        autoAlpha: 1, y: 0, rotation: tilt, scale: 1, duration: 0.6, ease: "power3.out",
      }, t0);
      // the clean scene keeps every photo in view (they stack); the case file swaps them
      const next = clean ? end : shots[k + 1] ? at(Number(shots[k + 1].dataset.for)) : end;
      tl.to(shot, { autoAlpha: 0, y: -40, duration: 0.45, ease: "power1.in" }, Math.max(t0 + 0.7, next - 0.1));
    });
  }

  // 2 Everything in between: fragments scribbled in the margin, each with its photo; the dot
  //   leaves, the lifeline drifts off and its readings fade before they reach the circle.
  const ll2 = createLifeline($('[data-lifeline="broken"]'));
  pin("2", 5.6, (tl, el) => {
    own(tl, P.segs, { opacity: 0 });
    own(tl, P.dot, { opacity: 1, x: 0, y: 0 });
    own(tl, P.hole, { attr: { r: 169 } });
    const wrap = $(".lifeline", el);
    const frags = $$(".frag", el);
    const lead = $(".s2__lead", el);
    show(tl, lead, 0.1);
    tl.fromTo(wrap, { autoAlpha: 0, x: 0 }, { autoAlpha: 1, duration: 0.3 }, 0.8);
    tl.to(P.dot, { opacity: 0, duration: 0.25 }, 0.85);
    tl.to(P.hole, { attr: { r: 0 }, duration: 0.6 }, 0.9);
    const step = 1.4;
    const at = (i: number) => 1.0 + i * step;
    const line = { p: 0 };
    tl.fromTo(line, { p: 0 }, { p: 1, duration: frags.length * step, onUpdate: () => ll2.broken(line.p) }, 0.85);
    frags.forEach((f, i) => {
      show(tl, f, at(i));
      tl.to(P.segs[i], {
        keyframes: [
          { opacity: 0.8, duration: 0.1 },
          { opacity: 0.08, duration: 0.08 },
          { opacity: 0.55, duration: 0.07 },
          { opacity: 0, duration: 0.4 },
        ],
      }, at(i) + 0.15);
      if (i > 0) tl.to(frags[i - 1], { opacity: 0.4, duration: 0.5 }, at(i));
    });
    const dark = at(frags.length) + 0.3;
    evidence(tl, el, at, dark, false);
    hide(tl, [lead, ...frags], dark, 0.8);
    tl.to($(".plate", el), { "--dim": 0.16, duration: 1.1 }, dark);
    tl.to(wrap, { autoAlpha: 0, x: 80, duration: 1.1 }, dark);
    const after = $$(".s2__after .ln", el);
    show(tl, after[0], dark + 1.0);
    show(tl, after[1], dark + 1.9);
    tl.to({}, { duration: 0.8 });
  });

  // 3 The scorecard: the mark multiplies into a field. Thirteen marks gather and one fills;
  //   "1 in 13" opens up; sugar, blood pressure and cholesterol fly in to take their places.
  pin("3", 4.6, (tl, el) => {
    const field = $(".markfield", el);
    const fm = $$(".fm", el);
    tl.fromTo(fm, { autoAlpha: 0, scale: 0.55 }, { autoAlpha: 1, scale: 1, duration: 1.3, stagger: { amount: 1.1, from: "center", grid: "auto" } }, 0);
    tl.fromTo($$(".fm__full", el), { opacity: 0 }, { opacity: 1, duration: 0.5, stagger: 0.08 }, 1.2);
    show(tl, $(".s3__intro", el), 0.4);
    // focus: the field steps back while thirteen marks gather in a row
    tl.to(field, { opacity: 0.32, scale: 0.96, duration: 0.8 }, 1.3);
    const th = $$(".th", el);
    tl.fromTo(th, {
      autoAlpha: 0,
      x: (i: number) => (i - 6) * 70 + Math.sin(i * 2.3) * 160,
      y: (i: number) => 140 + Math.cos(i * 1.7) * 120,
      scale: 0.3,
    }, { autoAlpha: 1, x: 0, y: 0, scale: 1, duration: 0.9, ease: "power3.out", stagger: 0.04 }, 1.4);
    tl.fromTo($(".th--lit", el), { scale: 1 }, { keyframes: [{ scale: 1.8, duration: 0.25 }, { scale: 1, duration: 0.45 }] }, 2.35);
    const stat = $(".stat", el);
    // the reveal opens from the centre; the mask runs well past the text so its glow is never cut
    tl.fromTo(stat, { autoAlpha: 0, scale: 1.25, clipPath: "inset(-60% 50% -60% 50%)" }, {
      autoAlpha: 1, scale: 1, clipPath: "inset(-60% -40% -60% -40%)", duration: 0.9, ease: "power3.out",
    }, 2.5);
    const abc = $(".s3__abc", el);
    show(tl, abc, 3.2, 0.5);
    const words = $$(".abc", el);
    const from = [{ x: "-45vw", y: 0 }, { x: 0, y: "38vh" }, { x: "45vw", y: 0 }];
    words.forEach((w, i) => {
      tl.fromTo(w, { ...from[i], autoAlpha: 0, backgroundSize: "0% 3px" }, {
        x: 0, y: 0, autoAlpha: 1, duration: 0.8, ease: "power3.out",
      }, 3.3 + i * 0.3);
      tl.to(w, { backgroundSize: "100% 3px", duration: 0.4 }, 3.9 + i * 0.3);
    });
    show(tl, $(".s3__a .source", el), 4.6);
    // the second thought: everyone behind them
    tl.to($(".s3__a", el), { autoAlpha: 0, y: -40, duration: 0.6 }, 5.3);
    tl.to(field, { opacity: 0.75, scale: 1.18, duration: 1.6, ease: "power1.inOut" }, 5.3);
    const behind = $(".s3__behind", el);
    show(tl, behind, 5.8, 0.9);
    tl.fromTo($$(".s3__behind strong", el), { backgroundSize: "0% 0.32em" }, { backgroundSize: "100% 0.32em", duration: 0.5, stagger: 0.4 }, 6.3);
    show(tl, $(".s3__b .source", el), 6.8);
    tl.to(field, { opacity: 0.4, duration: 0.6 }, 7.3);
    show(tl, $(".s3__not", el), 7.4);
    tl.to({}, { duration: 0.8 });
  });

  // 4 Where he goes next: each line steps up close, then walks off down the corridor into
  //   its vanishing point, the way the patient does. Then one line is left.
  pin("4", 4.2, (tl, el) => {
    own(tl, P.dot, { opacity: 1, x: 0, y: 0 });
    own(tl, P.hole, { attr: { r: 169 } });
    const ls = $$(".s4__l", el);
    // the corridor's far end in the photo (desktop crop / phone crop)
    const vp = () => (phone ? { x: 0.62, y: 0.3 } : { x: 0.69, y: 0.27 });
    const toVP = (t: Element) => {
      const r = t.getBoundingClientRect();
      const v = vp();
      return { x: window.innerWidth * v.x - (r.left + r.width / 2), y: window.innerHeight * v.y - (r.top + r.height / 2) };
    };
    ls.forEach((l, i) => {
      const at = 0.2 + i * 1.0;
      tl.fromTo(l, { autoAlpha: 0, scale: 1.18, y: 30, filter: "blur(6px)" }, { autoAlpha: 1, scale: 1, y: 0, filter: "blur(0px)", duration: 0.5, ease: "power2.out" }, at);
      tl.to(l, {
        x: () => toVP(l).x,
        y: () => toVP(l).y,
        scale: 0.12,
        autoAlpha: 0,
        filter: "blur(2px)",
        duration: 0.7,
        ease: "power2.in",
      }, at + 0.75);
    });
    const out = 0.2 + ls.length * 1.0;
    tl.to(P.dot, { x: 3200, y: -1500, opacity: 0, duration: 1.2, ease: "power1.in" }, out - 0.9);
    tl.to(P.hole, { attr: { r: 0 }, duration: 0.8 }, out - 0.4);
    tl.fromTo($(".alone", el), { autoAlpha: 0, scale: 1.3, letterSpacing: "0.06em" }, {
      autoAlpha: 1, scale: 1, letterSpacing: "0em", duration: 1, ease: "power3.out",
    }, out + 0.1);
    tl.to({}, { duration: 0.8 });
  });

  // 5 Nobody taught you this: four beats, one at a time, as the light warms.
  pin("5", 5, (tl, el) => {
    tl.fromTo($(".veil--warm", el), { opacity: 0.35 }, { opacity: 1, duration: 8 }, 0);
    const beat = (k: string) => $(`.beat--${k}`, el);
    // a: what college taught, and what it did not
    show(tl, $(".s5__college", el), 0.2, 0.9);
    show(tl, $(".s5__nobody", el), 0.9);
    hide(tl, $$(".ln", beat("a")), 1.9);
    // b: the four things, each arriving on its own
    tl.fromTo($(".s5__pills", el), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, 2.3);
    tl.fromTo($$(".pill", el), { opacity: 0, y: 40, scale: 0.85 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "back.out(1.6)", stagger: 0.35 }, 2.3);
    tl.fromTo($(".s5__know", el), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5 }, 3.9);
    hide(tl, $(".s5__pills", el), 4.6);
    // c: the research, the six things lighting up as they are named
    show(tl, $(".s5__research", el), 5.0, 0.8);
    tl.fromTo($$(".hl", el), { "--hl": "0%" }, { "--hl": "100%", duration: 0.35, stagger: 0.22 }, 5.5);
    show(tl, $(".s5__nodoc", el), 7.0);
    hide(tl, $$(".ln", beat("c")), 7.9);
    // d: the line the scene was building to
    tl.fromTo($(".beat--d .ln", el), { autoAlpha: 0, y: 30, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 1.2, ease: "power3.out" }, 8.3);
    tl.to({}, { duration: 0.9 });
  });

  // 6 Two doors: a spotlight on each in turn, each with its own character; then both dim
  //   and a light opens in the space between them, for a third.
  pin("6", 3.8, (tl, el) => {
    const [lead, one, two, last] = $$(".ln", el);
    const wide = $(".doors__wide", el);
    const shadeOne = $(".s6__shade--one", el);
    const shadeTwo = $(".s6__shade--two", el);
    own(tl, wide, { scale: 1.06, xPercent: 0 });
    show(tl, lead, 0.2);
    tl.to(shadeTwo, { opacity: 1, duration: 0.5 }, 0.9);
    tl.to(wide, { xPercent: 2.4, duration: 0.8, ease: "power2.inOut" }, 0.9);
    tl.fromTo(one, { autoAlpha: 0, x: -80 }, { autoAlpha: 1, x: 0, duration: 0.7, ease: "power3.out" }, 1.1);
    tl.to(shadeTwo, { opacity: 0, duration: 0.5 }, 2.1);
    tl.to(shadeOne, { opacity: 1, duration: 0.5 }, 2.1);
    tl.to(one, { opacity: 0.4, duration: 0.5 }, 2.1);
    tl.to(wide, { xPercent: -2.4, duration: 1, ease: "power2.inOut" }, 2.1);
    tl.fromTo(two, { autoAlpha: 0, x: 80 }, { autoAlpha: 1, x: 0, duration: 0.7, ease: "power3.out" }, 2.3);
    // neither: both doors fall back, the gap between them begins to glow
    tl.to([shadeOne, shadeTwo], { opacity: 0.72, duration: 0.7 }, 3.3);
    tl.to(wide, { xPercent: 0, duration: 0.8 }, 3.3);
    tl.to([lead, one, two], { opacity: phone ? 0 : 0.18, duration: 0.6 }, 3.3);
    tl.to($(".s6__third", el), { opacity: 1, scaleX: 1, duration: 1.1, ease: "power2.inOut" }, 3.5);
    show(tl, last, 3.7);
    tl.to({}, { duration: 0.8 });
  });

  // 7 Fifteen years, one disease: the founder walks in from the left, into the clinic.
  pin("7", 3, (tl, el) => {
    // the photo slides in from the right as a panel, the picture inside drifting the other way
    const office = $(".office", el);
    tl.fromTo(office, { xPercent: 100 }, { xPercent: 0, duration: 1.3, ease: "power3.out" }, 0);
    tl.fromTo($("img", office), { xPercent: -18, scale: 1.12 }, { xPercent: 0, scale: 1, duration: 1.6, ease: "power3.out" }, 0);
    const ls = $$(".ln", el);
    ls.forEach((l, i) => show(tl, l, 0.9 + i * 0.6));
    tl.to({}, { duration: 0.8 });
  });

  // 8 In between, again: the same fragments, held. Each section fills; the dot comes home;
  //   the identical lifeline returns and its readings travel into the circle.
  const ll8 = createLifeline($('[data-lifeline="held"]'));
  pin("8", 6, (tl, el) => {
    own(tl, P.segs, { opacity: 0 });
    own(tl, P.base, { opacity: 1 });
    own(tl, P.dot, { opacity: 0, x: 900, y: -420 });
    own(tl, P.hole, { attr: { r: 0 } });
    const wrap = $(".lifeline", el);
    const frags = $$(".frag", el);
    const lead = $(".s8__lead", el);
    show(tl, lead, 0.1);
    tl.to(P.dot, { opacity: 1, x: 0, y: 0, duration: 1, ease: "power2.inOut" }, 0.4);
    tl.to(P.hole, { attr: { r: 169 }, duration: 0.7 }, 0.9);
    const s = { draw: 0, t: [0, 0, 0, 0, 0] };
    const render = () => ll8.held(s.draw, s.t);
    tl.fromTo(wrap, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 1.0);
    tl.fromTo(s, { draw: 0 }, { draw: 1, duration: 1.0, onUpdate: render }, 1.0);
    const step = 1.35;
    const at = (i: number) => 2.0 + i * step;
    frags.forEach((f, i) => {
      show(tl, f, at(i));
      if (i < ll8.count) {
        const proxy = { v: 0 };
        tl.fromTo(proxy, { v: 0 }, { v: 1, duration: 0.9, ease: "power1.inOut", onUpdate: () => { s.t[i] = proxy.v; render(); } }, at(i) + 0.1);
      }
      tl.to(P.segs[i], { opacity: 1, duration: 0.5 }, at(i) + 0.7);
      if (i > 0) tl.to(frags[i - 1], { opacity: 0.55, duration: 0.5 }, at(i));
    });
    const done = at(frags.length);
    evidence(tl, el, at, done, true);
    tl.to(P.base, { opacity: 0, duration: 0.5 }, done - 0.4);
    hide(tl, [lead, ...frags], done + 0.2, 0.8);
    const after = $$(".s8__after .ln", el);
    show(tl, after[0], done + 1.0);
    show(tl, after[1], done + 1.9);
    tl.to({}, { duration: 0.8 });
  });

  // 9 The third door
  pin("9a", 1.6, (tl, el) => {
    show(tl, $(".ln", el), 0.3, 1);
    tl.to({}, { duration: 0.6 });
  });
  // the circle: what sits by the crescent, then what runs along the larger part
  let s9bActive = false;
  const s9bSlot = $(".s9b .slot--map");
  pin("9b", 3.8, (tl, el) => {
    own(tl, [P.cresGlow, P.largerGlow], { opacity: 0 });
    show(tl, $(".s9b__lead", el), 0.1);
    const items = $$(".orbit__item", el);
    const clinic = items.filter((i) => i.dataset.part === "clinic");
    const life = items.filter((i) => i.dataset.part === "life");
    const isL = (it: HTMLElement) => it.classList.contains("orbit__item--l");
    const outFrom = (it: HTMLElement) => (isL(it) ? -24 : 24);
    // GSAP owns the transform, so it carries the anchoring too (left labels hang off their point)
    const anchor = (it: HTMLElement) => (phone ? {} : { xPercent: isL(it) ? -100 : 0, yPercent: -50 });
    // leaders are (re)built by the layout; animate whichever exist, matched by item index
    const leaderOf = (i: number) => el.querySelector(`.orbit__leader[data-i="${i}"]`);
    const leaderTweens: { i: number; at: number }[] = [];
    const showLeader = (it: HTMLElement, at: number) => leaderTweens.push({ i: items.indexOf(it), at });
    tl.to(P.cresGlow, { keyframes: [{ opacity: 0.75, duration: 0.5 }, { opacity: 0.1, duration: 0.9 }] }, 0.8);
    clinic.forEach((it, i) => showLeader(it, 0.9 + i * 0.4));
    life.forEach((it, i) => showLeader(it, 2.1 + i * 0.32));
    const proxies = leaderTweens.map(({ i, at }) => {
      const pr = { v: 0 };
      const paint = () => {
        const g = leaderOf(i) as SVGGElement | null;
        if (!g) return;
        g.style.opacity = Math.min(1, pr.v * 3).toFixed(3);
        const path = g.querySelector("path");
        if (path) {
          path.style.strokeDasharray = "1 1";
          path.style.strokeDashoffset = String(1 - pr.v);
        }
      };
      tl.fromTo(pr, { v: 0 }, { v: 1, duration: 0.45, onUpdate: paint }, at);
      return { i, pr };
    });
    el.querySelector(".orbit")?.addEventListener("orbit:layout", () => proxies.forEach(({ i, pr }) => {
      const g = leaderOf(i) as SVGGElement | null;
      if (!g) return;
      g.style.opacity = Math.min(1, pr.v * 3).toFixed(3);
      const path = g.querySelector("path");
      if (path) {
        path.style.strokeDasharray = "1 1";
        path.style.strokeDashoffset = String(1 - pr.v);
      }
    }));
    clinic.forEach((it, i) => tl.fromTo(it, { ...anchor(it), autoAlpha: 0, x: outFrom(it), scale: 0.9 }, { ...anchor(it), autoAlpha: 1, x: 0, scale: 1, duration: 0.6, ease: "power3.out" }, 0.9 + i * 0.4));
    tl.to(P.largerGlow, { keyframes: [{ opacity: 0.65, duration: 0.8 }, { opacity: 0, duration: 1.6 }] }, 2.0);
    life.forEach((it, i) => tl.fromTo(it, { ...anchor(it), autoAlpha: 0, x: outFrom(it), scale: 0.9 }, { ...anchor(it), autoAlpha: 1, x: 0, scale: 1, duration: 0.6, ease: "power3.out" }, 2.1 + i * 0.32));
    const close = $$(".s9b__close .ln", el);
    show(tl, close[0], 4.5);
    show(tl, close[1], 5.0);
    tl.to({}, { duration: 0.8 });
  }, (p) => {
    if (!s9bActive || phone) return;
    const k = Math.min(1, Math.max(0, (p - 0.06) / 0.08));
    mark.setFade(1 - k);
    s9bSlot.style.setProperty("--static", k.toFixed(3));
  });

  // 10 Built to outlast: the mark with its system turning around it, generation after
  //   generation; the four kinds of doctor light up as they are named.
  pin("10", 2.6, (tl, el) => {
    const rings = $$(".sys__ring", el);
    tl.fromTo(rings, { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.9, stagger: 0.25, ease: "power3.out" }, 0.1);
    tl.fromTo(rings[0], { "--spin": "0deg" }, { "--spin": "90deg", duration: 4, ease: "none" }, 0);
    tl.fromTo(rings[1], { "--spin": "0deg" }, { "--spin": "-60deg", duration: 4, ease: "none" }, 0);
    const ls = $$(".copy .ln", el);
    show(tl, ls[0], 0.4);
    show(tl, ls[1], 1.0, 0.9);
    show(tl, ls[2], 1.8);
    tl.fromTo($$(".who", el), { "--hl": "0%" }, { "--hl": "100%", duration: 0.35, stagger: 0.3 }, 2.2);
    tl.to({}, { duration: 0.5 });
  });

  // 11 How partnering works: one line runs through the four steps, a heartbeat between
  //    each. The steps slide onto the line, the line rolls up into a ring, the ring becomes
  //    the Sugar360 mark, and the wordmark comes up beside it.
  let s11Active = false;
  let t11: gsap.core.Timeline | null = null;
  const MARK_IN = [6.2, 6.5]; // timeline seconds over which the real mark takes over from the ring
  t11 = pin("11", 6.4, (tl, el) => {
    const line = $<SVGPathElement>(".journey__line", el);
    const track = $<SVGPathElement>(".journey__track", el);
    const nodes = $$<SVGCircleElement>(".journey__node", el);
    const steps = $$(".step", el);
    const logo = $(".journey__logo", el);
    const word = $(".journey__word", el);
    const roll = { p: 1 };
    const shape = () => {
      const d = journeyPath(roll.p);
      line.setAttribute("d", d);
      track.setAttribute("d", d);
      nodes.forEach((n, i) => {
        const q = journeyPoint(roll.p, STEP_AT[i]);
        n.setAttribute("cx", q.x.toFixed(1));
        n.setAttribute("cy", q.y.toFixed(1));
      });
    };
    own(tl, roll, { p: 1, onUpdate: shape });
    own(tl, [line, track], { strokeWidth: 3, opacity: 1 });
    own(tl, logo, { xPercent: 0 });
    show(tl, $(".display", el), 0.1);
    // 1. the flow: a white head runs the line, slows into each checkpoint and rests there
    //    while its step comes up, then runs on through the heartbeat to the next
    const comets = $$<SVGPathElement>(".journey__comet", el);
    const head = $<SVGCircleElement>(".journey__head", el);
    const halo = $<SVGCircleElement>(".journey__halo", el);
    const ripples = $$<SVGCircleElement>(".journey__ripple", el);
    const L = line.getTotalLength();
    // fraction of the path's length where each checkpoint sits (blips make it non-linear)
    const fracAt = (x: number) => {
      let lo = 0, hi = L;
      for (let k = 0; k < 30; k++) {
        const m = (lo + hi) / 2;
        if (line.getPointAtLength(m).x < x) lo = m;
        else hi = m;
      }
      return lo / L;
    };
    const stops = STEP_AT.map((s) => fracAt(s * 1200));
    const flow = { v: 0 };
    const paint = () => {
      const v = flow.v;
      line.style.strokeDashoffset = String(1 - v);
      for (const c of comets) c.style.strokeDashoffset = String(0.06 - v);
      const q = line.getPointAtLength(v * L);
      for (const c of [head, halo]) {
        c.setAttribute("cx", q.x.toFixed(1));
        c.setAttribute("cy", q.y.toFixed(1));
      }
    };
    tl.fromTo(line, { strokeDasharray: "1 1", strokeDashoffset: 1 }, { strokeDashoffset: 1, duration: 0.001 }, 0);
    tl.fromTo(flow, { v: 0 }, { v: 0, duration: 0.001, onUpdate: paint }, 0);
    tl.fromTo([head, halo, ...comets], { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0.35);
    let t = 0.4;
    stops.forEach((f, i) => {
      const run = i === 0 ? 0.9 : 1.1;
      tl.to(flow, { v: f, duration: run, ease: "power2.inOut", onUpdate: paint }, t);
      t += run;
      // arrival: the checkpoint fills, a ripple goes out, the head swells, the step comes up
      tl.fromTo(nodes[i], { scale: 1, transformOrigin: "50% 50%", fill: "#0F1A2B" }, { keyframes: [{ scale: 1.6, fill: "#ffffff", duration: 0.15 }, { scale: 1, duration: 0.3 }] }, t - 0.05);
      tl.fromTo(ripples[i], { scale: 1, opacity: 0.9, transformOrigin: "50% 50%" }, { scale: 4, opacity: 0, duration: 0.7, ease: "power2.out" }, t - 0.05);
      tl.fromTo(halo, { scale: 1, transformOrigin: "50% 50%" }, { keyframes: [{ scale: 1.8, duration: 0.15 }, { scale: 1, duration: 0.35 }] }, t - 0.05);
      tl.fromTo(steps[i], { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out" }, t);
      if (phone && i > 0) tl.to(steps[i - 1], { autoAlpha: 0, y: -20, duration: 0.3 }, t);
      t += 0.55; // rest at the checkpoint
    });
    // after the last step the flow runs out to the end of the line
    tl.to(flow, { v: 1, duration: 0.5, ease: "power1.in", onUpdate: paint }, t);
    tl.to([head, halo, ...comets], { opacity: 0, duration: 0.3 }, t + 0.35);
    const shift = t + 0.6 - 4.0; // everything after starts once the flow is done
    // 2. the steps slide up onto their points on the line
    const toNode = (i: number) => {
      const c = steps[i].getBoundingClientRect();
      const n = nodes[i].getBoundingClientRect();
      return { x: n.left + n.width / 2 - (c.left + c.width / 2), y: n.top + n.height / 2 - (c.top + c.height / 2) };
    };
    const onto = 4.0 + shift;
    tl.to(steps, {
      x: (i: number) => toNode(i).x,
      y: (i: number) => toNode(i).y,
      scale: 0.08,
      autoAlpha: 0,
      duration: 0.7,
      ease: "power2.in",
      stagger: 0.08,
    }, onto);
    tl.to(nodes, { scale: 1.5, duration: 0.2, stagger: 0.08 }, onto + 0.55);
    tl.to(nodes, { scale: 1, duration: 0.25 }, onto + 0.9);
    // 3. the line rolls up into a ring and thickens to the mark's band
    tl.to(track, { opacity: 0, duration: 0.3 }, 4.8 + shift);
    tl.to(roll, { p: 0, duration: 1.4, ease: "power1.inOut", onUpdate: shape }, 4.9 + shift);
    tl.to(line, { strokeWidth: RING.band, duration: 0.7, ease: "power2.inOut" }, 5.6 + shift);
    tl.to(nodes, { autoAlpha: 0, duration: 0.3 }, 5.9 + shift);
    MARK_IN[0] = 6.2 + shift;
    MARK_IN[1] = 6.5 + shift;
    // 4. the ring becomes the mark (the fixed mark fades in on top, see onUpdate), then the name
    tl.to(line, { opacity: 0, duration: 0.3 }, MARK_IN[0] + 0.1);
    tl.to(logo, { xPercent: -115.3, duration: 0.8, ease: "power3.inOut" }, 6.7 + shift);
    tl.fromTo(word, { autoAlpha: 0, clipPath: "inset(0% 100% 0% 0%)" }, { autoAlpha: 1, clipPath: "inset(0% 0% 0% 0%)", duration: 0.8, ease: "power3.inOut" }, 6.75 + shift);
    tl.to({}, { duration: 0.9 });
  }, (p) => {
    if (!s11Active || !t11) return;
    const t = p * t11.duration();
    mark.setFade(Math.min(1, Math.max(0, (t - MARK_IN[0]) / (MARK_IN[1] - MARK_IN[0]))));
  });

  // 12 Close the circle: the smaller part is named by the crescent, the larger by the rest;
  //   then one circle, and the mark settles into the logo.
  const s12 = scene("12");
  const closeSlot = slotOf(s12, "close");
  const finalSlot = slotOf(s12, "final");
  const finalImg = $(".final-logo img", s12);
  let s12Active = false;
  pin("12", 4.4, (tl, el) => {
    own(tl, [P.cresGlow, P.largerGlow], { opacity: 0 });
    const sideL = $(".s12__side--l", el);
    const sideR = $(".s12__side--r", el);
    tl.fromTo(sideL, { autoAlpha: 0, x: -50 }, { autoAlpha: 1, x: 0, duration: 0.7, ease: "power3.out" }, 0.2);
    tl.to(P.cresGlow, { keyframes: [{ opacity: 0.85, duration: 0.4 }, { opacity: 0.25, duration: 0.6 }] }, 0.2);
    if (phone) tl.to(sideL, { autoAlpha: 0, duration: 0.4 }, 1.0);
    tl.fromTo(sideR, { autoAlpha: 0, x: 50 }, { autoAlpha: 1, x: 0, duration: 0.7, ease: "power3.out" }, 1.1);
    tl.to(P.largerGlow, { keyframes: [{ opacity: 0.75, duration: 0.4 }, { opacity: 0.2, duration: 0.6 }] }, 1.1);
    show(tl, $(".s12__one", el), 2.0, 0.8);
    tl.to([P.cresGlow, P.largerGlow], { keyframes: [{ opacity: 0.8, duration: 0.4 }, { opacity: 0, duration: 0.7 }] }, 2.0);
    hide(tl, [sideL, sideR, $(".s12__one", el)], 3.0, 0.6);
    const end = $$(".s12__end .ln", el);
    show(tl, end[0], 3.4);
    show(tl, end[1], 3.8, 0.9);
    show(tl, $(".cta", el), 4.5);
    tl.to({}, { duration: 1 });
  }, (p) => {
    if (!s12Active) return;
    // as the closing lines arrive, the mark moves onto the logo's icon, then the logo takes over
    const settle = Math.min(1, Math.max(0, (p - 0.6) / 0.14));
    const swap = Math.min(1, Math.max(0, (p - 0.76) / 0.1));
    mark.setSlot(closeSlot);
    mark.setBlend(settle > 0 ? closeSlot : null, finalSlot, settle);
    mark.setFade(1 - swap);
    finalImg.style.opacity = swap.toFixed(3);
  });

  // ---------- which scene the mark belongs to ----------
  const ROLE: Record<string, { slot?: string; look?: Look }> = {
    "0": { slot: "hero", look: { segs: 0, base: 1, dot: 1, dotAt: [0, 0], hole: 169, largerGlow: 0 } },
    "1": { slot: "corner", look: { segs: 0, base: 1, dot: 1, dotAt: [0, 0], hole: 169 } },
    "2": { slot: "line", look: { base: 1, cresGlow: 0, largerGlow: 0 } },
    "3": {},
    "4": { slot: "corner", look: { segs: 0, base: 1, cresGlow: 0, largerGlow: 0 } },
    "5": { slot: "side", look: { segs: 0, base: 1, dot: 0, hole: 0, cresGlow: 0, largerGlow: 0 } },
    "6": {},
    "7": {},
    "8": { slot: "line", look: { cresGlow: 0, largerGlow: 0 } },
    "9a": {},
    "9b": { slot: "map", look: { segs: 1, base: 0, dot: 0, dotAt: [0, 0], hole: 0 } },
    "10": { slot: "side", look: FULL },
    "11": { slot: "steps", look: FULL },
    "12": { slot: "close", look: { segs: 1, base: 0, dot: 1, dotAt: [0, 0], hole: 169 } },
  };

  const spacer = (el: Element) => (el.parentElement?.classList.contains("pin-spacer") ? el.parentElement : el);

  $$("[data-scene]").forEach((el) => {
    const id = el.dataset.scene!;
    const role = ROLE[id] ?? {};
    ScrollTrigger.create({
      trigger: spacer(el),
      start: "top 55%",
      end: "bottom 55%",
      onToggle: (self) => {
        if (id === "12") s12Active = self.isActive;
        if (id === "0") s0Active = self.isActive;
        if (id === "11") s11Active = self.isActive;
        if (id === "9b") {
          s9bActive = self.isActive;
          if (!self.isActive) s9bSlot.style.setProperty("--static", "0");
        }
        if (!self.isActive) return;
        mark.setFade(id === "0" ? fadeIn(s0tl?.scrollTrigger?.progress ?? 0) : id === "11" ? 0 : 1);
        if (id !== "12") {
          finalImg.style.opacity = "0";
          mark.setBlend(null, null, 0);
        }
        mark.setSlot(role.slot ? slotOf(el, role.slot) : null);
        if (role.look) mark.look(role.look);
        else mark.clearLooks();
      },
    });
  });

  // ---------- photos ----------
  type PlateHandle = NonNullable<ReturnType<NonNullable<Depth>["add"]>>;
  const handles: PlateHandle[] = [];
  $$(".plate").forEach((plate) => {
    const sec = plate.closest("[data-scene]")!;
    const h = depth?.add(plate) ?? null;
    if (h) handles.push(h);
    const img = $("img", plate);
    const calm = plate.dataset.calm !== undefined;
    ScrollTrigger.create({
      trigger: spacer(sec),
      start: "top bottom",
      end: "bottom top",
      onUpdate: (s) => {
        if (h) h.p = s.progress;
        // plain-image drift for when depth is off (or not ready yet)
        img.style.transform = calm
          ? "none"
          : `translate3d(0, ${((s.progress - 0.5) * -4).toFixed(2)}%, 0) scale(1.08)`;
      },
    });
  });

  // ---------- every frame ----------
  const fine = matchMedia("(pointer: fine)").matches;
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  const onMove = (e: PointerEvent) => {
    ptr.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    ptr.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  };
  if (fine) window.addEventListener("pointermove", onMove, { passive: true });

  // if the device cannot hold ~30fps with depth on, fall back to plain photos
  let slowFrames = 0;
  let sampled = 0;
  const frame = (_t: number, deltaMs: number) => {
    const dt = Math.min(0.1, deltaMs / 1000);
    mark.frame(dt);
    const k = 1 - Math.exp(-dt * 3);
    ptr.x += (ptr.tx - ptr.x) * k;
    ptr.y += (ptr.ty - ptr.y) * k;
    if (depth?.active) {
      depth.render([ptr.x * -0.012, ptr.y * 0.008]);
      if (lenis.isScrolling && sampled < 240) {
        sampled++;
        if (deltaMs > 34) slowFrames++;
        if (sampled === 240 && slowFrames > 120) depth.disable();
      }
    }
  };
  gsap.ticker.add(frame);

  // fonts and lazy images change heights; re-measure once things settle
  const refresh = () => ScrollTrigger.refresh();
  document.fonts?.ready.then(refresh);
  window.addEventListener("load", refresh, { once: true });

  return () => {
    gsap.ticker.remove(frame);
    gsap.ticker.remove(raf);
    window.removeEventListener("pointermove", onMove);
    ScrollTrigger.getAll().forEach((t) => t.kill());
    lenis.destroy();
    depth?.destroy();
    root.classList.remove("motion");
  };
}

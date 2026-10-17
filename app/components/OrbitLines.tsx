"use client";

import { useEffect, useRef } from "react";

// Scene 9: every item is pinned to the logo itself. Pharmacy and diagnostics sit on the
// crescent (in the clinic); the rest sit along the larger part (between visits). Labels
// stand in tidy, evenly spaced columns, each joined to its point by a clean elbow leader.
// Mark geometry, as fractions of the mark box width: ring centre 47.49% across, the band
// runs from radius 446 to 642 of 1352, so its middle is at 544.
const MID = 544 / 1352;
const OUT = 642 / 1352;
const GAP = 64; // px from the ring's edge to the label column
const ROW = 74; // px between label rows

export function OrbitLines({ sides, angles }: { sides: ("l" | "r")[]; angles: number[] }) {
  const svg = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = svg.current!;
    const orbit = el.parentElement!;
    const slot = orbit.querySelector<HTMLElement>(".slot--map")!;
    const items = Array.from(orbit.querySelectorAll<HTMLElement>(".orbit__item"));
    const wide = matchMedia("(min-width: 761px)");
    const NS = "http://www.w3.org/2000/svg";

    function layout() {
      if (!wide.matches) return;
      const o = orbit.getBoundingClientRect();
      const s = slot.getBoundingClientRect();
      const cx = s.left - o.left + s.width * 0.4749;
      const cy = s.top - o.top + s.height * 0.5;
      const rm = s.width * MID;
      const ro = s.width * OUT;
      el.setAttribute("viewBox", `0 0 ${o.width} ${o.height}`);
      const leaders = el.querySelector(".orbit__leaders")!;
      leaders.replaceChildren();
      for (const side of ["l", "r"] as const) {
        const idx = sides.map((sd, i) => (sd === side ? i : -1)).filter((i) => i >= 0);
        const n = idx.length;
        const dir = side === "r" ? 1 : -1;
        const colX = cx + dir * (ro + GAP);
        const elbowX = colX - dir * 22;
        idx.forEach((i, k) => {
          const a = (angles[i] * Math.PI) / 180;
          const nx = cx + Math.cos(a) * rm;
          const ny = cy + Math.sin(a) * rm;
          const y = cy + (k - (n - 1) / 2) * ROW;
          const g = document.createElementNS(NS, "g");
          g.setAttribute("class", `orbit__leader orbit__leader--${side}`);
          g.dataset.i = String(i);
          const path = document.createElementNS(NS, "path");
          path.setAttribute("d", `M${nx.toFixed(1)} ${ny.toFixed(1)} L${elbowX.toFixed(1)} ${y.toFixed(1)} L${(colX - dir * 8).toFixed(1)} ${y.toFixed(1)}`);
          path.setAttribute("pathLength", "1");
          const dot = document.createElementNS(NS, "circle");
          dot.setAttribute("cx", nx.toFixed(1));
          dot.setAttribute("cy", ny.toFixed(1));
          dot.setAttribute("r", "7");
          g.append(path, dot);
          leaders.append(g);
          items[i].style.left = `${colX.toFixed(1)}px`;
          items[i].style.top = `${y.toFixed(1)}px`;
        });
      }
      orbit.dispatchEvent(new Event("orbit:layout"));
    }

    layout();
    const r = new ResizeObserver(layout);
    r.observe(orbit);
    r.observe(slot);
    wide.addEventListener("change", layout);
    return () => {
      r.disconnect();
      wide.removeEventListener("change", layout);
    };
  }, [sides, angles]);

  return (
    <svg ref={svg} className="orbit__lines" aria-hidden="true">
      <g className="orbit__leaders" />
    </svg>
  );
}

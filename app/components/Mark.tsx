import { CRESCENT_D, DOT, LARGER_D, VIEWBOX, VIEWBOX_ATTR, wedges } from "@/lib/mark";

const GRAD_STOPS = (
  <>
    <stop offset="0" stopColor="#1D69B4" />
    <stop offset=".35" stopColor="#0F74BA" />
    <stop offset="1" stopColor="#1E8BCC" />
  </>
);

/** The single, story-telling mark. Fixed on screen; motion moves it between scene slots. */
export function Mark() {
  const ws = wedges();
  return (
    <svg
      id="mark"
      className="mark"
      viewBox={VIEWBOX_ATTR}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="mk-grad" gradientUnits="userSpaceOnUse" x1="448" y1="0" x2="1732" y2="0">
          {GRAD_STOPS}
        </linearGradient>
        <mask id="mk-gap" maskUnits="userSpaceOnUse" x="0" y="0" width="2250" height="2250">
          <rect width="2250" height="2250" fill="#fff" />
          <circle className="mk-gap-hole" cx={DOT.x} cy={DOT.y} r={DOT.gap} fill="#000" />
        </mask>
        <filter id="mk-blur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="38" />
        </filter>
        {ws.map((d, i) => (
          <clipPath id={`mk-w${i}`} key={i} clipPathUnits="userSpaceOnUse">
            <path d={d} />
          </clipPath>
        ))}
      </defs>
      <g mask="url(#mk-gap)">
        <path className="mk-larger-glow" d={LARGER_D} fill="url(#mk-grad)" filter="url(#mk-blur)" />
        <path className="mk-cres-glow" d={CRESCENT_D} fill="url(#mk-grad)" filter="url(#mk-blur)" />
        <path className="mk-larger-base" d={LARGER_D} />
        {ws.map((_, i) => (
          <path
            key={i}
            className="mk-seg"
            data-seg={i}
            d={LARGER_D}
            fill="url(#mk-grad)"
            clipPath={`url(#mk-w${i})`}
          />
        ))}
        <path className="mk-cres" d={CRESCENT_D} fill="url(#mk-grad)" />
      </g>
      <circle className="mk-dot" cx={DOT.x} cy={DOT.y} r={DOT.r} fill="#EC1D47" />
      <rect className="mk-box" x={VIEWBOX.x} y={VIEWBOX.y} width={VIEWBOX.w} height={VIEWBOX.h} fill="none" />
    </svg>
  );
}

/** Static mark for places that do not move (field, list bullets, fallbacks). */
export function MarkSprite() {
  return (
    <svg className="sprite" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="sp-grad" gradientUnits="userSpaceOnUse" x1="448" y1="0" x2="1732" y2="0">
          {GRAD_STOPS}
        </linearGradient>
        <mask id="sp-gap" maskUnits="userSpaceOnUse" x="0" y="0" width="2250" height="2250">
          <rect width="2250" height="2250" fill="#fff" />
          <circle cx={DOT.x} cy={DOT.y} r={DOT.gap} fill="#000" />
        </mask>
      </defs>
      {/* clinic only: crescent lit, the rest a faint outline */}
      <symbol id="sp-clinic" viewBox={VIEWBOX_ATTR}>
        <g mask="url(#sp-gap)">
          <path d={LARGER_D} className="sp-dim" />
          <path d={CRESCENT_D} fill="url(#sp-grad)" />
        </g>
        <circle cx={DOT.x} cy={DOT.y} r={DOT.r} fill="#EC1D47" />
      </symbol>
      {/* fully lit */}
      <symbol id="sp-full" viewBox={VIEWBOX_ATTR}>
        <g mask="url(#sp-gap)">
          <path d={LARGER_D} fill="url(#sp-grad)" />
          <path d={CRESCENT_D} fill="url(#sp-grad)" />
        </g>
        <circle cx={DOT.x} cy={DOT.y} r={DOT.r} fill="#EC1D47" />
      </symbol>
      {/* etched into the entrance glass: one colour, the gap still cut around the dot */}
      <symbol id="sp-etch" viewBox={VIEWBOX_ATTR}>
        <g mask="url(#sp-gap)">
          <path d={LARGER_D} fill="currentColor" />
          <path d={CRESCENT_D} fill="currentColor" />
        </g>
        <circle cx={DOT.x} cy={DOT.y} r={DOT.r} fill="currentColor" />
      </symbol>
      {/* lit, without the dot (Scene 9, where the points take the circle) */}
      <symbol id="sp-nodot" viewBox={VIEWBOX_ATTR}>
        <path d={LARGER_D} fill="url(#sp-grad)" />
        <path d={CRESCENT_D} fill="url(#sp-grad)" />
      </symbol>
      <symbol id="sp-cres" viewBox={VIEWBOX_ATTR}>
        <path d={CRESCENT_D} fill="url(#sp-grad)" />
      </symbol>
      <symbol id="sp-larger" viewBox={VIEWBOX_ATTR}>
        <g mask="url(#sp-gap)">
          <path d={LARGER_D} fill="url(#sp-grad)" />
        </g>
      </symbol>
    </svg>
  );
}

/**
 * Empty box marking where the mark should sit in a scene; the fixed mark glides onto it.
 * `look` draws a static mark inside it for readers without motion.
 */
export function Slot({
  name,
  className = "",
  look = "none",
}: {
  name: string;
  className?: string;
  look?: "clinic" | "full" | "nodot" | "none";
}) {
  return (
    <div className={`slot ${className}`} data-slot={name} aria-hidden="true">
      {look !== "none" && (
        <svg className="slot__static" viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`}>
          <use href={`#sp-${look}`} width={VIEWBOX.w} height={VIEWBOX.h} />
        </svg>
      )}
    </div>
  );
}

import { TRACE } from "@/lib/mark";

/**
 * The red lifeline, drawn from the dot. Scene 2 ("broken") lets it drift away with its
 * readings fading before they reach the circle; Scene 8 ("held") is the identical path,
 * held on the circle, readings travelling in. Static markup reads fine without motion.
 */
export function Lifeline({ variant }: { variant: "broken" | "held" }) {
  const id = `ll-${variant}`;
  return (
    <div className={`lifeline lifeline--${variant}`} data-lifeline={variant}>
      <svg viewBox={`-40 0 ${TRACE.width + 80} ${TRACE.height}`} role="img" aria-label={readingsLabel()}>
        <defs>
          {/* broken: the line thins out to nothing before it gets back to the circle */}
          <linearGradient id={`${id}-fade`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={TRACE.width} y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity={variant === "broken" ? 0 : 1} />
            <stop offset=".28" stopColor="#fff" stopOpacity="1" />
            <stop offset="1" stopColor="#fff" stopOpacity="1" />
          </linearGradient>
          <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x="-40" y="0" width={TRACE.width + 80} height={TRACE.height}>
            <rect x="-40" y="0" width={TRACE.width + 80} height={TRACE.height} fill={`url(#${id}-fade)`} />
          </mask>
        </defs>
        <g mask={`url(#${id}-mask)`}>
          <path className="ll-path" d={TRACE.d} pathLength={1} />
        </g>
        {TRACE.points.map((p, i) => (
          <g className="ll-reading" key={i} data-i={i} transform={`translate(${p.x} ${p.y})`}>
            <circle className="ll-pt" r="9" />
            <text className="ll-text" y="-26" textAnchor="middle">
              <tspan className="ll-label">{p.label}</tspan> <tspan className="ll-value">{p.value}</tspan>
            </text>
          </g>
        ))}
        {variant === "broken" && <circle className="ll-head" cx={TRACE.end.x} cy={TRACE.end.y} r="30" />}
      </svg>
    </div>
  );
}

function readingsLabel() {
  return TRACE.points.map((p) => `${p.label} ${p.value}`).join(", ") + " mg/dL";
}

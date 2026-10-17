/**
 * The opening: the clinic's sliding glass doors with the Sugar360 logo across them.
 * Scrolling slides the doors apart and walks you into the consulting room, while the logo
 * lifts off the glass and settles into the header. Purely visual (aria-hidden); the real copy
 * is in Scene 0. Shown only when motion is on (html.intro).
 */
export function Entry() {
  return (
    <>
    <div className="entry" aria-hidden="true">
      <Door side="l" />
      <Door side="r" />
      <div className="entry__header">
        <i className="entry__sensor" />
      </div>
      <div className="entry__track" />
      <p className="entry__kicker">For doctors who treat diabetes</p>
      <p className="entry__cue">
        <span>Scroll</span>
      </p>
    </div>
    {/* outside .entry so the walk-in zoom on the doors does not carry the logo with it */}
    <img className="entry__logo" aria-hidden="true" src="/brand/logo-white.webp" alt="" width={1600} height={459} decoding="async" fetchPriority="high" />
    </>
  );
}

function Door({ side }: { side: "l" | "r" }) {
  return (
    <div className={`entry__door entry__door--${side}`}>
      <div className="entry__glass" />
      <div className="entry__band" />
    </div>
  );
}

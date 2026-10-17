import { ContactForm } from "./components/ContactForm";
import { Entry } from "./components/Entry";
import { Lifeline } from "./components/Lifeline";
import { Mark, MarkSprite, Slot } from "./components/Mark";
import { Motion } from "./components/Motion";
import { OrbitLines } from "./components/OrbitLines";
import { Plate } from "./components/Plate";
import { JOURNEY_LINE, JOURNEY_VB, STEP_AT, journeyPoint } from "@/lib/pulse";

// Scene 3 field: one mark in every run of thirteen is fully lit, wherever the grid is cut.
const FIELD = Array.from({ length: 117 }, (_, i) => (i * 5 + 7) % 13 === 0);

// Scene 9: what sits around the circle. Diagnostics and pharmacy by the crescent (left);
// the care team, nutritionists, educators and technology along the larger part (right).
const ORBIT = (
  [
    ["A pharmacy under the same roof.", "clinic", 200],
    ["Diagnostics on protocol: labs, retina and foot screening.", "clinic", 160],
    ["Care coordinators who follow up, so you don\u2019t have to.", "life", -62],
    ["Nutritionists and educators who work from your prescription.", "life", -38],
    ["A team trained before you meet them.", "life", -13],
    ["Protocols built by doctors.", "life", 13],
    ["Technology that shows you what changed, and who needs you today.", "life", 38],
    ["A brand patients recognise.", "life", 62],
  ] as const
).map(([text, part, deg]) => {
  const a = (deg * Math.PI) / 180;
  const x = 50 + 21 * Math.cos(a);
  const y = 50 + 46 * Math.sin(a);
  return { text, part, deg, x: +x.toFixed(2), y: +y.toFixed(2), side: Math.cos(a) < 0 ? "l" : "r" };
});

export default function Page() {
  return (
    <>
      <MarkSprite />
      <canvas id="depth" className="depth" aria-hidden="true" />
      <Mark />

      <main id="story">
        {/* SCENE 0: Opening */}
        <section className="scene s0" data-scene="0" aria-label="Opening">
          <Plate id="01" eager alt="An empty consulting room late in the evening, a desk lamp still on." />
          <div className="veil veil--night" />
          <div className="stage">
            <Slot name="hero" className="slot--hero" look="clinic" />
            <div className="s0__copy">
              <p className="kicker ln">For doctors who treat diabetes</p>
              <h1 className="display ln">Your consultation lasts minutes. Diabetes doesn&rsquo;t.</h1>
              <p className="scroll-cue ln">
                <span>Scroll</span>
              </p>
            </div>
          </div>
          <Entry />
        </section>

        {/* SCENE 1: The report looks good */}
        <section className="scene s1" data-scene="1" aria-label="The report looks good">
          <Plate id="02" alt="The doctor's side of the desk: a lab report, a neat prescription file and a stethoscope under a lamp." />
          <div className="veil veil--left" />
          <div className="stage">
            <Slot name="corner" className="slot--corner" look="clinic" />
            <div className="copy copy--left">
              <p className="ln">He fasted properly the night before.</p>
              <p className="ln">Skipped sweets for a week.</p>
              <p className="ln">Took every tablet for ten days.</p>
              <p className="ln ln--strong">The report looks good.</p>
              <p className="voice ln">&ldquo;Sir, sab control mein hai.&rdquo;</p>
              <p className="ln">You&rsquo;ve seen this a thousand times. Every diabetologist has.</p>
              <p className="ln ln--big">What you never see is everything in between.</p>
            </div>
          </div>
        </section>

        {/* SCENE 2: Everything in between */}
        <section className="scene s2" data-scene="2" aria-label="Everything in between">
          <Plate id="03" alt="An open patient case file with wide, empty margins." />
          <div className="veil veil--night" />
          <div className="stage">
            <div className="slot-wrap slot-wrap--line">
              <Slot name="line" className="slot--line" look="clinic" />
              <Lifeline variant="broken" />
            </div>
            <h2 className="s2__lead ln">Here&rsquo;s what happened in between.</h2>
            <ol className="frags">
              <li className="frag ln">Sugar &ldquo;came normal.&rdquo; He stopped the tablets.</li>
              <li className="frag ln">A neighbour swore by karela juice.</li>
              <li className="frag ln">Someone told him insulin means last stage.</li>
              <li className="frag ln">The strips ran out.</li>
              <li className="frag ln">A wedding. Then another.</li>
              <li className="frag ln">Tingling in both feet. It didn&rsquo;t seem worth mentioning.</li>
            </ol>
            <div className="s2__after">
              <p className="ln">You find out some of it. Much later.</p>
              <p className="ln ln--strong">Usually when something has already gone wrong.</p>
            </div>
          </div>
          <div className="evidence">
            <Shot id="04" for={1} alt="A tall glass of karela juice on a steel plate in a dim home kitchen." />
            <Shot id="05" for={3} alt="A tipped-over test strip vial beside a glucometer on a bedside table at night." />
            <Shot id="06" for={4} alt="Bowls of sweets at a wedding buffet under strings of lights." />
            <Shot id="07" for={5} alt="An older man's bare feet on a cold tiled floor beside his chappals." />
          </div>
        </section>

        {/* SCENE 3: The scorecard */}
        <section className="scene s3" data-scene="3" aria-label="The scorecard">
          <div className="markfield" aria-hidden="true">
            {FIELD.map((lit, i) => (
              <svg key={i} className={lit ? "fm fm--lit" : "fm"} viewBox="0 0 1 1" preserveAspectRatio="xMidYMid meet">
                <use href="#sp-clinic" width="1" height="1" />
                {lit && <use className="fm__full" href="#sp-full" width="1" height="1" />}
              </svg>
            ))}
          </div>
          <div className="veil veil--field" />
          <div className="stage stage--center">
            <div className="s3__a">
              <p className="ln s3__intro">Of Indians who know they have diabetes,</p>
              <div className="thirteen" aria-hidden="true">
                {Array.from({ length: 13 }, (_, i) => (
                  <svg key={i} className={i === 6 ? "th th--lit" : "th"} viewBox="0 0 1 1">
                    <use href={i === 6 ? "#sp-full" : "#sp-clinic"} width="1" height="1" />
                  </svg>
                ))}
              </div>
              <p className="stat ln">1 in 13</p>
              <p className="ln s3__abc">
                meets all three ABC targets: <span className="abc">sugar</span>, <span className="abc">blood pressure</span>{" "}
                and <span className="abc">cholesterol</span>.
              </p>
              <p className="source ln">Source: ICMR-INDIAB, The Lancet Diabetes &amp; Endocrinology, 2022.</p>
            </div>
            <div className="s3__b">
              <p className="ln s3__behind">
                Behind them, <strong>101 million</strong> people living with diabetes. And <strong>136 million</strong> more
                with prediabetes, many without knowing it.
              </p>
              <p className="source ln">Source: ICMR-INDIAB, The Lancet Diabetes &amp; Endocrinology, 2023.</p>
              <p className="ln s3__not">Not because doctors don&rsquo;t know the targets. Every doctor reading this does.</p>
            </div>
          </div>
        </section>

        {/* SCENE 4: Where he goes next */}
        <section className="scene s4" data-scene="4" aria-label="Where he goes next">
          <Plate id="08" alt="A doctor's hand carrying a thick case file down a cold, gleaming hospital corridor." />
          <div className="veil veil--centre" />
          <div className="stage stage--center">
            <Slot name="corner" className="slot--corner" look="clinic" />
            <div className="s4__lines">
              <p className="ln s4__l">And when it goes wrong, he doesn&rsquo;t always come back to you.</p>
              <p className="ln s4__l">He goes to the hospital. The nephrologist. The clinic with the bigger board.</p>
              <p className="ln s4__l">Patients today arrive having already asked Google, an app and another doctor.</p>
              <p className="ln s4__l">
                Loyalty isn&rsquo;t a given anymore. It goes to whoever stays in their life between visits.
              </p>
            </div>
            <p className="alone ln">Years of your care become someone else&rsquo;s case.</p>
          </div>
        </section>

        {/* SCENE 5: Nobody taught you this */}
        <section className="scene s5" data-scene="5" aria-label="Nobody taught you this">
          <Plate id="09" alt="An old medical college library: worn textbooks and a brass lamp on a long wooden table." />
          <div className="veil veil--left" />
          <div className="veil veil--warm" />
          <div className="stage stage--split">
            <Slot name="side" className="slot--side" look="clinic" />
            <div className="s5__beats">
              <div className="beat beat--a">
                <p className="ln s5__college">Medical college taught you to treat diabetes.</p>
                <p className="ln s5__nobody">Nobody taught you to build the system around it.</p>
              </div>
              <div className="beat beat--b">
                <p className="ln s5__pills">
                  <span className="pill">Education.</span> <span className="pill">Diet counselling.</span>{" "}
                  <span className="pill">Screening on schedule.</span> <span className="pill">Chasing follow-ups.</span>{" "}
                  <span className="s5__know">You know they work.</span>
                </p>
              </div>
              <div className="beat beat--c">
                <p className="ln s5__research">
                  Decades of published research say the same: manage <em className="hl">sugar</em>,{" "}
                  <em className="hl">pressure</em>, <em className="hl">lipids</em>, <em className="hl">food</em>,{" "}
                  <em className="hl">activity</em> and <em className="hl">follow-up</em> together, consistently, over years,
                  and complications come later.
                </p>
                <p className="ln s5__nodoc">But no doctor can run all of that between patients.</p>
              </div>
              <div className="beat beat--d">
                <p className="ln ln--largest">The science was never missing. The structure was.</p>
              </div>
            </div>
          </div>
        </section>

        {/* SCENE 6: Two doors */}
        <section className="scene s6" data-scene="6" aria-label="Two doors">
          <div className="doors">
            <Plate id="10" className="doors__wide" alt="A cold glass hospital entrance beside a small, warm neighbourhood clinic door." />
            <Plate id="10" mobile="m1" only="m" className="doors__one" alt="A cold glass hospital entrance at dusk." />
            <Plate id="10" mobile="m2" only="m" className="doors__two" alt="A doctor carrying files, a bag and a phone into a small, cluttered clinic." />
          </div>
          <div className="veil veil--doors" />
          <div className="s6__shade s6__shade--one" aria-hidden="true" />
          <div className="s6__shade s6__shade--two" aria-hidden="true" />
          <div className="s6__third" aria-hidden="true" />
          <div className="stage s6__stage">
            <p className="s6__lead ln">Until now, there were two ways to practise.</p>
            <p className="door door--one ln">
              <strong>Join a hospital or a chain.</strong> You get the system. They keep the name.
            </p>
            <p className="door door--two ln">
              <strong>Stay on your own.</strong> You keep the name. And you become the system: doctor, manager, HR,
              marketing and follow-up desk.
            </p>
            <p className="s6__last ln">Neither was built for a disease that lasts a lifetime.</p>
          </div>
        </section>

        {/* SCENE 7: Fifteen years, one disease */}
        <section data-tone="light" className="scene s7" data-scene="7" aria-label="Fifteen years, one disease">
          <figure className="office">
            <img src="/img/sumit-office.webp" alt="Sumit Sinhal, Founder, Sugar360, in his office holding the Sugar360 app." width={800} height={1222} loading="lazy" decoding="async" />
          </figure>
          <div className="stage s7__stage">
            <div className="copy s7__copy">
              <img className="s7__logo ln" src="/brand/logo-dark.webp" alt="" aria-hidden="true" width={1200} height={345} loading="lazy" decoding="async" />
              <h2 className="display display--md ln">Fifteen years. One disease.</h2>
              <p className="ln">
                Sumit Sinhal has spent fifteen years building and running structured diabetes care. Sugar360 is that
                structure, built once, properly, so no doctor has to build it alone.
              </p>
              <blockquote className="quote ln">
                <p>&ldquo;Clinicians affect people with diabetes, but there&rsquo;s so much more they can do.&rdquo;</p>
                <cite>Sumit Sinhal</cite>
              </blockquote>
              <p className="creds ln">
                <span>Sumit Sinhal, Founder, Sugar360</span>
                <span>IDF Senior Fellow · Stanford Seed Transformation Program · AMPH, Indian School of Business</span>
                <span>Featured by Stanford Seed and on Stanford GSB&rsquo;s Grit &amp; Growth podcast.</span>
              </p>
            </div>
          </div>
        </section>

        {/* SCENE 8: In between, again */}
        <section data-tone="light" className="scene s8" data-scene="8" aria-label="In between, again">
          <Plate id="11" alt="A tidy care coordinator's desk with a headset, a phone and a notepad in morning light." />
          <div className="veil veil--day" />
          <div className="stage">
            <div className="slot-wrap slot-wrap--line">
              <Slot name="line" className="slot--line" look="full" />
              <Lifeline variant="held" />
            </div>
            <h2 className="s8__lead ln">Now, the same patient. The same in between.</h2>
            <ol className="frags frags--clean">
              <li className="frag ln">He stopped a tablet. You know now, not at the next visit. Someone has already called to ask why.</li>
              <li className="frag ln">His nutritionist hears about the karela juice before it replaces a tablet.</li>
              <li className="frag ln">An educator sits with him and talks through what insulin really means.</li>
              <li className="frag ln">Strips refilled before they run out.</li>
              <li className="frag ln">Wedding season is on the plan. The diet changed before the sweets, not after.</li>
              <li className="frag ln">Tingling reported. Foot screening booked. You&rsquo;re told.</li>
            </ol>
            <div className="s8__after">
              <p className="ln ln--strong">
                He walks in. You already know everything since you last saw him. You open with a decision, not a question.
              </p>
              <p className="ln">Every decision is still yours. The circle makes sure it reaches him, and that he reaches you.</p>
            </div>
          </div>
          <div className="evidence evidence--clean">
            <Shot id="12" for={1} alt="A balanced thali and a notepad on a nutritionist's counselling table." />
            <Shot id="13" for={5} alt="A clinician testing an older man's foot with a monofilament." />
          </div>
        </section>

        {/* SCENE 9: The third door */}
        <section className="scene s9a" data-scene="9a" aria-label="The third door">
          <Plate id="14" calm alt="A bright Sugar360 clinic: a round reception counter, a pharmacy and a retina camera." />
          <div className="veil veil--clinic" />
          <div className="stage stage--bottom">
            <p className="display ln">There is a third way.</p>
          </div>
        </section>

        <section data-tone="light" className="scene s9b light" data-scene="9b" aria-label="A clinic built as a circle">
          <div className="stage s9b__stage">
            <h2 className="display display--md s9b__lead ln">A clinic built as a circle, with you at the centre.</h2>
            <div className="orbit">
              <OrbitLines sides={ORBIT.map((o) => o.side as "l" | "r")} angles={ORBIT.map((o) => o.deg)} />
              <div className="orbit__mark">
                <Slot name="map" className="slot--map" look="nodot" />
              </div>
              {ORBIT.map((o) => (
                <p
                  key={o.text}
                  className={`ln orbit__item orbit__item--${o.side}`}
                  data-part={o.part}
                  style={{ "--x": `${o.x}%`, "--y": `${o.y}%` } as React.CSSProperties}
                >
                  <span className="orbit__pin" aria-hidden="true" />
                  {o.text}
                </p>
              ))}
            </div>
            <div className="s9b__close">
              <p className="ln">Not a job. Not an acquisition. A partnership.</p>
              <p className="display display--sm ln">We bring the system. You bring the medicine.</p>
            </div>
          </div>
        </section>

        {/* SCENE 10: Built to outlast */}
        <section data-tone="light" className="scene s10 light" data-scene="10" aria-label="Built to outlast">
          <Plate id="14-soft" calm alt="" />
          <div className="veil veil--s10" />
          <div className="stage stage--split stage--flip">
            <div className="sys">
              <Slot name="side" className="slot--side" look="full" />
              <div className="sys__ring sys__ring--1" aria-hidden="true">
                {Array.from({ length: 8 }, (_, i) => (
                  <svg key={i} className="sys__m" viewBox="0 0 1 1" style={{ "--a": `${i * 45}deg` } as React.CSSProperties}>
                    <use href="#sp-full" width="1" height="1" />
                  </svg>
                ))}
              </div>
              <div className="sys__ring sys__ring--2" aria-hidden="true">
                {Array.from({ length: 14 }, (_, i) => (
                  <svg key={i} className="sys__m" viewBox="0 0 1 1" style={{ "--a": `${i * (360 / 14)}deg` } as React.CSSProperties}>
                    <use href="#sp-full" width="1" height="1" />
                  </svg>
                ))}
              </div>
            </div>
            <div className="copy">
              <p className="ln">A practice that runs on you ends with you.</p>
              <p className="display display--md ln">A system outlasts everyone in it.</p>
              <p className="ln s10__whom">
                Whether <span className="who">your OPD is already full</span>,{" "}
                <span className="who">you&rsquo;ve come home to build something of your own</span>,{" "}
                <span className="who">you&rsquo;re taking a practice forward</span>, or{" "}
                <span className="who">you already run more than one</span>, this is built around you.
              </p>
            </div>
          </div>
        </section>

        {/* SCENE 11: How partnering works */}
        <section className="scene s11" data-scene="11" aria-label="How partnering works">
          <div className="stage s11__stage">
            <h2 className="display display--md ln">How partnering works</h2>
            <div className="journey">
              <svg className="journey__svg" viewBox={`0 0 ${JOURNEY_VB.w} ${JOURNEY_VB.h}`} aria-hidden="true">
                <defs>
                  <linearGradient id="journey-grad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={JOURNEY_VB.w} y2="0">
                    <stop offset="0" stopColor="#1D69B4" />
                    <stop offset=".5" stopColor="#0F74BA" />
                    <stop offset="1" stopColor="#1E8BCC" />
                  </linearGradient>
                </defs>
                <path className="journey__track" d={JOURNEY_LINE} />
                <path className="journey__line" d={JOURNEY_LINE} pathLength={1} />
                <path className="journey__comet journey__comet--glow" d={JOURNEY_LINE} pathLength={1} />
                <path className="journey__comet" d={JOURNEY_LINE} pathLength={1} />
                {STEP_AT.map((s, i) => {
                  const q = journeyPoint(1, s);
                  return (
                    <g key={i}>
                      <circle className="journey__ripple" data-ripple={i} cx={q.x} cy={q.y} r="11" />
                      <circle className="journey__node" data-node={i} cx={q.x} cy={q.y} r="11" />
                    </g>
                  );
                })}
                <circle className="journey__halo" r="26" cx="-99" cy="-99" />
                <circle className="journey__head" r="8" cx="-99" cy="-99" />
              </svg>
              <div className="journey__logo">
                <Slot name="steps" className="slot--steps" look="full" />
                <img className="journey__word" src="/brand/wordmark-white.webp" alt="" aria-hidden="true" width={875} height={360} loading="lazy" decoding="async" />
              </div>
            </div>
            <ol className="steps">
              <li className="step ln">
                <strong>1. A conversation.</strong> You meet the founding team. We listen to where your practice is and
                where you want it to go.
              </li>
              <li className="step ln">
                <strong>2. Your city, together.</strong> We look at your city and your practice with you, and see whether
                this is right for both of us.
              </li>
              <li className="step ln">
                <strong>3. The full picture.</strong> When it makes sense for both sides, we share the complete model, in
                confidence.
              </li>
              <li className="step ln">
                <strong>4. Setting up.</strong> Team trained, systems in place, protocols live before your first patient
                walks in.
              </li>
            </ol>
          </div>
        </section>

        {/* SCENE 12: Close the circle */}
        <section className="scene s12" data-scene="12" aria-label="Close the circle">
          <div className="stage stage--center s12__stage">
            <p className="ln s12__side s12__side--l">The smaller part is the clinic.</p>
            <p className="ln s12__side s12__side--r">The larger part is everything else.</p>
            <div className="s12__logo">
              <Slot name="close" className="slot--close" />
              <div className="final-logo">
                <span className="final-logo__icon">
                  <Slot name="final" className="slot--final" />
                </span>
                <img src="/brand/logo-white.webp" alt="Sugar360, Circle Of Care" width={1600} height={459} loading="lazy" decoding="async" />
              </div>
            </div>
            <div className="s12__copy">
              <p className="ln s12__one">Care is only complete when it&rsquo;s one circle.</p>
              <div className="s12__end">
                <p className="ln s12__mins">Your consultation lasts minutes. Care shouldn&rsquo;t.</p>
                <p className="display display--md ln">Build the circle in your city.</p>
              </div>
            </div>
            <div className="cta ln">
              <ContactForm />
              <a className="btn btn--ghost" href="tel:+917602302249">
                Speak to the founding team
              </a>
            </div>
          </div>
        </section>

        <footer className="footer">
          <ol className="refs">
            <li>
              Anjana RM et al. Achievement of guideline recommended diabetes treatment targets and health habits in people
              with self-reported diabetes in India (ICMR-INDIAB-13). The Lancet Diabetes &amp; Endocrinology, 2022.
            </li>
            <li>
              Anjana RM et al. Metabolic non-communicable disease health report of India: the ICMR-INDIAB national
              cross-sectional study (ICMR-INDIAB-17). The Lancet Diabetes &amp; Endocrinology, 2023.
            </li>
          </ol>
          <p className="footer__brand">Sugar360. Circle of Care. · sugar360.in</p>
        </footer>
      </main>

      <Motion />
    </>
  );
}

/** A large evidence photo for Scenes 2 and 8; it takes the stage when fragment `for` arrives. */
function Shot({ id, alt, for: at }: { id: string; alt: string; for: number }) {
  return (
    <figure className="shot" data-for={at}>
      <img src={`/img/${id}-m.webp`} alt={alt} width={810} height={1080} loading="lazy" decoding="async" />
    </figure>
  );
}

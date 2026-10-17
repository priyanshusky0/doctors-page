/**
 * A full-bleed scene photo. Phones in portrait get a 3:4 crop around the subject.
 * The depth layer (WebGL) takes over once the photo and its depth map are loaded;
 * until then, and whenever motion is off, this plain <img> is what people see.
 */
export function Plate({
  id,
  alt,
  eager = false,
  mobile = "m",
  className = "",
  only,
  calm = false,
}: {
  id: string;
  alt: string;
  eager?: boolean;
  mobile?: string;
  className?: string;
  /** "m" forces the portrait crop (stacked doors on phones). */
  only?: "m";
  /** keep the framing still: for photos whose subject fills the frame (the clinic sign) */
  calm?: boolean;
}) {
  const desktop = `/img/${id}-d.webp`;
  const phone = `/img/${id}-${mobile}.webp`;
  return (
    <div className={`plate ${className}`} data-plate={id} data-calm={calm || undefined}>
      <picture>
        {!only && <source media="(max-aspect-ratio: 4/5)" srcSet={phone} />}
        <img
          src={only ? phone : desktop}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "auto"}
          decoding="async"
        />
      </picture>
    </div>
  );
}

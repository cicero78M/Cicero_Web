export default function SectionHeading({ eyebrow, title, description, align = "left", tone = "default" }) {
  const alignment = align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl";
  const eyebrowClass = tone === "inverse" ? "text-sky-200" : "text-sky-700";
  const titleClass = tone === "inverse" ? "text-white" : "text-slate-950";
  const descriptionClass = tone === "inverse" ? "text-slate-300" : "text-slate-600";

  return (
    <div className={alignment}>
      {eyebrow ? (
        <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${eyebrowClass}`}>{eyebrow}</p>
      ) : null}
      <h2 className={`mt-3 text-3xl font-semibold tracking-tight md:text-4xl ${titleClass}`}>{title}</h2>
      {description ? <p className={`mt-4 text-base leading-7 md:text-lg ${descriptionClass}`}>{description}</p> : null}
    </div>
  );
}

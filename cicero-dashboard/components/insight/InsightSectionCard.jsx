"use client";

export default function InsightSectionCard({
  title,
  description,
  children,
  className = "",
}) {
  const baseClass =
    "relative overflow-hidden rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-[0_18px_45px_rgba(59,130,246,0.12)] backdrop-blur";
  return (
    <section className={`${baseClass} ${className}`}>
      <div className="pointer-events-none absolute -top-10 right-4 h-28 w-28 rounded-full bg-sky-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 left-6 h-24 w-24 rounded-full bg-indigo-100/60 blur-3xl" />
      <div className="relative flex flex-col gap-3">
        {(title || description) && (
          <div className="flex flex-col gap-1 border-b border-sky-50 pb-3">
            {title ? (
              <h2 className="text-xl font-semibold text-sky-900">{title}</h2>
            ) : null}
            {description ? (
              <p className="text-sm text-slate-600">{description}</p>
            ) : null}
          </div>
        )}
        <div className="flex flex-col gap-4">{children}</div>
      </div>
    </section>
  );
}

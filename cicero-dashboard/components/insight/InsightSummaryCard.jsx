"use client";

const toneStyles = {
  blue: {
    border: "border-sky-200/80",
    glow: "bg-sky-100/60",
    text: "text-sky-900",
  },
  teal: {
    border: "border-teal-200/80",
    glow: "bg-teal-100/60",
    text: "text-teal-900",
  },
  purple: {
    border: "border-indigo-200/80",
    glow: "bg-indigo-100/60",
    text: "text-indigo-900",
  },
  gray: {
    border: "border-slate-200/80",
    glow: "bg-slate-100/60",
    text: "text-slate-900",
  },
};

export default function InsightSummaryCard({
  title,
  value,
  helper,
  icon,
  tone = "blue",
}) {
  const toneClass = toneStyles[tone] || toneStyles.blue;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${toneClass.border} bg-white/80 p-4 shadow-[0_18px_45px_rgba(59,130,246,0.1)] backdrop-blur`}
    >
      <div className={`pointer-events-none absolute -top-10 right-4 h-20 w-20 rounded-full ${toneClass.glow} blur-3xl`} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
          <div className={`text-2xl font-semibold leading-tight ${toneClass.text}`}>
            {value ?? "-"}
          </div>
          {helper ? <p className="text-xs text-slate-600">{helper}</p> : null}
        </div>
        {icon ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 shadow-inner">
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}

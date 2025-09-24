"use client";

export default function SummaryItem({
  label,
  value,
  color = "gray",
  icon,
  percentage,
}) {
  const colorMap = {
    blue: {
      text: "text-sky-300",
      bar: "bg-sky-400",
      glow: "shadow-[0_0_20px_rgba(56,189,248,0.35)]",
    },
    green: {
      text: "text-emerald-300",
      bar: "bg-emerald-400",
      glow: "shadow-[0_0_20px_rgba(16,185,129,0.35)]",
    },
    red: {
      text: "text-rose-300",
      bar: "bg-rose-400",
      glow: "shadow-[0_0_20px_rgba(244,63,94,0.35)]",
    },
    gray: {
      text: "text-slate-200",
      bar: "bg-slate-400",
      glow: "shadow-[0_0_20px_rgba(148,163,184,0.2)]",
    },
    orange: {
      text: "text-amber-300",
      bar: "bg-amber-400",
      glow: "shadow-[0_0_20px_rgba(251,191,36,0.35)]",
    },
  };
  const displayColor = colorMap[color] || colorMap.gray;
  const formattedPercentage =
    typeof percentage === "number" && !Number.isNaN(percentage)
      ? `${percentage.toFixed(1).replace(".0", "")} %`
      : null;
  const progressWidth =
    typeof percentage === "number"
      ? `${Math.min(100, Math.max(0, percentage))}%`
      : "0%";
  return (
    <div
      className={`flex-1 flex min-w-[140px] flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/5 py-4 text-center shadow-lg backdrop-blur-sm ${displayColor.glow}`}
    >
      <div className="mb-2 text-slate-200">{icon}</div>
      <div className={`text-3xl md:text-4xl font-semibold ${displayColor.text}`}>
        {value}
      </div>
      <div className="mt-2 text-xs md:text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
        {label}
      </div>
      {formattedPercentage && (
        <div className="mt-3 flex w-full max-w-[180px] flex-col items-center gap-1">
          <span className="text-[11px] md:text-xs font-medium text-slate-200">
            {formattedPercentage}
          </span>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${displayColor.bar}`}
              style={{ width: progressWidth }}
              role="progressbar"
              aria-valuenow={Math.round(Number(percentage) || 0)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${label} ${formattedPercentage}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}

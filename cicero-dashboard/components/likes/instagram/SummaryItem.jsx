"use client";

import { cloneElement } from "react";
import { cn } from "@/lib/utils";

export default function SummaryItem({
  label,
  value,
  color = "gray",
  icon,
  percentage,
}) {
  const palettes = {
    blue: {
      icon: "text-sky-300",
      border: "border-sky-500/40",
      glow: "from-sky-500/20 via-sky-500/10 to-transparent",
      bar: "from-sky-400 to-cyan-400",
    },
    green: {
      icon: "text-emerald-300",
      border: "border-emerald-500/40",
      glow: "from-emerald-500/20 via-emerald-500/10 to-transparent",
      bar: "from-emerald-400 to-lime-400",
    },
    red: {
      icon: "text-rose-300",
      border: "border-rose-500/40",
      glow: "from-rose-500/25 via-rose-500/10 to-transparent",
      bar: "from-rose-400 to-orange-400",
    },
    orange: {
      icon: "text-amber-200",
      border: "border-amber-400/40",
      glow: "from-amber-400/20 via-amber-400/10 to-transparent",
      bar: "from-amber-300 to-orange-400",
    },
    gray: {
      icon: "text-slate-300",
      border: "border-slate-500/40",
      glow: "from-slate-500/20 via-slate-500/10 to-transparent",
      bar: "from-slate-300 to-slate-400",
    },
  };
  const palette = palettes[color] || palettes.gray;
  const formattedPercentage =
    typeof percentage === "number" && !Number.isNaN(percentage)
      ? `${percentage.toFixed(1).replace(".0", "")} %`
      : null;
  const progressWidth =
    typeof percentage === "number"
      ? `${Math.min(100, Math.max(0, percentage))}%`
      : "0%";
  const iconElement = icon
    ? cloneElement(icon, {
        className: cn("h-6 w-6", palette.icon, icon.props?.className),
      })
    : null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-900/70 p-5 shadow-[0_0_24px_rgba(30,64,175,0.22)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_0_36px_rgba(56,189,248,0.2)]">
      <div
        className={cn(
          "pointer-events-none absolute inset-px rounded-[1.35rem] bg-gradient-to-br opacity-70 blur-2xl",
          palette.glow,
        )}
      />
      <div className="relative flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950/80">
              {iconElement}
            </span>
            <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400">
              {label}
            </div>
          </div>
          <span
            className={cn(
              "h-10 w-10 rounded-full border bg-slate-950/70",
              palette.border,
            )}
          />
        </div>
        <div className="text-3xl font-semibold text-slate-50 md:text-4xl">
          {value}
        </div>
        {formattedPercentage && (
          <div className="mt-1 flex flex-col gap-2">
            <span className="text-[11px] font-medium text-slate-300">
              {formattedPercentage}
            </span>
            <div className="h-1.5 w-full rounded-full bg-slate-800/80">
              <div
                className={cn("h-full rounded-full bg-gradient-to-r", palette.bar)}
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
    </div>
  );
}

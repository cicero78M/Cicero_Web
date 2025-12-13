"use client";

import { cloneElement } from "react";

import { cn } from "@/lib/utils";

const defaultPalettes = {
  blue: {
    icon: "text-sky-600",
    border: "border-sky-300/60",
    glow: "from-sky-200/60 via-sky-100/30 to-transparent",
    bar: "from-sky-400 to-cyan-300",
  },
  green: {
    icon: "text-teal-600",
    border: "border-teal-300/60",
    glow: "from-teal-200/60 via-teal-100/30 to-transparent",
    bar: "from-teal-400 to-emerald-300",
  },
  red: {
    icon: "text-rose-500",
    border: "border-rose-300/60",
    glow: "from-rose-200/60 via-rose-100/30 to-transparent",
    bar: "from-rose-400 to-pink-300",
  },
  gray: {
    icon: "text-slate-500",
    border: "border-slate-200/60",
    glow: "from-slate-200/60 via-slate-100/30 to-transparent",
    bar: "from-slate-300 to-slate-400",
  },
  orange: {
    icon: "text-amber-500",
    border: "border-amber-300/60",
    glow: "from-amber-200/60 via-amber-100/30 to-transparent",
    bar: "from-amber-300 to-orange-300",
  },
  amber: {
    icon: "text-amber-500",
    border: "border-amber-300/60",
    glow: "from-amber-200/60 via-amber-100/30 to-transparent",
    bar: "from-amber-300 to-orange-300",
  },
  fuchsia: {
    icon: "text-fuchsia-500",
    border: "border-fuchsia-300/60",
    glow: "from-fuchsia-200/60 via-fuchsia-100/30 to-transparent",
    bar: "from-fuchsia-400 to-pink-300",
  },
  violet: {
    icon: "text-violet-500",
    border: "border-violet-300/60",
    glow: "from-violet-200/60 via-violet-100/30 to-transparent",
    bar: "from-violet-400 to-purple-300",
  },
  slate: {
    icon: "text-slate-500",
    border: "border-slate-200/60",
    glow: "from-slate-200/60 via-slate-100/30 to-transparent",
    bar: "from-slate-300 to-slate-400",
  },
};

export default function InstagramInsightSummaryItem({
  label,
  value,
  color = "gray",
  icon,
  percentage,
  palettes = defaultPalettes,
  containerClassName,
  useDefaultContainerStyle = true,
}) {
  const palette = palettes[color] || palettes.gray || defaultPalettes.gray;
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
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl p-5 transition duration-300",
        useDefaultContainerStyle &&
          "border border-sky-100/60 bg-white/70 shadow-[0_20px_45px_-20px_rgba(56,189,248,0.35)] backdrop-blur hover:-translate-y-1 hover:shadow-[0_25px_55px_-25px_rgba(56,189,248,0.45)]",
        containerClassName,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-px rounded-[1.35rem] bg-gradient-to-br opacity-70 blur-2xl",
          palette.glow,
        )}
      />
      <div className="relative flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100/80">
              {iconElement}
            </span>
            <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500">
              {label}
            </div>
          </div>
          <span
            className={cn(
              "h-10 w-10 rounded-full border bg-sky-100/60",
              palette.border,
            )}
          />
        </div>
        <div className="text-3xl font-semibold text-slate-800 md:text-4xl">
          {value}
        </div>
        {formattedPercentage && (
          <div className="mt-1 flex flex-col gap-2">
            <span className="text-[11px] font-medium text-slate-600">
              {formattedPercentage}
            </span>
            <div className="h-1.5 w-full rounded-full bg-slate-200">
              <div
                className={cn(
                  "h-full rounded-full bg-gradient-to-r",
                  palette.bar,
                )}
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

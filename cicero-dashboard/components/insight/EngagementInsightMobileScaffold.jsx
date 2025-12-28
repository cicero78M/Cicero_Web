"use client";

import { Copy, Sparkles } from "lucide-react";

import SummaryItem from "@/components/likes/instagram/Insight/SummaryItem";
import ViewDataSelector from "@/components/ViewDataSelector";
import { cn } from "@/lib/utils";

const quickInsightPalettes = {
  blue: {
    border: "border-blue-100",
    shadow: "shadow-blue-50/80",
    card: "bg-blue-50/70",
    accent: "text-blue-700",
    iconShadow: "shadow-blue-100",
  },
  indigo: {
    border: "border-indigo-100",
    shadow: "shadow-indigo-50/70",
    card: "bg-indigo-50/60",
    accent: "text-indigo-700",
    iconShadow: "shadow-indigo-100",
  },
};

export default function EngagementInsightMobileScaffold({
  viewSelectorProps,
  scopeSelectorProps,
  onCopyRekap,
  copyLabel = "Salin Rekap",
  summaryCards = [],
  summaryItemProps = {},
  quickInsights = [],
  quickInsightTone = "blue",
  premiumCta,
  children,
}) {
  const tone = quickInsightPalettes[quickInsightTone] || quickInsightPalettes.blue;

  const renderScopeSelector = () => {
    if (!scopeSelectorProps?.canSelectScope) return null;

    const { value, onChange, options = [] } = scopeSelectorProps;

    return (
      <div className="flex w-full min-w-[min(100%,22rem)] flex-wrap items-center gap-2 rounded-xl border border-sky-100/80 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-inner sm:w-auto">
        <span className="font-semibold text-slate-800">Lingkup:</span>
        <select
          value={value}
          onChange={onChange}
          className="w-full rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 sm:w-auto"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const renderPremiumCta = () => {
    if (!premiumCta) return null;

    const {
      label = "Aktifkan Premium",
      description = "Otomatiskan rekap dan WA Bot harian untuk tim Anda.",
      actionLabel = "Premium",
      href,
      target,
      rel,
      onClick,
    } = premiumCta;

    const resolvedTarget = target || undefined;
    const resolvedRel =
      resolvedTarget === "_blank" && !rel ? "noreferrer noopener" : rel;

    const Component = href ? "a" : "button";
    const componentProps = href
      ? { href, target: resolvedTarget, rel: resolvedRel }
      : { type: "button", onClick };

    return (
      <Component
        {...componentProps}
        className="group flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 px-4 py-3 text-left text-white shadow-[0_18px_48px_-22px_rgba(245,158,11,0.55)] transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:ring-offset-2 focus:ring-offset-white sm:flex-1"
      >
        <span className="rounded-xl bg-white/20 p-2 shadow-inner shadow-white/20">
          <Sparkles className="h-5 w-5 drop-shadow-sm" aria-hidden />
        </span>
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="text-sm font-semibold leading-tight">{label}</span>
          {description ? (
            <span className="text-xs font-medium text-white/90">
              {description}
            </span>
          ) : null}
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/85 group-hover:text-white">
          {actionLabel}
        </span>
      </Component>
    );
  };

  return (
    <div className="flex flex-col gap-8">
      {(viewSelectorProps || scopeSelectorProps || onCopyRekap) && (
        <div className="flex flex-col gap-4 rounded-2xl border border-sky-100/60 bg-white/70 p-4 shadow-inner backdrop-blur sm:p-5 md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:gap-4">
            {viewSelectorProps ? (
              <ViewDataSelector
                {...viewSelectorProps}
                className="w-full justify-start gap-3 sm:w-auto"
                labelClassName="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 md:tracking-[0.28em]"
                controlClassName="border-sky-200/70 bg-white/90 text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              />
            ) : null}
            <div className="flex w-full flex-col gap-3 sm:flex-1">
              {renderPremiumCta()}
              <div className="flex flex-wrap gap-3 sm:justify-end">
                {renderScopeSelector()}
                {onCopyRekap ? (
                  <button
                    onClick={onCopyRekap}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-teal-200/80 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700 shadow-[0_0_22px_rgba(45,212,191,0.25)] transition-colors hover:border-teal-300 hover:bg-teal-100"
                    type="button"
                  >
                    <Copy className="h-4 w-4" aria-hidden />
                    {copyLabel}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {summaryCards.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {summaryCards.map((card) => (
            <SummaryItem
              key={card.key || card.label}
              {...card}
              {...summaryItemProps}
            />
          ))}
        </div>
      ) : null}

      {quickInsights.length > 0 ? (
        <div
          className={cn(
            "grid grid-cols-1 gap-3 rounded-2xl bg-white/75 p-4 shadow-inner sm:grid-cols-2 lg:grid-cols-3",
            tone.border,
            tone.shadow,
            tone.border && "border",
          )}
        >
          {quickInsights.map((insight) => (
            <div
              key={insight.title}
              className={cn(
                "flex items-start gap-3 rounded-xl p-4",
                tone.card,
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm",
                  tone.accent,
                  tone.iconShadow,
                )}
              >
                <Sparkles className="h-4 w-4" aria-hidden />
              </span>
              <div className="space-y-1">
                <p
                  className={cn(
                    "text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 md:tracking-[0.24em]",
                    tone.accent,
                  )}
                >
                  {insight.title}
                </p>
                <p className="text-sm text-slate-700">{insight.detail}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {children}
    </div>
  );
}

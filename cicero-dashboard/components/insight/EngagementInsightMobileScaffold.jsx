"use client";

import Link from "next/link";
import { ClipboardList, Copy, Sparkles } from "lucide-react";

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
  rekapTaskAction,
  summaryCards = [],
  summaryItemProps = {},
  quickInsights = [],
  quickInsightTone = "blue",
  premiumCta,
  premiumProof,
  riskAlertCenter,
  executiveRecap,
  children,
}) {
  const tone = quickInsightPalettes[quickInsightTone] || quickInsightPalettes.blue;

  const renderScopeSelector = () => {
    if (!scopeSelectorProps?.canSelectScope) return null;

    const { value, onChange, options = [] } = scopeSelectorProps;

    return (
      <div className="flex w-full min-w-[min(100%,22rem)] flex-col gap-2 rounded-xl border border-sky-200/70 bg-white/90 px-4 py-3 shadow-sm sm:w-auto sm:flex-row sm:items-center">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 md:tracking-[0.28em]">Lingkup:</span>
        <select
          value={value}
          onChange={onChange}
          className="w-full rounded-lg border border-sky-200/70 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 sm:w-auto"
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
        className="group flex w-full items-center gap-3 rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 px-5 py-3.5 text-left text-white shadow-[0_6px_20px_-6px_rgba(245,158,11,0.4)] transition-all hover:shadow-[0_8px_28px_-6px_rgba(245,158,11,0.5)] hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-white active:scale-[0.98]"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 shadow-inner shadow-white/20">
          <Sparkles className="h-5 w-5 drop-shadow-sm" aria-hidden />
        </span>
        <span className="flex flex-1 flex-col gap-1">
          <span className="text-sm font-semibold leading-tight">{label}</span>
          {description ? (
            <span className="text-xs font-medium text-white/90">
              {description}
            </span>
          ) : null}
        </span>
        <span className="rounded-md bg-white/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white shadow-sm backdrop-blur-sm group-hover:bg-white/30">
          {actionLabel}
        </span>
      </Component>
    );
  };

  return (
    <div className="flex flex-col gap-8">
      {(viewSelectorProps || scopeSelectorProps || onCopyRekap || rekapTaskAction) && (
        <div className="flex flex-col gap-5 rounded-2xl border border-sky-100/70 bg-gradient-to-br from-white via-sky-50/30 to-white p-5 shadow-lg backdrop-blur-sm sm:p-6 md:p-7">
          {/* Date Selector Section */}
          {viewSelectorProps ? (
            <div className="w-full">
              <ViewDataSelector
                {...viewSelectorProps}
                className="w-full justify-start gap-3"
                labelClassName="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 md:tracking-[0.28em]"
                controlClassName="border-sky-200/70 bg-white/90 text-slate-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              />
            </div>
          ) : null}

          {/* Premium CTA Section */}
          {premiumCta ? (
            <div className="w-full">
              {renderPremiumCta()}
            </div>
          ) : null}

          {premiumProof ? <div className="w-full">{premiumProof}</div> : null}
          {riskAlertCenter ? <div className="w-full">{riskAlertCenter}</div> : null}
          {executiveRecap ? <div className="w-full">{executiveRecap}</div> : null}

          {/* Scope Selector and Recap Button Section */}
          {(scopeSelectorProps || onCopyRekap || rekapTaskAction) && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {renderScopeSelector()}
              <div className="flex flex-wrap items-center gap-2">
                {rekapTaskAction?.href ? (
                  <Link
                    href={rekapTaskAction.href}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-200/80 bg-gradient-to-r from-sky-50 to-blue-50 px-5 py-2.5 text-sm font-semibold text-sky-700 shadow-[0_4px_14px_rgba(56,189,248,0.2)] transition-all hover:border-sky-300 hover:shadow-[0_6px_20px_rgba(56,189,248,0.3)] active:scale-[0.98]"
                  >
                    <ClipboardList className="h-4 w-4" aria-hidden />
                    {rekapTaskAction.label || "Rekap Tugas Hari Ini"}
                  </Link>
                ) : null}
                {rekapTaskAction?.onClick ? (
                  <button
                    onClick={rekapTaskAction.onClick}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-200/80 bg-gradient-to-r from-sky-50 to-blue-50 px-5 py-2.5 text-sm font-semibold text-sky-700 shadow-[0_4px_14px_rgba(56,189,248,0.2)] transition-all hover:border-sky-300 hover:shadow-[0_6px_20px_rgba(56,189,248,0.3)] active:scale-[0.98]"
                    type="button"
                  >
                    <ClipboardList className="h-4 w-4" aria-hidden />
                    {rekapTaskAction.label || "Rekap Tugas Hari Ini"}
                  </button>
                ) : null}
                {onCopyRekap ? (
                  <button
                    onClick={onCopyRekap}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-200/80 bg-gradient-to-r from-teal-50 to-emerald-50 px-5 py-2.5 text-sm font-semibold text-teal-700 shadow-[0_4px_14px_rgba(45,212,191,0.2)] transition-all hover:border-teal-300 hover:shadow-[0_6px_20px_rgba(45,212,191,0.3)] active:scale-[0.98]"
                    type="button"
                  >
                    <Copy className="h-4 w-4" aria-hidden />
                    {copyLabel}
                  </button>
                ) : null}
              </div>
            </div>
          )}
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

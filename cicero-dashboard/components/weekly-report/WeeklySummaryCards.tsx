"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SummaryCardTrend = "up" | "down" | "flat";

export interface SummaryCardComparison {
  label: string;
  direction?: SummaryCardTrend;
}

export interface SummaryCardInfo {
  key: string;
  label: string;
  value: string;
  description?: string;
  comparison?: SummaryCardComparison | null;
  icon?: ReactNode;
}

interface WeeklySummaryCardsProps {
  cards?: SummaryCardInfo[] | null;
  loading?: boolean;
  emptyLabel?: string;
}

const comparisonStyles: Record<SummaryCardTrend, string> = {
  up: "text-emerald-600",
  down: "text-rose-600",
  flat: "text-slate-500",
};

export default function WeeklySummaryCards({
  cards,
  loading = false,
  emptyLabel = "Tidak ada ringkasan yang bisa ditampilkan.",
}: WeeklySummaryCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={`summary-skeleton-${index}`}
            className="h-32 animate-pulse rounded-3xl border border-slate-200/70 bg-white/70"
          />
        ))}
      </div>
    );
  }

  if (!cards || cards.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 text-center text-sm text-slate-500">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.key}
          className="flex flex-col gap-3 rounded-3xl border border-slate-200/70 bg-white/85 p-5 shadow-sm backdrop-blur"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              {card.label}
            </span>
            {card.icon ? (
              <span className="text-lg text-emerald-500">{card.icon}</span>
            ) : null}
          </div>
          <p className="text-2xl font-semibold text-slate-900">{card.value}</p>
          {card.description ? (
            <p className="text-xs text-slate-500">{card.description}</p>
          ) : null}
          {card.comparison?.label ? (
            <p
              className={cn(
                "text-xs font-medium",
                card.comparison?.direction
                  ? comparisonStyles[card.comparison.direction]
                  : "text-slate-500",
              )}
            >
              {card.comparison.label}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}

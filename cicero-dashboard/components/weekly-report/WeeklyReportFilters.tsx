"use client";

import type { ChangeEvent } from "react";

export interface WeeklyReportFilterOption {
  label: string;
  value: string;
}

export interface WeeklyReportFiltersProps {
  weekOptions: WeeklyReportFilterOption[];
  monthOptions: WeeklyReportFilterOption[];
  yearOptions: WeeklyReportFilterOption[];
  selectedWeek: string;
  selectedMonth: string;
  selectedYear: string;
  onWeekChange?: (value: string) => void;
  onMonthChange?: (value: string) => void;
  onYearChange?: (value: string) => void;
}

const selectClasses =
  "w-full rounded-full border border-sky-100 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200";

export default function WeeklyReportFilters({
  weekOptions,
  monthOptions,
  yearOptions,
  selectedWeek,
  selectedMonth,
  selectedYear,
  onWeekChange,
  onMonthChange,
  onYearChange,
}: WeeklyReportFiltersProps) {
  const handleWeekChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onWeekChange?.(event.target.value);
  };

  const handleMonthChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onMonthChange?.(event.target.value);
  };

  const handleYearChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onYearChange?.(event.target.value);
  };

  return (
    <div className="grid w-full gap-2 sm:auto-cols-max sm:grid-flow-col sm:justify-end">
      <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
        Minggu
        <select className={selectClasses} value={selectedWeek} onChange={handleWeekChange}>
          {weekOptions.map((option) => (
            <option key={`week-${option.value}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
        Bulan
        <select className={selectClasses} value={selectedMonth} onChange={handleMonthChange}>
          {monthOptions.map((option) => (
            <option key={`month-${option.value}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
        Tahun
        <select className={selectClasses} value={selectedYear} onChange={handleYearChange}>
          {yearOptions.map((option) => (
            <option key={`year-${option.value}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

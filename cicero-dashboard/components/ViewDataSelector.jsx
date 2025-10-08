"use client";
import { useId } from "react";
import { cn } from "@/lib/utils";

export const VIEW_OPTIONS = [
  { value: "today", label: "Hari ini", periode: "harian" },
  { value: "date", label: "Pilih Tanggal", periode: "harian", custom: true },
  { value: "month", label: "Pilih Bulan", periode: "bulanan", month: true },
  {
    value: "custom_range",
    label: "Rentang Tanggal",
    periode: "harian",
    range: true,
  },
];

export function getPeriodeDateForView(view, selectedDate) {
  const opt = VIEW_OPTIONS.find((o) => o.value === view) || VIEW_OPTIONS[0];
  const now = new Date();

  function formatDate(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  function formatMonth(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }

  if (opt.range) {
    const start = selectedDate?.startDate
      ? selectedDate.startDate
      : formatDate(now);
    const end = selectedDate?.endDate ? selectedDate.endDate : start;
    return { periode: opt.periode, startDate: start, endDate: end };
  }

  if (opt.custom) {
    const d = selectedDate ? selectedDate : formatDate(now);
    return { periode: opt.periode, date: d };
  }
  if (opt.month) {
    const d = selectedDate
      ? new Date(selectedDate)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    return { periode: opt.periode, date: formatMonth(d) };
  }
  return { periode: opt.periode, date: formatDate(now) };
}

export default function ViewDataSelector({
  value,
  onChange,
  date,
  onDateChange,
  options = VIEW_OPTIONS,
  disabled = false,
  className,
  controlClassName,
  labelClassName,
}) {
  const id = useId();
  const showDateInput = value === "date";
  const showRangeInput = value === "custom_range";
  const showMonthInput = value === "month";
  const dateInputId = `${id}-date`;
  const monthInputId = `${id}-month`;
  const rangeStartId = `${id}-start`;
  const rangeEndId = `${id}-end`;
  const baseContainerClass = cn(
    "flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-white px-4 py-3 shadow-sm sm:justify-start",
    disabled && "opacity-60",
    className,
  );
  const baseLabelClass = cn(
    "w-full text-sm font-semibold tracking-tight text-slate-800 sm:w-auto",
    labelClassName,
  );
  const baseControlClass = cn(
    "w-full rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 shadow-inner transition focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-200/60 sm:w-auto",
    controlClassName,
  );
  const segmentedButtonBaseClass =
    "rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-inner transition hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/60";

  return (
    <div className={baseContainerClass} aria-disabled={disabled}>
      <label htmlFor={id} className={baseLabelClass}>
        Tampilan data berdasarkan
      </label>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
        <div className="hidden w-full flex-wrap gap-2 sm:flex">
          {options.map((opt) => {
            const isActive = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                disabled={disabled}
                className={cn(
                  segmentedButtonBaseClass,
                  isActive &&
                    "border-sky-200 bg-sky-50 text-slate-800 shadow-sm",
                  disabled && "cursor-not-allowed opacity-70",
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <div className="relative w-full sm:hidden">
          <select
            id={id}
            className={cn(baseControlClass, "appearance-none pr-10")}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <svg
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m6 9 6 6 6-6"
            />
          </svg>
        </div>
      </div>
      {showDateInput && (
        <>
          <label htmlFor={dateInputId} className="sr-only">
            Pilih tanggal
          </label>
          <input
            id={dateInputId}
            type="date"
            className={cn(baseControlClass, "mt-2 sm:mt-0")}
            value={date}
            onChange={(e) => onDateChange?.(e.target.value)}
            disabled={disabled}
          />
        </>
      )}
      {showMonthInput && (
        <>
          <label htmlFor={monthInputId} className="sr-only">
            Pilih bulan
          </label>
          <input
            id={monthInputId}
            type="month"
            className={cn(baseControlClass, "mt-2 sm:mt-0")}
            value={date}
            onChange={(e) => onDateChange?.(e.target.value)}
            disabled={disabled}
          />
        </>
      )}
      {showRangeInput && (
        <>
          <label htmlFor={rangeStartId} className="sr-only">
            Mulai
          </label>
          <input
            id={rangeStartId}
            type="date"
            className={cn(baseControlClass, "mt-2 sm:mt-0")}
            value={date?.startDate || ""}
            onChange={(e) =>
              onDateChange?.({ ...date, startDate: e.target.value })
            }
            disabled={disabled}
          />
          <label htmlFor={rangeEndId} className="sr-only">
            Selesai
          </label>
          <input
            id={rangeEndId}
            type="date"
            className={cn(baseControlClass, "mt-2 sm:mt-0")}
            value={date?.endDate || ""}
            onChange={(e) =>
              onDateChange?.({ ...date, endDate: e.target.value })
            }
            disabled={disabled}
          />
        </>
      )}
    </div>
  );
}

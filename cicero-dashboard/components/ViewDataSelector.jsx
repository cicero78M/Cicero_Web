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

function formatDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getIsoWeekRange(targetDate = new Date()) {
  const date = new Date(targetDate);
  date.setHours(0, 0, 0, 0);

  const day = date.getDay() || 7; // ISO week, Monday = 1
  const thursday = new Date(date);
  thursday.setDate(date.getDate() + (4 - day));

  const yearStart = new Date(thursday.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(((thursday - yearStart) / 86400000 + 1) / 7);

  const weekStart = new Date(thursday);
  weekStart.setDate(thursday.getDate() - (day - 1));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return {
    weekKey: `${thursday.getFullYear()}-W${String(weekNumber).padStart(2, "0")}`,
    startDate: formatDate(weekStart),
    endDate: formatDate(weekEnd),
  };
}

export function getWeekRangeFromValue(value, fallbackDate = new Date()) {
  const fallbackRange = getIsoWeekRange(fallbackDate);

  if (!value) return fallbackRange;

  if (typeof value === "string") {
    const weekMatch = value.match(/^(\d{4})-W(\d{1,2})$/);
    if (weekMatch) {
      const year = Number(weekMatch[1]);
      const weekNumber = Number(weekMatch[2]);
      if (Number.isFinite(year) && Number.isFinite(weekNumber)) {
        const january4 = new Date(year, 0, 4);
        january4.setDate(january4.getDate() + (weekNumber - 1) * 7);
        return getIsoWeekRange(january4);
      }
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return getIsoWeekRange(parsed);
    }
  }

  if (typeof value === "object") {
    const startCandidate = value?.startDate
      ? new Date(value.startDate)
      : undefined;
    const endCandidate = value?.endDate ? new Date(value.endDate) : undefined;

    const hasStart = startCandidate && !Number.isNaN(startCandidate.getTime());
    const hasEnd = endCandidate && !Number.isNaN(endCandidate.getTime());
    const baseDate = hasStart ? startCandidate : hasEnd ? endCandidate : null;

    if (baseDate) {
      return getIsoWeekRange(baseDate);
    }
  }

  return fallbackRange;
}

export function getPeriodeDateForView(view, selectedDate, options = VIEW_OPTIONS) {
  const optionList = Array.isArray(options) && options.length ? options : VIEW_OPTIONS;
  const normalizedOptions =
    optionList.some((option) => option.value === "week")
      ? optionList
      : [
          ...optionList,
          { value: "week", label: "Mingguan", periode: "mingguan", week: true },
        ];
  const opt = normalizedOptions.find((o) => o.value === view) || normalizedOptions[0];
  const now = new Date();
  const isWeekView = opt?.week || opt?.value === "week";

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
  if (isWeekView) {
    const { startDate, endDate } = getWeekRangeFromValue(selectedDate, now);
    return { periode: opt.periode, startDate, endDate, date: startDate };
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
  const activeOption = options.find((option) => option.value === value);
  const showDateInput = value === "date";
  const showRangeInput = value === "custom_range";
  const showMonthInput = value === "month";
  const showWeekInput = Boolean(activeOption?.week);
  const dateInputId = `${id}-date`;
  const monthInputId = `${id}-month`;
  const weekInputId = `${id}-week`;
  const rangeStartId = `${id}-start`;
  const rangeEndId = `${id}-end`;
  const baseContainerClass = cn(
    "flex w-full flex-col gap-4 rounded-xl border border-sky-200/70 bg-white/90 px-5 py-4 shadow-sm sm:gap-3",
    disabled && "opacity-60",
    className,
  );
  const baseLabelClass = cn(
    "text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 md:tracking-[0.28em]",
    labelClassName,
  );
  const baseControlClass = cn(
    "w-full rounded-lg border border-sky-200/70 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 sm:w-auto",
    controlClassName,
  );
  const segmentedButtonBaseClass = cn(
    "rounded-lg border border-sky-200/70 bg-white px-4 py-2",
    "text-sm font-medium text-slate-700 shadow-sm",
    "transition-all hover:border-sky-300 hover:bg-sky-50 hover:shadow-md",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60",
    "active:scale-[0.98]"
  );

  return (
    <div className={baseContainerClass} aria-disabled={disabled}>
      <label htmlFor={id} className={baseLabelClass}>
        Tampilan data berdasarkan
      </label>
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
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
                    "border-sky-400/70 bg-gradient-to-br from-sky-50 to-blue-50 text-slate-800 font-semibold shadow-md ring-2 ring-sky-400/20",
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
            className={baseControlClass}
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
            className={baseControlClass}
            value={date}
            onChange={(e) => onDateChange?.(e.target.value)}
            disabled={disabled}
          />
        </>
      )}
      {showWeekInput && (
        <>
          <label htmlFor={weekInputId} className="sr-only">
            Pilih minggu
          </label>
          <input
            id={weekInputId}
            type="week"
            className={baseControlClass}
            value={date}
            onChange={(e) => onDateChange?.(e.target.value)}
            disabled={disabled}
          />
        </>
      )}
      {showRangeInput && (
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor={rangeStartId} className="sr-only">
            Mulai
          </label>
          <input
            id={rangeStartId}
            type="date"
            className={baseControlClass}
            value={date?.startDate || ""}
            onChange={(e) =>
              onDateChange?.({ ...date, startDate: e.target.value })
            }
            disabled={disabled}
          />
          <span className="hidden text-sm text-slate-500 sm:inline">—</span>
          <label htmlFor={rangeEndId} className="sr-only">
            Selesai
          </label>
          <input
            id={rangeEndId}
            type="date"
            className={baseControlClass}
            value={date?.endDate || ""}
            onChange={(e) =>
              onDateChange?.({ ...date, endDate: e.target.value })
            }
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}

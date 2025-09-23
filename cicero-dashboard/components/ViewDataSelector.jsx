"use client";
import { useId } from "react";

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
}) {
  const id = useId();
  const showDateInput = value === "date";
  const showRangeInput = value === "custom_range";
  const showMonthInput = value === "month";
  const dateInputId = `${id}-date`;
  const monthInputId = `${id}-month`;
  const rangeStartId = `${id}-start`;
  const rangeEndId = `${id}-end`;
  return (
    <div
      className={`flex items-center gap-2 ${disabled ? "opacity-60" : ""}`}
      aria-disabled={disabled}
    >
      <label htmlFor={id} className="text-sm font-semibold">
        View Data By:
      </label>
      <select
        id={id}
        className="border rounded px-2 py-1 text-sm"
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
      {showDateInput && (
        <>
          <label htmlFor={dateInputId} className="sr-only">
            Pilih tanggal
          </label>
          <input
            id={dateInputId}
            type="date"
            className="border rounded px-2 py-1 text-sm"
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
            className="border rounded px-2 py-1 text-sm"
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
            className="border rounded px-2 py-1 text-sm"
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
            className="border rounded px-2 py-1 text-sm"
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

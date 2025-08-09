"use client";
import { useId } from "react";

export const VIEW_OPTIONS = [
  { value: "today", label: "Hari ini", periode: "harian", offset: 0 },
  { value: "yesterday", label: "Hari Sebelumnya", periode: "harian", offset: -1 },
  { value: "this_week", label: "Minggu ini", periode: "mingguan", weekOffset: 0 },
  { value: "last_week", label: "Minggu Sebelumnya", periode: "mingguan", weekOffset: -1 },
  { value: "month", label: "Pilih Bulan", periode: "bulanan", month: true },
  { value: "date", label: "Tanggal Pilihan", periode: "harian", custom: true },
  {
    value: "custom_range",
    label: "Rentang Tanggal",
    periode: "harian",
    range: true,
  },
  { value: "all", label: "Seluruh Data", periode: "semua" },
];

export function getPeriodeDateForView(view, selectedDate) {
  const opt = VIEW_OPTIONS.find((o) => o.value === view) || VIEW_OPTIONS[0];
  const now = new Date();
  if (opt.periode === "semua") return { periode: opt.periode, date: "" };

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

  if (Object.prototype.hasOwnProperty.call(opt, "offset")) {
    const d = new Date(now);
    d.setDate(d.getDate() + (opt.offset || 0));
    return { periode: opt.periode, date: formatDate(d) };
  }
  if (Object.prototype.hasOwnProperty.call(opt, "weekOffset")) {
    const mondayOffset = (now.getDay() + 6) % 7; // monday start
    const d = new Date(now);
    d.setDate(d.getDate() - mondayOffset + (opt.weekOffset || 0) * 7);
    return { periode: opt.periode, date: formatDate(d) };
  }
  if (opt.month) {
    const d = selectedDate
      ? new Date(`${selectedDate}-01`)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    return { periode: opt.periode, date: formatMonth(d) };
  }
  return { periode: opt.periode, date: formatDate(now) };
}

export default function ViewDataSelector({ value, onChange, date, onDateChange }) {
  const id = useId();
  const showDateInput = value === "date";
  const showRangeInput = value === "custom_range";
  const showMonthInput = value === "month";

  const now = new Date();
  const [yearPart, rawMonthPart] = (
    date || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  ).split("-");
  const monthPart = (rawMonthPart || "1").slice(0, 2).padStart(2, "0");
  const MONTH_OPTIONS = [
    { value: "01", label: "Januari" },
    { value: "02", label: "Februari" },
    { value: "03", label: "Maret" },
    { value: "04", label: "April" },
    { value: "05", label: "Mei" },
    { value: "06", label: "Juni" },
    { value: "07", label: "Juli" },
    { value: "08", label: "Agustus" },
    { value: "09", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" },
  ];

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-sm font-semibold">
        View Data By:
      </label>
      <select
        id={id}
        className="border rounded px-2 py-1 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {VIEW_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {showDateInput && (
        <input
          type="date"
          className="border rounded px-2 py-1 text-sm"
          value={date}
          onChange={(e) => onDateChange?.(e.target.value)}
        />
      )}
      {showMonthInput && (
        <select
          className="border rounded px-2 py-1 text-sm"
          value={monthPart}
          onChange={(e) => onDateChange?.(`${yearPart}-${e.target.value}`)}
        >
          {MONTH_OPTIONS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      )}
      {showRangeInput && (
        <>
          <input
            type="date"
            className="border rounded px-2 py-1 text-sm"
            value={date?.startDate || ""}
            onChange={(e) =>
              onDateChange?.({ ...date, startDate: e.target.value })
            }
          />
          <input
            type="date"
            className="border rounded px-2 py-1 text-sm"
            value={date?.endDate || ""}
            onChange={(e) =>
              onDateChange?.({ ...date, endDate: e.target.value })
            }
          />
        </>
      )}
    </div>
  );
}

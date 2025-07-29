"use client";
import { useId } from "react";

export const VIEW_OPTIONS = [
  { value: "today", label: "Hari ini", periode: "harian", offset: 0 },
  { value: "yesterday", label: "Hari Sebelumnya", periode: "harian", offset: -1 },
  { value: "this_week", label: "Minggu ini", periode: "mingguan", weekOffset: 0 },
  { value: "last_week", label: "Minggu Sebelumnya", periode: "mingguan", weekOffset: -1 },
  { value: "this_month", label: "Bulan ini", periode: "bulanan", monthOffset: 0 },
  { value: "last_month", label: "Bulan Sebelumnya", periode: "bulanan", monthOffset: -1 },
  { value: "date", label: "Tanggal Pilihan", periode: "harian", custom: true },
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
  if (Object.prototype.hasOwnProperty.call(opt, "monthOffset")) {
    const d = new Date(now.getFullYear(), now.getMonth() + (opt.monthOffset || 0), 1);
    return { periode: opt.periode, date: formatMonth(d) };
  }
  return { periode: opt.periode, date: formatDate(now) };
}

export default function ViewDataSelector({ value, onChange, date, onDateChange }) {
  const id = useId();
  const showDateInput = value === "date";
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
    </div>
  );
}

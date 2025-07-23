"use client";
export default function DateSelector({ date, setDate, periode = "harian" }) {
  const inputType = periode === "bulanan" ? "month" : "date";
  const label = periode === "bulanan" ? "Bulan" : "Tanggal";
  const value = periode === "bulanan" ? (date || "").slice(0, 7) : date;

  return (
    <div className="flex items-center gap-1">
      <label className="text-sm">{label}</label>
      <input
        type={inputType}
        value={value}
        onChange={(e) => setDate(e.target.value)}
        className="border rounded px-2 py-1 text-sm"
      />
    </div>
  );
}

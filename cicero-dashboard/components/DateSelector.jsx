"use client";
export default function DateSelector({ date, setDate }) {
  return (
    <div className="flex items-center gap-1">
      <label className="text-sm">Tanggal</label>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="border rounded px-2 py-1 text-sm"
      />
    </div>
  );
}

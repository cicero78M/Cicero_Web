"use client";
export default function FilterBar({ startDate, endDate, search, setStartDate, setEndDate, setSearch }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow flex flex-col md:flex-row gap-2 items-center">
      <div className="flex items-center gap-1">
        <label className="text-sm">Start</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        />
      </div>
      <div className="flex items-center gap-1">
        <label className="text-sm">End</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        />
      </div>
      <input
        type="text"
        placeholder="Search caption..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="flex-1 px-3 py-1 border rounded text-sm"
      />
    </div>
  );
}

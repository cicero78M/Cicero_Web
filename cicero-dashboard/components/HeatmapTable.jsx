"use client";

function getColor(value) {
  if (value > 8) return "bg-blue-600 text-white";
  if (value > 6) return "bg-blue-500 text-white";
  if (value > 4) return "bg-blue-300";
  if (value > 2) return "bg-blue-200";
  if (value > 0) return "bg-blue-100";
  return "bg-gray-50";
}

export default function HeatmapTable({ data = {}, days = [], buckets = [] }) {
  return (
    <table className="min-w-full text-xs text-center border rounded-xl overflow-hidden">
      <thead className="bg-gray-50">
        <tr>
          <th className="p-1 text-left">Day / Time</th>
          {buckets.map((b) => (
            <th key={b} className="p-1">
              {b}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {days.map((day) => (
          <tr key={day} className="border-t">
            <td className="p-1 text-left font-medium">{day}</td>
            {buckets.map((b) => {
              const val = data[day]?.[b] || 0;
              return (
                <td key={b} className={`p-1 ${getColor(val)}`}>{val.toFixed(1)}</td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

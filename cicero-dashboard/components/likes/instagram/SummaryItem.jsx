"use client";

export default function SummaryItem({
  label,
  value,
  color = "gray",
  icon,
  percentage,
}) {
  const colorMap = {
    blue: { text: "text-blue-700", bar: "bg-blue-500" },
    green: { text: "text-green-600", bar: "bg-green-500" },
    red: { text: "text-red-500", bar: "bg-red-500" },
    gray: { text: "text-gray-700", bar: "bg-gray-500" },
    orange: { text: "text-orange-500", bar: "bg-orange-500" },
  };
  const displayColor = colorMap[color] || colorMap.gray;
  const formattedPercentage =
    typeof percentage === "number" && !Number.isNaN(percentage)
      ? `${percentage.toFixed(1).replace(".0", "")} %`
      : null;
  const progressWidth =
    typeof percentage === "number"
      ? `${Math.min(100, Math.max(0, percentage))}%`
      : "0%";
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-2">
      <div className="mb-1">{icon}</div>
      <div className={`text-3xl md:text-4xl font-bold ${displayColor.text}`}>
        {value}
      </div>
      <div className="text-xs md:text-sm font-semibold text-gray-500 mt-1 uppercase tracking-wide text-center">
        {label}
      </div>
      {formattedPercentage && (
        <div className="mt-1 flex flex-col items-center gap-1 w-full max-w-[160px]">
          <span className="text-[11px] md:text-xs font-medium text-gray-600">
            {formattedPercentage}
          </span>
          <div className="h-1.5 w-full rounded-full bg-gray-200">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${displayColor.bar}`}
              style={{ width: progressWidth }}
              role="progressbar"
              aria-valuenow={Math.round(Number(percentage) || 0)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${label} ${formattedPercentage}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}

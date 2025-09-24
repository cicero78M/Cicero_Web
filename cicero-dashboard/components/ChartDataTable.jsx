"use client";

const getAlignmentClass = (align) => {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
};

export default function ChartDataTable({
  title,
  columns = [],
  rows = [],
  summaryLabel = "Tampilkan data tabel",
  initialOpen = false,
}) {
  if (!rows || rows.length === 0) {
    return null;
  }

  const normalizedColumns = columns.map((column, index) => {
    if (typeof column === "string") {
      return {
        key: column,
        header: column,
        isRowHeader: index === 0,
      };
    }
    return {
      ...column,
      key: column.key ?? column.accessor ?? String(index),
      header: column.header ?? column.title ?? column.label ?? column.key,
      isRowHeader:
        typeof column.isRowHeader === "boolean" ? column.isRowHeader : index === 0,
    };
  });

  return (
    <details
      className="group mt-4 rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-slate-200 shadow-inner backdrop-blur"
      open={initialOpen}
    >
      <summary className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10 focus:outline-none focus-visible:ring focus-visible:ring-sky-500/60 focus-visible:ring-offset-0">
        <span
          aria-hidden="true"
          className="text-xs text-cyan-300 transition-transform duration-200 group-open:rotate-90"
        >
          ▶
        </span>
        {summaryLabel}
      </summary>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full border-collapse text-sm text-slate-100">
          {title ? (
            <caption className="mb-2 text-left text-base font-semibold text-sky-200">
              {title}
            </caption>
          ) : null}
          <thead className="bg-slate-900/80 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
            <tr>
              {normalizedColumns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-3 py-2 ${getAlignmentClass(column.align)}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 bg-slate-950/50">
            {rows.map((row, rowIndex) => (
              <tr
                key={row.id ?? row.key ?? rowIndex}
                className={rowIndex % 2 === 0 ? "bg-slate-950/40" : "bg-slate-900/40"}
              >
                {normalizedColumns.map((column, columnIndex) => {
                  const cellValue = row[column.key];
                  const alignmentClass = getAlignmentClass(column.align);
                  const baseClass = `px-3 py-2 ${alignmentClass}`;
                  const content = cellValue ?? "-";

                  if (column.isRowHeader || columnIndex === 0) {
                    return (
                      <th
                        key={column.key}
                        scope="row"
                        className={`${baseClass} font-semibold text-sky-100`}
                      >
                        {content}
                      </th>
                    );
                  }

                  return (
                    <td key={column.key} className={`${baseClass} whitespace-nowrap text-slate-200`}>
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}


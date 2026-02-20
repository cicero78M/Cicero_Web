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
  onDownloadJpg,
  downloadLabel = "Download JPG",
  isDownloading = false,
  exportRef,
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
        typeof column.isRowHeader === "boolean"
          ? column.isRowHeader
          : index === 0,
    };
  });

  return (
    <div className="mt-4 space-y-3">
      {typeof onDownloadJpg === "function" ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onDownloadJpg}
            disabled={isDownloading}
            className="inline-flex items-center rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDownloading ? "Memproses JPG..." : downloadLabel}
          </button>
        </div>
      ) : null}
      <details
        ref={exportRef}
        className="group rounded-2xl border border-sky-100/60 bg-white/70 p-4 text-slate-700 shadow-inner backdrop-blur"
        open={initialOpen}
      >
        <summary className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-sky-100/70 bg-sky-50/70 px-3 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100/80 focus:outline-none focus-visible:ring focus-visible:ring-sky-400/60 focus-visible:ring-offset-0">
          <span
            aria-hidden="true"
            className="text-xs text-sky-500 transition-transform duration-200 group-open:rotate-90"
          >
            ▶
          </span>
          {summaryLabel}
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm text-slate-700">
            {title ? (
              <caption className="mb-2 text-left text-base font-semibold text-sky-600">
                {title}
              </caption>
            ) : null}
            <thead className="bg-sky-100/70 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
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
            <tbody className="divide-y divide-sky-100 bg-white/60">
              {rows.map((row, rowIndex) => (
                <tr
                  key={row.id ?? row.key ?? rowIndex}
                  className={
                    rowIndex % 2 === 0 ? "bg-sky-50/70" : "bg-white/80"
                  }
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
                          className={`${baseClass} font-semibold text-sky-700`}
                        >
                          {content}
                        </th>
                      );
                    }

                    return (
                      <td
                        key={column.key}
                        className={`${baseClass} whitespace-nowrap text-slate-600`}
                      >
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
    </div>
  );
}

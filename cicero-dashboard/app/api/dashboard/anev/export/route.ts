import ExcelJS from "exceljs/dist/exceljs.min.js";
import { NextRequest, NextResponse } from "next/server";

type ExportRow = Record<string, unknown> & {
  section?: string;
};

function toSheetName(section?: string, index = 1) {
  const fallback = `Sheet${index}`;
  const raw = (section || fallback).trim();
  const normalized = raw
    .replace(/[\\/?*\[\]:]/g, "-")
    .replace(/\s+/g, "_")
    .slice(0, 31);

  return normalized || fallback;
}

function collectColumns(rows: ExportRow[]) {
  return Array.from(
    new Set(rows.flatMap((row) => Object.keys(row || {}).filter((key) => key !== "section"))),
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const rows = Array.isArray(body?.rows) ? (body.rows as ExportRow[]) : [];
  const fileName = typeof body?.fileName === "string" && body.fileName.trim()
    ? body.fileName.trim()
    : "anev-polres";

  if (!rows.length) {
    return NextResponse.json(
      { message: "Rows kosong. Tidak ada data untuk diekspor." },
      { status: 400 },
    );
  }

  const workbook = new ExcelJS.Workbook();
  const grouped = new Map<string, ExportRow[]>();

  rows.forEach((row) => {
    const key = typeof row?.section === "string" && row.section.trim()
      ? row.section.trim()
      : "ringkasan";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)?.push(row);
  });

  let sheetIndex = 1;
  for (const [section, sectionRows] of grouped.entries()) {
    const worksheet = workbook.addWorksheet(toSheetName(section, sheetIndex));
    sheetIndex += 1;

    const columns = collectColumns(sectionRows);
    worksheet.columns = columns.map((column) => ({
      header: column,
      key: column,
      width: Math.min(Math.max(column.length + 4, 14), 48),
    }));

    sectionRows.forEach((row) => {
      const normalizedRow: Record<string, unknown> = {};
      columns.forEach((column) => {
        normalizedRow[column] = row?.[column] ?? "";
      });
      worksheet.addRow(normalizedRow);
    });

    if (worksheet.rowCount > 0) {
      const header = worksheet.getRow(1);
      header.font = { bold: true };
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}.xlsx"`,
    },
  });
}


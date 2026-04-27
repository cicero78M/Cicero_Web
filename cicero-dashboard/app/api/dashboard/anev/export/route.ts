import ExcelJS from "exceljs/dist/exceljs.min.js";
import { NextRequest, NextResponse } from "next/server";

type ExportRow = Record<string, unknown> & {
  section?: string;
};

const SECTION_COLUMN_ORDER: Record<string, string[]> = {
  ringkasan: [
    "metric",
    "value",
    "time_range",
    "start_date",
    "end_date",
    "role",
    "scope",
    "client_id",
  ],
  posting_per_platform: [
    "platform",
    "task_id",
    "task_link",
    "time_range",
    "start_date",
    "end_date",
    "role",
    "scope",
    "client_id",
  ],
  compliance_per_pelaksana: [
    "pelaksana",
    "jumlah_post_ig",
    "jumlah_post_tiktok",
    "pelaksanaan_likes_ig",
    "pelaksanaan_komentar_tiktok",
    "total_tugas",
    "completed",
    "completion_rate",
    "time_range",
    "start_date",
    "end_date",
    "role",
    "scope",
    "client_id",
  ],
  user_per_satfung_divisi: [
    "satfung_divisi",
    "users",
    "time_range",
    "start_date",
    "end_date",
    "role",
    "scope",
    "client_id",
  ],
  instagram_likes_per_satfung_divisi: [
    "satfung_divisi",
    "jumlah_personil_satfung",
    "jumlah_personil_melaksanakan_likes",
    "jumlah_post_tugas_instagram",
    "total_likes",
    "time_range",
    "start_date",
    "end_date",
    "role",
    "scope",
    "client_id",
  ],
  tiktok_per_satfung_divisi: [
    "satfung_divisi",
    "jumlah_personil_satfung",
    "jumlah_personil_melaksanakan_komentar",
    "jumlah_post_tugas_tiktok",
    "total_komentar",
    "time_range",
    "start_date",
    "end_date",
    "role",
    "scope",
    "client_id",
  ],
  top_performer: [
    "personel",
    "satfung",
    "username",
    "likes_ig",
    "komentar_tiktok",
    "total_interaksi",
    "time_range",
    "start_date",
    "end_date",
    "role",
    "scope",
    "client_id",
  ],
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

function orderColumnsBySection(section: string, columns: string[]) {
  const preferred = SECTION_COLUMN_ORDER[String(section || "").toLowerCase()] || [];
  const first = preferred.filter((key) => columns.includes(key));
  const rest = columns.filter((key) => !first.includes(key));
  return [...first, ...rest];
}

function computeColumnWidth(rows: ExportRow[], column: string) {
  const maxCellLength = rows.reduce((max, row) => {
    const value = row?.[column];
    const text = value == null ? "" : String(value);
    return Math.max(max, text.length);
  }, column.length);
  return Math.min(Math.max(maxCellLength + 2, 12), 120);
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

    const columns = orderColumnsBySection(section, collectColumns(sectionRows));
    worksheet.columns = columns.map((column) => ({
      header: column,
      key: column,
      width: computeColumnWidth(sectionRows, column),
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

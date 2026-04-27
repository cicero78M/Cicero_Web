import ExcelJS from 'exceljs/dist/exceljs.min.js';
import { NextRequest, NextResponse } from 'next/server';

function computeColumnWidth(rows: Record<string, unknown>[], column: string) {
  const maxCellLength = rows.reduce((max, row) => {
    const value = row?.[column];
    const text = value == null ? '' : String(value);
    return Math.max(max, text.length);
  }, column.length);
  return Math.min(Math.max(maxCellLength + 2, 12), 120);
}

function orderColumns(columns: string[]) {
  const preferred = [
    "tanggal",
    "date",
    "client_id",
    "client",
    "nama_client",
    "satfung",
    "divisi",
    "pangkat",
    "title",
    "nama",
    "personel",
    "username",
    "instagram",
    "tiktok",
    "status",
    "jumlah_post",
    "jumlah_like",
    "jumlah_komentar",
    "likes",
    "comments",
    "views",
  ];

  const first = preferred.filter((key) => columns.includes(key));
  const rest = columns
    .filter((key) => !first.includes(key))
    .sort((a, b) => a.localeCompare(b, 'id', { sensitivity: 'base' }));
  return [...first, ...rest];
}

export async function POST(req: NextRequest) {
  const { rows, fileName } = await req.json();

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet1');

  if (Array.isArray(rows) && rows.length > 0) {
    const columns = orderColumns(Array.from(
      new Set(rows.flatMap((row: Record<string, unknown>) => Object.keys(row))),
    ));
    worksheet.columns = columns.map((column) => ({
      header: column,
      key: column,
      width: computeColumnWidth(rows, column),
    }));
    rows.forEach((row: Record<string, unknown>) => worksheet.addRow(row));

    const header = worksheet.getRow(1);
    header.font = { bold: true };
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${(fileName || 'rekap')}.xlsx"`,
    },
  });
}

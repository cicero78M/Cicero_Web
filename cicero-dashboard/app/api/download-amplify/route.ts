import ExcelJS from 'exceljs/dist/exceljs.min.js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { rows, fileName } = await req.json();

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet1');

  if (Array.isArray(rows) && rows.length > 0) {
    const columns = Array.from(
      new Set(rows.flatMap((row: Record<string, unknown>) => Object.keys(row))),
    );
    worksheet.columns = columns.map((column) => ({ header: column, key: column }));
    rows.forEach((row: Record<string, unknown>) => worksheet.addRow(row));
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

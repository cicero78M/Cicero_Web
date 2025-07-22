import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { rows, fileName } = await req.json();

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !key) {
    return NextResponse.json({ error: 'Missing Google credentials' }, { status: 500 });
  }

  const auth = new google.auth.JWT(
    email,
    undefined,
    key.replace(/\\n/g, '\n'),
    [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive'
    ]
  );

  const sheets = google.sheets({ version: 'v4', auth });

  const createRes = await sheets.spreadsheets.create({
    requestBody: { properties: { title: fileName || 'Data Rekap Bulan Tahun' } }
  });

  const sheetId = createRes.data.spreadsheetId;

  const header = [
    'Date',
    'Pangkat Nama',
    'Satfung',
    'Link Instagram',
    'Link Facebook',
    'Link Twitter',
    'Link Tiktok',
    'Link Youtube',
  ];

  const values = rows.map((r: any) => [
    r.date || '',
    r.pangkat_nama || '',
    r.satfung || '',
    r.instagram || '',
    r.facebook || '',
    r.twitter || '',
    r.tiktok || '',
    r.youtube || '',
  ]);

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId!,
    range: 'Sheet1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [header, ...values] }
  });

  return NextResponse.json({ success: true, sheetId });
}

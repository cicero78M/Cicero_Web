import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

export async function POST(request: NextRequest) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
  const adminNumber = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP;

  if (!accountSid || !authToken || !fromNumber || !adminNumber) {
    console.error('Missing Twilio environment variables');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const client = twilio(accountSid, authToken);

  const ip =
    request.headers.get('x-forwarded-for') ||
    request.ip ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const referer = request.headers.get('referer') || 'direct';

  const body = `Visitor log:\nIP: ${ip}\nUser-Agent: ${userAgent}\nPath: ${referer}`;

  try {
    await client.messages.create({
      from: `whatsapp:${fromNumber}`,
      to: `whatsapp:${adminNumber}`,
      body,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to send WhatsApp message', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

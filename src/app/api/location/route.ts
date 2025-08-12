
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Vercel provides the user's country code in the `x-vercel-ip-country` header.
  const country = request.headers.get('x-vercel-ip-country') || 'unknown';
  
  // For local development, this header won't exist. We can check the IP.
  // Note: This is less reliable than the Vercel header.
  if (process.env.NODE_ENV === 'development' && country === 'unknown') {
      const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';
       if (ip === '127.0.0.1' || ip === '::1') {
           // Simulate being in Pakistan for local testing
           return NextResponse.json({ country: 'PK' });
       }
  }

  return NextResponse.json({ country });
}

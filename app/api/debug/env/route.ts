import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Only allow in development or with a debug key
  const debugKey = request.nextUrl.searchParams.get('key');
  
  if (process.env.NODE_ENV === 'production' && debugKey !== 'debug123') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '***SET***' : 'NOT SET',
    NEXTAUTH_DEBUG: process.env.NEXTAUTH_DEBUG,
    AZURE_AD_CLIENT_ID: process.env.AZURE_AD_CLIENT_ID ? '***SET***' : 'NOT SET',
    AZURE_AD_CLIENT_SECRET: process.env.AZURE_AD_CLIENT_SECRET ? '***SET***' : 'NOT SET',
    AZURE_AD_TENANT_ID: process.env.AZURE_AD_TENANT_ID ? '***SET***' : 'NOT SET',
  });
}
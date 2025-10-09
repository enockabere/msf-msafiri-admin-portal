import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token;
  
  // Redirect to the public QR scan page
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const redirectUrl = `${baseUrl}/public/qr/${token}`;
  
  return NextResponse.redirect(redirectUrl);
}
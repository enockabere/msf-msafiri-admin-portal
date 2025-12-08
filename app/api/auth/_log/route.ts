import { NextResponse } from 'next/server';

export async function POST() {
  // Silently accept and ignore NextAuth log requests
  return NextResponse.json({ ok: true }, { status: 200 });
}

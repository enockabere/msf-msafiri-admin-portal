import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant from referer header
    const referer = request.headers.get('referer') || '';
    const tenantMatch = referer.match(/\/tenant\/([^/]+)/);
    const tenantSlug = tenantMatch ? tenantMatch[1] : null;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${session.user.accessToken}`,
      'Content-Type': 'application/json',
    };
    
    if (tenantSlug) {
      headers['X-Tenant-ID'] = tenantSlug;
    }
    
    const response = await fetch(`${apiUrl}/api/v1/notifications/stats`, {
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        errorData,
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
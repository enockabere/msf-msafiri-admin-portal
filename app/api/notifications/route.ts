import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread_only') === 'true';
    
    // Get tenant from URL path
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const tenantIndex = pathSegments.indexOf('tenant');
    const tenantSlug = tenantIndex !== -1 && tenantIndex + 1 < pathSegments.length ? pathSegments[tenantIndex + 1] : null;
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const query = unreadOnly ? '?unread_only=true' : '';
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${session.user.accessToken}`,
      'Content-Type': 'application/json',
    };
    
    if (tenantSlug) {
      headers['X-Tenant-ID'] = tenantSlug;
    }
    
    const response = await fetch(`${apiUrl}/api/v1/notifications${query}`, {
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend API error for notifications:', {
        status: response.status,
        errorData,
        url: `${apiUrl}/api/v1/notifications${query}`,
      });
      return NextResponse.json(
        errorData,
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
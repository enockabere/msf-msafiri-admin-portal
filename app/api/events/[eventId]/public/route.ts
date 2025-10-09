import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    // url could be used for query parameters
    // const url = new URL(request.url);
    // tenantSlug could be used for multi-tenant support
    // const tenantSlug = url.searchParams.get('tenant') || 'msf-oca';
    
    // For now, use the same approach as the admin form - just return the event data
    // In a real implementation, this would fetch from your backend
    const mockEvent = {
      id: parseInt(eventId),
      title: "MSF Kenya Annual Health Innovation Summit 2025",
      description: "Annual health innovation summit",
      start_date: "2025-10-13",
      end_date: "2025-10-16", 
      location: "Safari Park Hotel & Conference Centre",
      registration_form_title: null,
      registration_deadline: "2025-10-10"
    };

    return NextResponse.json(mockEvent);
  } catch (error) {
    console.error('Error fetching public event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}
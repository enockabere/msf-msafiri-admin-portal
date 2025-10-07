import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const eventId = params.eventId;
    
    // This would typically fetch from your backend API
    // For now, returning mock data
    const event = {
      id: parseInt(eventId),
      title: "Sample Training Event",
      description: "A comprehensive training program",
      start_date: "2024-02-01",
      end_date: "2024-02-05",
      location: "Amsterdam, Netherlands",
      registration_form_title: "Training Registration Form"
    };

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error fetching public event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}
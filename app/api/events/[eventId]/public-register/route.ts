import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const eventId = params.eventId;
    const formData = await request.json();
    
    console.log('Public registration for event:', eventId, formData);
    
    // This would typically send to your backend API
    // For now, just logging and returning success
    
    return NextResponse.json({ 
      success: true, 
      message: 'Registration submitted successfully' 
    });
  } catch (error) {
    console.error('Error processing public registration:', error);
    return NextResponse.json(
      { error: 'Failed to process registration' },
      { status: 500 }
    );
  }
}
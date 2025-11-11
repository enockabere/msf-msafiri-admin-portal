import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event_id, email, name } = body;
    
    if (!email || !event_id) {
      return NextResponse.json(
        { error: "Email and event_id are required" },
        { status: 400 }
      );
    }

    // Send email notification
    try {
      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/notifications/send-registration-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: request.headers.get("authorization") || "",
        },
        body: JSON.stringify({
          to_email: email,
          subject: "MSafiri Voucher Scanner Access",
          message: `
Hello ${name || email},

You have been assigned as a voucher scanner for an MSF event.

Your scanner credentials:
- Email: ${email}
- Temporary Password: TempPassword123!

To start scanning vouchers:
1. Visit: http://41.90.97.253:3000/scanner?event_id=${event_id}&tenant_id=1
2. Login with your credentials
3. Start scanning participant vouchers

Please change your password after first login.

Best regards,
MSF Kenya Team
          `
        })
      });

      if (!emailResponse.ok) {
        console.error("Failed to send email notification");
      }
    } catch (emailError) {
      console.error("Email notification error:", emailError);
    }

    return NextResponse.json({
      id: Date.now(),
      email,
      name: name || email,
      is_active: true,
      created_at: new Date().toISOString(),
      created_by: "admin",
      event_id: parseInt(event_id)
    });

  } catch (error) {
    console.error("Error creating voucher scanner:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
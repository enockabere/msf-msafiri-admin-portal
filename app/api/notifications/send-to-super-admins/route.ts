import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://msafiri-visitor-api.onrender.com";

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 API Route: Received request to send notifications to super admins');
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.accessToken) {
      console.log('❌ API Route: No session or access token');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log('📝 API Route: Request body:', body);

    console.log('🌐 API Route: Calling backend API at:', `${API_BASE_URL}/api/v1/notifications/send-to-super-admins`);
    const response = await fetch(`${API_BASE_URL}/api/v1/notifications/send-to-super-admins`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${session.user.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    console.log('📊 API Route: Backend response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Failed to send notification to super admins" }));
      console.log('❌ API Route: Backend error:', errorData);
      return NextResponse.json({ error: errorData.detail }, { status: response.status });
    }

    const data = await response.json();
    console.log('✅ API Route: Backend success:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error sending notification to super admins:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
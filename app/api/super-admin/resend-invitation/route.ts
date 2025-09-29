import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { invitationId } = await request.json();

    if (!invitationId) {
      return NextResponse.json({ error: "Invitation ID is required" }, { status: 400 });
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/super-admin/resend-invitation/${invitationId}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${session.user.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Failed to resend invitation" }));
      return NextResponse.json({ error: errorData.detail }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error resending invitation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/super-admin/pending-invitations`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${session.user.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Failed to fetch pending invitations" }));
      return NextResponse.json({ error: errorData.detail }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching pending invitations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
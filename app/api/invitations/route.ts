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

    const body = await request.json();
    
    // Validate required fields
    if (!body.email || !body.full_name || !body.role || !body.tenant_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    const apiUrl = `${API_BASE_URL}/api/v1/invitations/`;
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.user.accessToken}`,
        "X-Tenant-ID": body.tenant_id,
      },
      body: JSON.stringify(body),
    }).catch(error => {
      throw error;
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { detail: "Failed to send invitation" };
      }
      
      return NextResponse.json({ error: errorData.detail || "Failed to send invitation" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Invitation API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
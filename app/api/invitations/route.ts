import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

const API_BASE_URL = "http://localhost:8000";

export async function POST(request: NextRequest) {
  console.log("Invitation API route called");
  
  try {
    const session = await getServerSession(authOptions);
    console.log("Session:", session ? "exists" : "null");
    
    if (!session?.user?.accessToken) {
      console.log("No access token found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Request body:", body);
    
    // Validate required fields
    if (!body.email || !body.full_name || !body.role || !body.tenant_id) {
      console.log("Missing required fields");
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    const apiUrl = `${API_BASE_URL}/api/v1/invitations/`;
    console.log("Making request to:", apiUrl);
    
    console.log("About to make fetch request...");
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.user.accessToken}`,
        "X-Tenant-ID": body.tenant_id,
      },
      body: JSON.stringify(body),
    }).catch(error => {
      console.log("Fetch error:", error);
      throw error;
    });

    console.log("API response status:", response.status);
    console.log("API response headers:", Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log("API error response text:", errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { detail: "Failed to send invitation" };
      }
      
      console.log("API error parsed:", errorData);
      return NextResponse.json({ error: errorData.detail || "Failed to send invitation" }, { status: response.status });
    }

    const data = await response.json();
    console.log("API success:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Invitation API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}